from fastapi import FastAPI
from langgraph.graph import MessageGraph
from typing import List

# 1. Create the FastAPI app
app = FastAPI()

# 2. Define the LangGraph "Brain"
# This is a simple graph that just takes a message and adds a response
builder = MessageGraph()
builder.add_node("oracle", lambda state: "Hello! Your backend is officially alive.")
builder.set_entry_point("oracle")
builder.set_finish_point("oracle")

# Compile the graph so it's ready to run
agent = builder.compile()

# 3. Create the API Endpoint
@app.get("/chat")
async def chat_with_agent():
    # We invoke the graph with a starting message
    result = await agent.ainvoke("Hi")
    
    # LangGraph returns the full list of messages, 
    # so we grab the last one to send to the frontend
    return {"reply": result[-1]}

@app.get("/")
def home():
    return {"status": "Server is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)