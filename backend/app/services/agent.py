# LangGraph agent service

import json
import logging

from typing import TypedDict, Optional, List, Annotated

logger = logging.getLogger(__name__)
from app.schemas.classification import WasteClassificationItem, DisposalInstruction, DisposalFacility
from app.services.gemini_service import parse_json_response, GeminiClassificationService
from app.services.places_service import enrich_facilities
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_tavily import TavilySearch
from app.core.config import settings
from app.services.cache_service import cache_lookup_tool

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

# Gemini model with both search AND cache tools
model_with_tools = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
).bind_tools([search_tool, cache_lookup_tool])


DISPOSAL_PROMPT = """\
You are a Waste Disposal Advisor with access to two tools:
1. cache_lookup_tool - Check if disposal instructions are already cached
2. TavilySearch - Search the web for current disposal regulations

User location: {location}

**Workflow:**
1. FIRST, use cache_lookup_tool to check if we have recent data for each item.
2. If cache HIT and data is <7 days old: Use cached instructions (fast, accurate).
3. If cache HIT but data is >7 days old: Consider verifying with TavilySearch.
4. If cache MISS: Use TavilySearch to find CURRENT, LOCAL disposal regulations.
5. If searching the web, use location + item-specific queries for precise local results.

**Your job:**
- For each waste item below, decide: use cache, search web, or both?
- If searching: use the provided search_query + location for targeted results
- Only stop when you have specific local disposal information
- Also find 1-3 nearby disposal/recycling facilities with full address

Return ONLY a JSON array (no markdown fences) where each element is:
{{
  "item_name": "string (must match input)",
  "material_type": "string (must match input)",
  "instruction": "1-3 sentences with SPECIFIC local disposal instructions",
  "facilities": [
    {{
      "name": "Facility Name",
      "address": "123 Main St, City, State ZIP"
    }}
  ]
}}

If you do not detect any waste items, return a JSON array with one object using these fields:
{{
  "item_name": "unknown",
  "material_type": "unknown",
  "instruction": "No specific items detected. Please provide more details or try again.",
  "facilities": []
}}

Never return plain text or explanations—always return a JSON array as specified above.

Waste items to research:
{items_json}
"""

## Create nodes
# First, we will have a router node that decides between text and image classification
def router_node(state: InputState) -> str:
    location = state.get("location")
    if state.get("image_base64"):
        logger.info("Router: image path selected — location=%r", location)
        return "image_classification"
    elif state.get("message"):
        logger.info("Router: text path selected — location=%r", location)
        return "text_classification"
    else:
        logger.error("Router: neither image nor message provided")
        raise ValueError("Either an image or a message is required.")

# Define the nodes for image and text classification. Must be async due to model network call.
async def image_classification_node(state: OverallState) -> OverallState:
    location = state.get("location")
    logger.info("image_classification_node: starting — location=%r", location)
    items = await gemini_service.classify_image(
        image_base64=state["image_base64"],
        user_location=location,
    )
    logger.info("image_classification_node: classified %d item(s)", len(items))
    return {"items": items}

async def text_classification_node(state: OverallState) -> OverallState:
    location = state.get("location")
    logger.info("text_classification_node: starting — location=%r", location)
    items = await gemini_service.classify_text(
        message=state["message"],
        user_location=location,
    )
    logger.info("text_classification_node: classified %d item(s)", len(items))
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
    existing_messages = state.get("messages") or []
    loop_iteration = len([m for m in existing_messages if hasattr(m, "tool_calls")])

    # Only build the initial prompt on the first call (no messages yet)
    if not existing_messages:
        items = state["items"]
        location = state.get("location", "Unknown")

        logger.info(
            "disposal_agent_node [iter=0]: first call — location=%r items=%s",
            location,
            [i.item_name for i in items],
        )

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
        initial_message = HumanMessage(content=filled_prompt)
        messages = [initial_message]
    else:
        initial_message = None
        messages = existing_messages
        location = state.get("location", "Unknown")
        logger.info("disposal_agent_node [iter=%d]: continuing agentic loop — location=%r", loop_iteration, location)

    response = await model_with_tools.ainvoke(messages)

    # Include the initial HumanMessage in returned messages so the full
    # conversation history is preserved in state for subsequent loop iterations.
    new_messages = [initial_message, response] if initial_message else [response]

    # Gemini is done searching — parse final JSON response
    if not response.tool_calls:
        logger.info("disposal_agent_node [iter=%d]: Gemini returned final answer (no tool calls)", loop_iteration)
        try:
            # Handle case where response.content is a list of content blocks
            content = response.content
            if isinstance(content, list):
                content = " ".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in content
                )

            logger.debug("disposal_agent_node: raw Gemini response content: %r", content[:1000] if content else None)
            instructions_data = parse_json_response(content)
            location = state.get("location")

            logger.info(
                "disposal_agent_node: parsed %d disposal instruction(s) — enriching facilities with location=%r",
                len(instructions_data), location,
            )

            instructions = []
            for inst in instructions_data:
                raw_facilities = inst.pop("facilities", [])
                logger.debug(
                    "disposal_agent_node: enriching %d facility/ies for item=%r — raw=%s",
                    len(raw_facilities), inst.get("item_name"), raw_facilities,
                )
                enriched = await enrich_facilities(raw_facilities, user_location=location)
                logger.debug(
                    "disposal_agent_node: enriched facilities for item=%r: %s",
                    inst.get("item_name"),
                    [{"name": f.name, "address": f.address, "lat": f.latitude, "lng": f.longitude} for f in enriched],
                )
                instruction = DisposalInstruction(**inst, facilities=enriched)
                instructions.append(instruction)

                # Automatically save to cache after enrichment
                from app.services.cache_service import DisposalCacheService
                from app.database import SessionLocal

                db = SessionLocal()
                cache_service = DisposalCacheService(db)
                try:
                    cache_service.save_instruction_sync(location, instruction, ttl_days=30)
                    db.commit()
                    logger.info("Saved to cache: %s|%s|%s", location, instruction.item_name, instruction.material_type)
                except Exception as e:
                    logger.error("Failed to cache: %s", e, exc_info=True)
                    db.rollback()
                finally:
                    db.close()

            return {"messages": new_messages, "disposal_instructions": instructions}
        except Exception as e:
            logger.error("disposal_agent_node: failed to parse disposal instructions: %s", e, exc_info=True)
            raise ValueError(f"Failed to parse disposal instructions: {e}")

    # Gemini wants to search — log the tool calls and continue loop
    tool_call_queries = [tc.get("args", {}) for tc in response.tool_calls]
    logger.info(
        "disposal_agent_node [iter=%d]: Gemini issued %d tool call(s) — queries=%s",
        loop_iteration, len(response.tool_calls), tool_call_queries,
    )
    return {"messages": new_messages}


## Create StateGraph
graph = StateGraph(OverallState, input=InputState, output=OutputState)

graph.add_node("image_classification", image_classification_node)
graph.add_node("text_classification", text_classification_node)
graph.add_node("disposal_agent", disposal_agent_node)
graph.add_node("tools", ToolNode([search_tool, cache_lookup_tool]))

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