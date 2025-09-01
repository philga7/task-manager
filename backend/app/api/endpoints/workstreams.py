"""
Workstream management endpoints for CCPM integration
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter()

# Pydantic models for request/response validation
class WorkstreamCreate(BaseModel):
    name: str
    description: str
    priority: str = "medium"
    estimatedDuration: int = 60
    assignedAgents: List[str] = []
    dependencies: List[str] = []
    metadata: Dict[str, Any] = {}

class WorkstreamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimatedDuration: Optional[int] = None
    actualDuration: Optional[int] = None
    assignedAgents: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class WorkstreamResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    priority: str
    estimatedDuration: int
    actualDuration: Optional[int]
    startTime: Optional[str]
    completionTime: Optional[str]
    assignedAgents: List[str]
    dependencies: List[str]
    metadata: Dict[str, Any]
    createdAt: str
    updatedAt: str

# Mock data storage (in a real app, this would be a database)
workstreams_db = {}

@router.get("/", response_model=List[WorkstreamResponse])
async def get_workstreams():
    """Get all workstreams"""
    try:
        return list(workstreams_db.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching workstreams: {str(e)}")

@router.get("/{workstream_id}", response_model=WorkstreamResponse)
async def get_workstream(workstream_id: str):
    """Get a specific workstream by ID"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        return workstreams_db[workstream_id]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching workstream: {str(e)}")

@router.post("/", response_model=WorkstreamResponse)
async def create_workstream(workstream: WorkstreamCreate):
    """Create a new workstream"""
    try:
        workstream_id = f"ws_{len(workstreams_db) + 1}_{int(datetime.utcnow().timestamp())}"
        
        new_workstream = WorkstreamResponse(
            id=workstream_id,
            name=workstream.name,
            description=workstream.description,
            status="pending",
            priority=workstream.priority,
            estimatedDuration=workstream.estimatedDuration,
            actualDuration=None,
            startTime=None,
            completionTime=None,
            assignedAgents=workstream.assignedAgents,
            dependencies=workstream.dependencies,
            metadata=workstream.metadata,
            createdAt=datetime.utcnow().isoformat(),
            updatedAt=datetime.utcnow().isoformat()
        )
        
        workstreams_db[workstream_id] = new_workstream.dict()
        return new_workstream
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating workstream: {str(e)}")

@router.put("/{workstream_id}", response_model=WorkstreamResponse)
async def update_workstream(workstream_id: str, workstream_update: WorkstreamUpdate):
    """Update an existing workstream"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        current_workstream = workstreams_db[workstream_id]
        
        # Update only provided fields
        update_data = workstream_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            current_workstream[field] = value
        
        # Handle special cases
        if "status" in update_data:
            if update_data["status"] == "running" and not current_workstream.get("startTime"):
                current_workstream["startTime"] = datetime.utcnow().isoformat()
            elif update_data["status"] == "completed" and not current_workstream.get("completionTime"):
                current_workstream["completionTime"] = datetime.utcnow().isoformat()
        
        current_workstream["updatedAt"] = datetime.utcnow().isoformat()
        
        return WorkstreamResponse(**current_workstream)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating workstream: {str(e)}")

@router.delete("/{workstream_id}")
async def delete_workstream(workstream_id: str):
    """Delete a workstream"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        del workstreams_db[workstream_id]
        return {"message": "Workstream deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting workstream: {str(e)}")

@router.get("/status/summary")
async def get_workstream_summary():
    """Get workstream summary statistics"""
    try:
        total_workstreams = len(workstreams_db)
        pending_workstreams = len([w for w in workstreams_db.values() if w["status"] == "pending"])
        running_workstreams = len([w for w in workstreams_db.values() if w["status"] == "running"])
        completed_workstreams = len([w for w in workstreams_db.values() if w["status"] == "completed"])
        blocked_workstreams = len([w for w in workstreams_db.values() if w["status"] == "blocked"])
        
        return {
            "total_workstreams": total_workstreams,
            "pending_workstreams": pending_workstreams,
            "running_workstreams": running_workstreams,
            "completed_workstreams": completed_workstreams,
            "blocked_workstreams": blocked_workstreams,
            "completion_rate": (completed_workstreams / total_workstreams * 100) if total_workstreams > 0 else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting workstream summary: {str(e)}")

@router.post("/{workstream_id}/start")
async def start_workstream(workstream_id: str):
    """Start a workstream execution"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        workstream = workstreams_db[workstream_id]
        if workstream["status"] != "pending":
            raise HTTPException(status_code=400, detail="Workstream is not in pending status")
        
        workstream["status"] = "running"
        workstream["startTime"] = datetime.utcnow().isoformat()
        workstream["updatedAt"] = datetime.utcnow().isoformat()
        
        return {"message": f"Workstream {workstream_id} started successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting workstream: {str(e)}")

@router.post("/{workstream_id}/complete")
async def complete_workstream(workstream_id: str):
    """Mark a workstream as completed"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        workstream = workstreams_db[workstream_id]
        if workstream["status"] != "running":
            raise HTTPException(status_code=400, detail="Workstream is not running")
        
        workstream["status"] = "completed"
        workstream["completionTime"] = datetime.utcnow().isoformat()
        workstream["updatedAt"] = datetime.utcnow().isoformat()
        
        # Calculate actual duration if start time exists
        if workstream.get("startTime"):
            start_time = datetime.fromisoformat(workstream["startTime"])
            completion_time = datetime.utcnow()
            actual_duration = int((completion_time - start_time).total_seconds() / 60)
            workstream["actualDuration"] = actual_duration
        
        return {"message": f"Workstream {workstream_id} completed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing workstream: {str(e)}")

@router.post("/{workstream_id}/block")
async def block_workstream(workstream_id: str, reason: str = "Blocked by dependency"):
    """Block a workstream"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        workstream = workstreams_db[workstream_id]
        workstream["status"] = "blocked"
        workstream["metadata"]["blockReason"] = reason
        workstream["updatedAt"] = datetime.utcnow().isoformat()
        
        return {"message": f"Workstream {workstream_id} blocked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error blocking workstream: {str(e)}")

@router.get("/{workstream_id}/dependencies")
async def get_workstream_dependencies(workstream_id: str):
    """Get dependencies for a specific workstream"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        workstream = workstreams_db[workstream_id]
        dependencies = []
        
        for dep_id in workstream["dependencies"]:
            if dep_id in workstreams_db:
                dep = workstreams_db[dep_id]
                dependencies.append({
                    "id": dep["id"],
                    "name": dep["name"],
                    "status": dep["status"],
                    "priority": dep["priority"]
                })
        
        return {
            "workstream_id": workstream_id,
            "dependencies": dependencies,
            "total_dependencies": len(dependencies)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dependencies: {str(e)}")

@router.post("/{workstream_id}/dependencies")
async def add_workstream_dependency(workstream_id: str, dependency_id: str):
    """Add a dependency to a workstream"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        if dependency_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Dependency workstream not found")
        
        workstream = workstreams_db[workstream_id]
        if dependency_id not in workstream["dependencies"]:
            workstream["dependencies"].append(dependency_id)
            workstream["updatedAt"] = datetime.utcnow().isoformat()
        
        return {"message": f"Dependency {dependency_id} added to workstream {workstream_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding dependency: {str(e)}")

@router.delete("/{workstream_id}/dependencies/{dependency_id}")
async def remove_workstream_dependency(workstream_id: str, dependency_id: str):
    """Remove a dependency from a workstream"""
    try:
        if workstream_id not in workstreams_db:
            raise HTTPException(status_code=404, detail="Workstream not found")
        
        workstream = workstreams_db[workstream_id]
        if dependency_id in workstream["dependencies"]:
            workstream["dependencies"].remove(dependency_id)
            workstream["updatedAt"] = datetime.utcnow().isoformat()
        
        return {"message": f"Dependency {dependency_id} removed from workstream {workstream_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing dependency: {str(e)}")
