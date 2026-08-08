from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.style import router as style_router
from app.services.style_profile_service import StyleProfileService
app = FastAPI(
    title="AI Style Copilot",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods= ["*"],
    allow_headers=["*"],
    
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-style-copilot"
    }


app.include_router(style_router)