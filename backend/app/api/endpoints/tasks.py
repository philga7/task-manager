"""
Task management endpoints for React frontend integration
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter()

# Pydantic models for request/response validation
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None
    project_id: Optional[str] = None
    type: Optional[str] = "task"  # task, prd, issue, epic

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    priority: str
    status: str
    due_date: Optional[str]
    project_id: Optional[str]
    type: str
    created_at: str
    updated_at: str

# Mock data storage (in a real app, this would be a database)
tasks_db = {}

@router.get("/", response_model=List[TaskResponse])
async def get_tasks():
    """Get all tasks"""
    try:
        return list(tasks_db.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get a specific task by ID"""
    try:
        if task_id not in tasks_db:
            raise HTTPException(status_code=404, detail="Task not found")
        return tasks_db[task_id]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching task: {str(e)}")

@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """Create a new task"""
    try:
        task_id = f"task_{len(tasks_db) + 1}_{int(datetime.utcnow().timestamp())}"
        
        new_task = TaskResponse(
            id=task_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status="pending",
            due_date=task.due_date,
            project_id=task.project_id,
            type=task.type,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        
        tasks_db[task_id] = new_task.dict()
        return new_task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate):
    """Update an existing task"""
    try:
        if task_id not in tasks_db:
            raise HTTPException(status_code=404, detail="Task not found")
        
        current_task = tasks_db[task_id]
        
        # Update only provided fields
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            current_task[field] = value
        
        current_task["updated_at"] = datetime.utcnow().isoformat()
        
        return TaskResponse(**current_task)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    try:
        if task_id not in tasks_db:
            raise HTTPException(status_code=404, detail="Task not found")
        
        del tasks_db[task_id]
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

@router.get("/status/summary")
async def get_task_summary():
    """Get task summary statistics"""
    try:
        total_tasks = len(tasks_db)
        pending_tasks = len([t for t in tasks_db.values() if t["status"] == "pending"])
        completed_tasks = len([t for t in tasks_db.values() if t["status"] == "completed"])
        
        return {
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting task summary: {str(e)}")
