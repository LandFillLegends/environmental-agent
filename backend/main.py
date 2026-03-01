from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import MessageGraph
from app.routes import user
from app.routes.classification import router as classification_router
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Create the FastAPI app
app = FastAPI(title="Environmental Agent API", version="1.0.0")

# CORS — allows frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",                              # Expo local
        "https://environmental-agent-seven.vercel.app",      # Vercel production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router, prefix="/api/v1")
app.include_router(classification_router)

# LangGraph "Brain"
builder = MessageGraph()
builder.add_node("oracle", lambda state: "Hello! Your backend is officially alive.")
builder.set_entry_point("oracle")
builder.set_finish_point("oracle")
agent = builder.compile()

# API Endpoints
@app.get("/chat")
async def chat_with_agent():
    result = await agent.ainvoke("Hi")
    return {"reply": result[-1]}

@app.get("/")
def home():
    return {"status": "Server is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)