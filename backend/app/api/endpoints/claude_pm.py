"""
Claude Code PM integration endpoints
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import subprocess
import os
from typing import Dict, Any

router = APIRouter()

@router.get("/status")
async def claude_pm_status():
    """Check Claude Code PM status and configuration"""
    try:
        # Check if Claude Code PM is installed and accessible
        result = subprocess.run(
            ["claude", "--version"], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        
        is_installed = result.returncode == 0
        version = result.stdout.strip() if is_installed else "Not installed"
        
        return {
            "status": "operational" if is_installed else "not_installed",
            "claude_pm_installed": is_installed,
            "version": version,
            "timestamp": datetime.utcnow().isoformat(),
            "endpoints": [
                "/api/v1/claude-pm/status",
                "/api/v1/claude-pm/config",
                "/api/v1/claude-pm/epics"
            ]
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Claude Code PM check timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking Claude Code PM: {str(e)}")

@router.get("/config")
async def claude_pm_config():
    """Get Claude Code PM configuration information"""
    try:
        # Check for common Claude Code PM configuration files
        config_paths = [
            os.path.expanduser("~/.claude/config.json"),
            os.path.expanduser("~/.config/claude/config.json"),
            "./.claude/config.json"
        ]
        
        config_files = []
        for path in config_paths:
            if os.path.exists(path):
                config_files.append(path)
        
        return {
            "config_files_found": config_files,
            "config_directory": os.path.expanduser("~/.claude"),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting config: {str(e)}")

@router.get("/epics")
async def list_epics():
    """List available Claude Code PM epics"""
    try:
        # This would typically query Claude Code PM for available epics
        # For now, return a mock response
        return {
            "epics": [
                {
                    "id": "test-epic-1",
                    "name": "Test Epic",
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat()
                }
            ],
            "total_count": 1,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing epics: {str(e)}")

@router.post("/epics")
async def create_epic(epic_data: Dict[str, Any]):
    """Create a new Claude Code PM epic"""
    try:
        # This would typically create an epic using Claude Code PM CLI
        # For now, return a mock response
        return {
            "epic_id": "new-epic-123",
            "name": epic_data.get("name", "New Epic"),
            "status": "created",
            "created_at": datetime.utcnow().isoformat(),
            "message": "Epic created successfully (mock response)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating epic: {str(e)}")
