import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from schemas import ChatRequest, BackendAgentResponse
from agent import run_travel_agent_llm, fetch_local_mock_spots, geocode_destination, fetch_overpass_spots

app = FastAPI(title="VietTravel AI Backend", version="1.0.0")

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins since it's local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=BackendAgentResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        response = await run_travel_agent_llm(request.message, request.trip)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal agent error: {str(e)}")

@app.get("/api/spots")
async def spots_endpoint(destination: str):
    """Return a list of tourist attraction names for any Vietnamese destination."""
    if not destination:
        raise HTTPException(status_code=400, detail="destination query param is required")

    try:
        dest_info = await geocode_destination(destination)
        local_spots = fetch_local_mock_spots(destination)

        overpass_spots = []
        if dest_info:
            lat, lon = dest_info["center"]
            overpass_spots = await fetch_overpass_spots(lat, lon)

        combined = local_spots + overpass_spots
        seen = set()
        unique = []
        for s in combined:
            if s["name"] not in seen:
                unique.append(s)
                seen.add(s["name"])

        spot_list = [
            {"name": s["name"], "address": s.get("address", ""), "type": s.get("type", "sightseeing")}
            for s in unique[:12]
        ]
        return {"destination": destination, "spots": spot_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching spots: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": {
        "ollama_base_url": os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        "ollama_model": os.environ.get("OLLAMA_MODEL", "qwen"),
        "has_gemini_key": bool(os.environ.get("GEMINI_API_KEY")),
        "has_openai_key": bool(os.environ.get("OPENAI_API_KEY"))
    }}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
