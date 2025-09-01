"""
Main API router for Claude Code PM backend
"""
from fastapi import APIRouter
from .endpoints import health, claude_pm, tasks, task_decomposition, agent_communication, cli

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(claude_pm.router, prefix="/claude-pm", tags=["claude-pm"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(task_decomposition.router, prefix="/task-decomposition", tags=["task-decomposition"])
api_router.include_router(agent_communication.router, prefix="/agent-communication", tags=["agent-communication"])
api_router.include_router(cli.router, prefix="/cli", tags=["cli"])
