# LangGraph agent service

import json

from typing import TypedDict, Optional, List, Annotated
from app.schemas.classification import WasteClassificationItem, DisposalInstruction
from app.services.gemini_service import parse_json_response, GeminiClassificationService
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_tavily import TavilySearch
from app.core.config import settings

## Set up classification service and states
gemini_service = GeminiClassificationService()

class InputState(TypedDict):
    image_base64: Optional[str]  # optional image
    message: Optional[str]       # optional text
    location: Optional[str]      # optional location

class OutputState(TypedDict):
    items: List[WasteClassificationItem]
    disposal_instructions: List[DisposalInstruction]

class OverallState(TypedDict):
    # Everything from input
    image_base64: Optional[str]
    message: Optional[str]
    location: Optional[str]

    # Intermediate fields only nodes need to see
    items: Optional[List[WasteClassificationItem]]

    # agentic loop messages
    messages: Annotated[List[BaseMessage], add_messages]  
    
    # Final output fields
    disposal_instructions: Optional[List[DisposalInstruction]]

# Tavily tool - web search
search_tool = TavilySearch(
    max_results=5,
    search_depth="basic",
    include_answer=True,
    include_raw_content=False,
    tavily_api_key=settings.TAVILY_API_KEY
)

# Gemini model with tool bound
model_with_tools = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
).bind_tools([search_tool])


DISPOSAL_PROMPT = """\
You are a Waste Disposal Advisor with access to a web search tool.

User location: {location}

Your job:
1. Search for CURRENT, LOCAL disposal regulations for each item below.
   Use the provided search_query + the user's location for precise local results.
2. If your first search is too generic, search again with a more specific query.
   e.g. "{location} recycling program" or "{location} hazardous waste drop-off"
3. Only stop searching when you have specific local policy information.
4. Return ONLY a JSON array (no markdown fences) where each element is:
{{
  "item_name": "string (must match input)",
  "material_type": "string (must match input)",  
  "instruction": "1-3 sentences with SPECIFIC local disposal instructions"
}}

Waste items to research:
{items_json}
"""

## Create nodes
# First, we will have a router node that decides between text and image classification
def router_node(state: InputState) -> str:
    if state.get("image_base64"):
        return "image_classification"
    elif state.get("message"):
        return "text_classification"
    else:
        raise ValueError("Either an image or a message is required.")

# Define the nodes for image and text classification. Must be async due to model network call.
async def image_classification_node(state: OverallState) -> OverallState:
    items = await gemini_service.classify_image(
        image_base64=state["image_base64"],
        user_location=state.get("location")
    )

    return {"items": items}

async def text_classification_node(state: OverallState) -> OverallState:
    items = await gemini_service.classify_text(
        message=state["message"],
        user_location=state.get("location")
    )

    return {"items": items}

async def disposal_agent_node(state: OverallState) -> dict:
    """
    Agentic disposal node. Gemini decides when to call TavilySearch and how many times — looping until it has enough local policy info.

    Flow:
    1. First call — Gemini gets items + location, decides to search
    2. ToolNode executes search, results appended to messages
    3. Gemini gets results, may search again for more specific info
    4. When satisfied, Gemini returns final JSON disposal instructions
    """
    # Only build the initial prompt on the first call (no messages yet)
    if not state.get("messages"):
        items = state["items"]
        location = state.get("location", "Unknown")

        items_json = json.dumps([
            {
                "item_name": item.item_name,
                "material_type": item.material_type,
                "is_hazardous": item.is_hazardous,
                "is_soiled": item.is_soiled,
                "search_query": item.search_query,
            }
            for item in items
        ], indent=2)
    
        filled_prompt = DISPOSAL_PROMPT.format(
            location=location,
            items_json=items_json
        )
        messages = [HumanMessage(content=filled_prompt)]
    else:
        messages = state["messages"]
    
    response = await model_with_tools.ainvoke(messages)

    # Gemini is done searching — parse final JSON response
    if not response.tool_calls:
        try:
            instructions_data = parse_json_response(response.content)
            instructions = [DisposalInstruction(**inst) for inst in instructions_data]
            return {"messages": [response], "disposal_instructions": instructions}
        except Exception as e:
            raise ValueError(f"Failed to parse disposal instructions: {e}")

    # Gemini wants to search — return tool call message, ToolNode handles the rest
    return {"messages": [response]}


## Create StateGraph
graph = StateGraph(OverallState, input=InputState, output=OutputState)

graph.add_node("image_classification", image_classification_node)
graph.add_node("text_classification", text_classification_node)
graph.add_node("disposal_agent", disposal_agent_node)
graph.add_node("tools", ToolNode([search_tool]))

graph.add_conditional_edges(START, router_node, {
    "image_classification": "image_classification",
    "text_classification": "text_classification"
})

graph.add_edge("image_classification", "disposal_agent")
graph.add_edge("text_classification", "disposal_agent")

# Agentic loop
graph.add_conditional_edges("disposal_agent", tools_condition, {
    "tools": "tools",
    END: END,
})
graph.add_edge("tools", "disposal_agent")

agent = graph.compile()