from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import MessageGraph

from app.routes.classification import router as classification_router

app = FastAPI(title="Landfill Legends API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classification_router)

builder = MessageGraph()
builder.add_node("oracle", lambda state: "Hello! Your backend is officially alive.")
builder.set_entry_point("oracle")
builder.set_finish_point("oracle")
agent = builder.compile()


@app.get("/chat")
async def chat_with_agent():
    result = await agent.ainvoke("Hi")
    return {"reply": result[-1]}


@app.get("/")
def home():
    return {"status": "Server is running"}