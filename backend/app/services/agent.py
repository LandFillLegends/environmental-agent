# LangGraph agent service
from typing import TypedDict, Optional, List
from app.schemas.classification import WasteClassificationItem, DisposalInstruction
from app.services.gemini_service import GeminiClassificationService
from langgraph.graph import StateGraph, START, END

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
    
    # Final output fields
    disposal_instructions: Optional[List[DisposalInstruction]]

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

async def disposal_instructions_node(state: OverallState) -> OverallState:
    instructions = await gemini_service.get_disposal_instructions(
        items=state["items"]
    )
    return {"disposal_instructions": instructions}

## Create StateGraph
graph = StateGraph(OverallState, input=InputState, output=OutputState)

graph.add_node("image_classification", image_classification_node)
graph.add_node("text_classification", text_classification_node)
graph.add_node("disposal_instructions", disposal_instructions_node)

graph.add_conditional_edges(START, router_node, {
    "image_classification": "image_classification",
    "text_classification": "text_classification"
})

graph.add_edge("image_classification", "disposal_instructions")
graph.add_edge("text_classification", "disposal_instructions")
graph.add_edge("disposal_instructions", END)

agent = graph.compile()