"""
CLI command endpoint for CCPM
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.cli.cli import CCPMCLI

router = APIRouter()


class CLICommandRequest(BaseModel):
    """Request model for CLI commands"""
    command: str
    output_format: Optional[str] = "text"


class CLICommandResponse(BaseModel):
    """Response model for CLI commands"""
    success: bool
    output: str
    error: Optional[str] = None


@router.post("/execute", response_model=CLICommandResponse)
async def execute_cli_command(request: CLICommandRequest):
    """Execute a CCPM CLI command"""
    try:
        cli = CCPMCLI()
        result = await cli.execute(request.command, request.output_format)
        await cli.close()
        
        return CLICommandResponse(
            success=True,
            output=result
        )
    except Exception as e:
        return CLICommandResponse(
            success=False,
            output="",
            error=str(e)
        )


@router.get("/help")
async def get_cli_help():
    """Get CLI help information"""
    try:
        cli = CCPMCLI()
        help_text = await cli.execute("/pm:help", "text")
        await cli.close()
        
        return {
            "success": True,
            "help_text": help_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting help: {str(e)}")


@router.get("/status")
async def get_cli_status():
    """Get CLI system status"""
    try:
        cli = CCPMCLI()
        status = await cli.execute("/pm:status", "text")
        await cli.close()
        
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")
