from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.classification import router as classification_router

# 1. Create the FastAPI app
app = FastAPI(title="Landfill Legends API", version="1.0.0")

# 2. CORS — allows the React Native frontend to talk to this server.
#    In production, replace "*" with your actual frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register routers — each router is a group of related endpoints.
#    The classification router adds POST /api/v1/classify
app.include_router(classification_router)

@app.get("/")
def home():
    return {"status": "Server is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)