"""
Agent communication endpoints for React frontend integration
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from ...services.AgentCommunication import agent_communication_service
from ...models.Messages import (
    AgentInfo, AgentStatus, ContextData, ProgressData, ResourceRequest,
    ConflictData, CommunicationMetrics, MessageType, MessagePriority
)

router = APIRouter()

# Pydantic models for request/response validation
class AgentRegistrationRequest(BaseModel):
    agent_name: str
    agent_type: str
    capabilities: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class AgentRegistrationResponse(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    status: str
    registered_at: str

class ContextShareRequest(BaseModel):
    sender_id: str
    task_id: Optional[str] = None
    workstream_id: Optional[str] = None
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    expires_at: Optional[str] = None
    recipient_ids: Optional[List[str]] = None

class ProgressUpdateRequest(BaseModel):
    sender_id: str
    task_id: str
    workstream_id: Optional[str] = None
    progress_percentage: float
    status: str
    completed_steps: Optional[List[str]] = None
    remaining_steps: Optional[List[str]] = None
    estimated_completion: Optional[str] = None
    blockers: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    recipient_ids: Optional[List[str]] = None

class ResourceRequestRequest(BaseModel):
    sender_id: str
    resource_id: str
    resource_type: str
    requested_access: str
    duration_minutes: Optional[int] = None
    priority: str = "normal"
    reason: Optional[str] = None
    recipient_ids: Optional[List[str]] = None

class ConflictResolutionRequest(BaseModel):
    sender_id: str
    conflict_type: str
    description: str
    involved_agents: List[str]
    proposed_solution: Optional[str] = None
    requires_human_intervention: bool = False
    recipient_ids: Optional[List[str]] = None

class HeartbeatRequest(BaseModel):
    agent_id: str
    status: str = "available"
    current_task_id: Optional[str] = None

class ErrorReportRequest(BaseModel):
    sender_id: str
    error_type: str
    error_message: str
    stack_trace: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class CoordinationRequest(BaseModel):
    sender_id: str
    coordination_type: str
    coordination_data: Dict[str, Any]
    recipient_ids: Optional[List[str]] = None

class AgentStatusResponse(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    current_status: str
    current_task_id: Optional[str]
    last_heartbeat: str
    capabilities: List[str]
    metadata: Dict[str, Any]

class CommunicationMetricsResponse(BaseModel):
    total_messages_sent: int
    total_messages_received: int
    messages_by_type: Dict[str, int]
    average_response_time: Optional[float]
    failed_deliveries: int
    active_agents: int
    last_updated: str

# Agent Management Endpoints
@router.post("/agents/register", response_model=AgentRegistrationResponse)
async def register_agent(request: AgentRegistrationRequest):
    """Register a new agent with the communication service"""
    try:
        # Create agent info
        agent_info = AgentInfo(
            agent_id=f"agent_{datetime.utcnow().timestamp()}_{hash(request.agent_name) % 10000}",
            agent_name=request.agent_name,
            agent_type=request.agent_type,
            capabilities=request.capabilities or [],
            metadata=request.metadata or {},
            current_status=AgentStatus.AVAILABLE
        )
        
        # Register with service
        if not agent_communication_service.register_agent(agent_info):
            raise HTTPException(status_code=500, detail="Failed to register agent")
        
        return AgentRegistrationResponse(
            agent_id=agent_info.agent_id,
            agent_name=agent_info.agent_name,
            agent_type=agent_info.agent_type,
            status=agent_info.current_status.value,
            registered_at=agent_info.last_heartbeat.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering agent: {str(e)}")

@router.delete("/agents/{agent_id}")
async def unregister_agent(agent_id: str):
    """Unregister an agent from the communication service"""
    try:
        if not agent_communication_service.unregister_agent(agent_id):
            raise HTTPException(status_code=404, detail="Agent not found")
        
        return {"message": f"Agent {agent_id} unregistered successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unregistering agent: {str(e)}")

@router.get("/agents", response_model=List[AgentStatusResponse])
async def get_active_agents():
    """Get list of all active agents"""
    try:
        agents = agent_communication_service.get_active_agents()
        
        return [
            AgentStatusResponse(
                agent_id=agent.agent_id,
                agent_name=agent.agent_name,
                agent_type=agent.agent_type,
                current_status=agent.current_status.value,
                current_task_id=agent.current_task_id,
                last_heartbeat=agent.last_heartbeat.isoformat(),
                capabilities=agent.capabilities,
                metadata=agent.metadata
            )
            for agent in agents
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agents: {str(e)}")

@router.get("/agents/{agent_id}", response_model=AgentStatusResponse)
async def get_agent_status(agent_id: str):
    """Get status of a specific agent"""
    try:
        agents = agent_communication_service.get_active_agents()
        agent = next((a for a in agents if a.agent_id == agent_id), None)
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        return AgentStatusResponse(
            agent_id=agent.agent_id,
            agent_name=agent.agent_name,
            agent_type=agent.agent_type,
            current_status=agent.current_status.value,
            current_task_id=agent.current_task_id,
            last_heartbeat=agent.last_heartbeat.isoformat(),
            capabilities=agent.capabilities,
            metadata=agent.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agent status: {str(e)}")

# Communication Endpoints
@router.post("/context/share")
async def share_context(request: ContextShareRequest):
    """Share context information between agents"""
    try:
        # Parse expires_at if provided
        expires_at = None
        if request.expires_at:
            expires_at = datetime.fromisoformat(request.expires_at)
        
        # Create context data
        context_data = ContextData(
            task_id=request.task_id,
            workstream_id=request.workstream_id,
            data=request.data,
            metadata=request.metadata or {},
            expires_at=expires_at
        )
        
        # Share context
        message_id = agent_communication_service.share_context(
            sender_id=request.sender_id,
            context_data=context_data,
            recipient_ids=request.recipient_ids
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to share context")
        
        return {
            "message_id": message_id,
            "context_id": context_data.context_id,
            "shared_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sharing context: {str(e)}")

@router.post("/progress/update")
async def report_progress(request: ProgressUpdateRequest):
    """Report progress on a task or workstream"""
    try:
        # Parse estimated_completion if provided
        estimated_completion = None
        if request.estimated_completion:
            estimated_completion = datetime.fromisoformat(request.estimated_completion)
        
        # Create progress data
        progress_data = ProgressData(
            task_id=request.task_id,
            workstream_id=request.workstream_id,
            progress_percentage=request.progress_percentage,
            status=request.status,
            completed_steps=request.completed_steps or [],
            remaining_steps=request.remaining_steps or [],
            estimated_completion=estimated_completion,
            blockers=request.blockers or [],
            achievements=request.achievements or []
        )
        
        # Report progress
        message_id = agent_communication_service.report_progress(
            sender_id=request.sender_id,
            progress_data=progress_data,
            recipient_ids=request.recipient_ids
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to report progress")
        
        return {
            "message_id": message_id,
            "reported_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reporting progress: {str(e)}")

@router.post("/resources/request")
async def request_resource(request: ResourceRequestRequest):
    """Request access to a shared resource"""
    try:
        # Create resource request
        resource_request = ResourceRequest(
            resource_id=request.resource_id,
            resource_type=request.resource_type,
            requested_access=request.requested_access,
            duration_minutes=request.duration_minutes,
            priority=MessagePriority(request.priority),
            reason=request.reason
        )
        
        # Send request
        message_id = agent_communication_service.request_resource(
            sender_id=request.sender_id,
            resource_request=resource_request,
            recipient_ids=request.recipient_ids
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to request resource")
        
        return {
            "message_id": message_id,
            "requested_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error requesting resource: {str(e)}")

@router.post("/conflicts/resolve")
async def resolve_conflict(request: ConflictResolutionRequest):
    """Initiate conflict resolution"""
    try:
        # Create conflict data
        conflict_data = ConflictData(
            conflict_type=request.conflict_type,
            description=request.description,
            involved_agents=request.involved_agents,
            proposed_solution=request.proposed_solution,
            requires_human_intervention=request.requires_human_intervention
        )
        
        # Resolve conflict
        message_id = agent_communication_service.resolve_conflict(
            sender_id=request.sender_id,
            conflict_data=conflict_data,
            recipient_ids=request.recipient_ids
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to resolve conflict")
        
        return {
            "message_id": message_id,
            "conflict_id": conflict_data.conflict_id,
            "resolved_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resolving conflict: {str(e)}")

@router.post("/heartbeat")
async def send_heartbeat(request: HeartbeatRequest):
    """Send a heartbeat message"""
    try:
        # Send heartbeat
        message_id = agent_communication_service.send_heartbeat(
            agent_id=request.agent_id,
            status=AgentStatus(request.status),
            current_task_id=request.current_task_id
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to send heartbeat")
        
        return {
            "message_id": message_id,
            "heartbeat_sent_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending heartbeat: {str(e)}")

@router.post("/errors/report")
async def report_error(request: ErrorReportRequest):
    """Report an error to other agents"""
    try:
        # Report error
        message_id = agent_communication_service.report_error(
            sender_id=request.sender_id,
            error_type=request.error_type,
            error_message=request.error_message,
            stack_trace=request.stack_trace,
            context=request.context
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to report error")
        
        return {
            "message_id": message_id,
            "reported_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reporting error: {str(e)}")

@router.post("/coordination")
async def coordinate_work(request: CoordinationRequest):
    """Coordinate work between agents"""
    try:
        # Coordinate work
        message_id = agent_communication_service.coordinate_work(
            sender_id=request.sender_id,
            coordination_type=request.coordination_type,
            coordination_data=request.coordination_data,
            recipient_ids=request.recipient_ids
        )
        
        if not message_id:
            raise HTTPException(status_code=500, detail="Failed to coordinate work")
        
        return {
            "message_id": message_id,
            "coordinated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error coordinating work: {str(e)}")

# Monitoring and Metrics Endpoints
@router.get("/metrics", response_model=CommunicationMetricsResponse)
async def get_communication_metrics():
    """Get current communication metrics"""
    try:
        metrics = agent_communication_service.get_communication_metrics()
        
        return CommunicationMetricsResponse(
            total_messages_sent=metrics.total_messages_sent,
            total_messages_received=metrics.total_messages_received,
            messages_by_type=metrics.messages_by_type,
            average_response_time=metrics.average_response_time,
            failed_deliveries=metrics.failed_deliveries,
            active_agents=metrics.active_agents,
            last_updated=metrics.last_updated.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metrics: {str(e)}")

@router.get("/agents/{agent_id}/context")
async def get_agent_context(agent_id: str):
    """Get the current context for a specific agent"""
    try:
        context = agent_communication_service.get_agent_context(agent_id)
        
        if not context:
            raise HTTPException(status_code=404, detail="Agent context not found")
        
        return {
            "agent_id": agent_id,
            "context_data": context.get('context_data', {}),
            "active_tasks": list(context.get('active_tasks', [])),
            "resource_locks": list(context.get('resource_locks', [])),
            "last_activity": context.get('last_activity', datetime.utcnow()).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agent context: {str(e)}")

# Service Management Endpoints
@router.post("/service/start")
async def start_communication_service():
    """Start the agent communication service"""
    try:
        if not agent_communication_service.start():
            raise HTTPException(status_code=500, detail="Failed to start communication service")
        
        return {"message": "Agent communication service started successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting service: {str(e)}")

@router.post("/service/stop")
async def stop_communication_service():
    """Stop the agent communication service"""
    try:
        if not agent_communication_service.stop():
            raise HTTPException(status_code=500, detail="Failed to stop communication service")
        
        return {"message": "Agent communication service stopped successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping service: {str(e)}")

@router.get("/service/status")
async def get_service_status():
    """Get the current status of the communication service"""
    try:
        return {
            "is_running": agent_communication_service.is_running,
            "active_agents": len(agent_communication_service.get_active_agents()),
            "service_started_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching service status: {str(e)}")
