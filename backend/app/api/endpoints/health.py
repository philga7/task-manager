"""
Health check endpoints
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import psutil
import os

router = APIRouter()

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "claude-code-pm-backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0"
    }

@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with system information"""
    try:
        # Get system information
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "status": "healthy",
            "service": "claude-code-pm-backend",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "0.1.0",
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "process_id": os.getpid()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.get("/status")
async def status_check():
    """Status check endpoint for CCPM integration"""
    return {
        "status": "healthy",
        "service": "claude-code-pm-backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
        "ccpm_integration": "enabled",
        "endpoints": {
            "health": "/api/v1/health",
            "tasks": "/api/v1/tasks",
            "workstreams": "/api/v1/workstreams",
            "claude_pm": "/api/v1/claude-pm"
        }
    }
