import sys
from pathlib import Path

# Add app directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from api import router
from database import db

app = FastAPI(title="Disaster Response Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve frontend
web_dir = Path(__file__).parent.parent / "web"
if not web_dir.exists():
    web_dir.mkdir(parents=True, exist_ok=True)
    (web_dir / "index.html").write_text("<html><body><h1>Disaster Response Platform Frontend (Mock)</h1></body></html>")

app.mount("/web", StaticFiles(directory=str(web_dir)), name="web")

@app.get("/")
async def serve_frontend():
    return FileResponse(str(web_dir / "index.html"))

@app.on_event("startup")
async def startup():
    db.load_demo_data()
    print("Disaster Response Platform started")
    print("Dashboard: http://localhost:8000")
    print("API docs: http://localhost:8000/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
