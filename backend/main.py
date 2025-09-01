"""
Main FastAPI application for Claude Code PM backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

# Import API router
from app.api.main import api_router

# Load environment variables
load_dotenv()

# Create FastAPI app instance
app = FastAPI(
    title="Claude Code PM Backend",
    description="Backend API for Claude Code PM agent coordination and task management",
    version="0.1.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "Claude Code PM Backend is running!",
        "status": "healthy",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "claude-code-pm-backend",
        "version": "0.1.0"
    }

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api": "Claude Code PM Backend API",
        "status": "operational",
        "endpoints": [
            "/",
            "/health", 
            "/api/status",
            "/api/v1/health",
            "/api/v1/claude-pm/status",
            "/api/v1/tasks",
            "/docs"  # Auto-generated API documentation
        ]
    }

if __name__ == "__main__":
    # Run the application
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Auto-reload on code changes (development)
        log_level="info"
    )
