"""
Message data models for agent communication protocol
"""
from typing import List, Dict, Optional, Any, Union
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class MessageType(str, Enum):
    """Types of messages that agents can send"""
    CONTEXT_SHARE = "context_share"  # Share context and information
    PROGRESS_UPDATE = "progress_update"  # Report progress on tasks
    STATUS_UPDATE = "status_update"  # Update agent status
    RESOURCE_REQUEST = "resource_request"  # Request access to shared resources
    CONFLICT_RESOLUTION = "conflict_resolution"  # Resolve conflicts
    DISCOVERY = "discovery"  # Agent discovery and registration
    HEARTBEAT = "heartbeat"  # Keep-alive messages
    ERROR_REPORT = "error_report"  # Report errors or issues
    COORDINATION = "coordination"  # Coordinate work between agents


class MessagePriority(str, Enum):
    """Priority levels for messages"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"


class AgentStatus(str, Enum):
    """Status of an agent"""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class MessageStatus(str, Enum):
    """Status of a message"""
    PENDING = "pending"
    DELIVERED = "delivered"
    READ = "read"
    PROCESSED = "processed"
    FAILED = "failed"
    EXPIRED = "expired"


class ContextData(BaseModel):
    """Context information shared between agents"""
    context_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: Optional[str] = None
    workstream_id: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


class ProgressData(BaseModel):
    """Progress information for tasks or workstreams"""
    task_id: str
    workstream_id: Optional[str] = None
    progress_percentage: float = Field(ge=0.0, le=100.0)
    status: str
    completed_steps: List[str] = Field(default_factory=list)
    remaining_steps: List[str] = Field(default_factory=list)
    estimated_completion: Optional[datetime] = None
    blockers: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)


class ResourceRequest(BaseModel):
    """Request for access to shared resources"""
    resource_id: str
    resource_type: str
    requested_access: str  # "read", "write", "exclusive"
    duration_minutes: Optional[int] = None
    priority: MessagePriority = MessagePriority.NORMAL
    reason: Optional[str] = None


class ConflictData(BaseModel):
    """Conflict resolution information"""
    conflict_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conflict_type: str  # "resource", "task", "data", "coordination"
    description: str
    involved_agents: List[str] = Field(default_factory=list)
    proposed_solution: Optional[str] = None
    resolution_strategy: Optional[str] = None
    requires_human_intervention: bool = False


class AgentInfo(BaseModel):
    """Information about an agent"""
    agent_id: str
    agent_name: str
    agent_type: str
    capabilities: List[str] = Field(default_factory=list)
    current_status: AgentStatus = AgentStatus.AVAILABLE
    current_task_id: Optional[str] = None
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentMessage(BaseModel):
    """Base message structure for agent communication"""
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message_type: MessageType
    priority: MessagePriority = MessagePriority.NORMAL
    
    # Sender and recipient information
    sender_id: str
    recipient_ids: List[str] = Field(default_factory=list)  # Empty list means broadcast
    reply_to_message_id: Optional[str] = None
    
    # Message content
    content: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    status: MessageStatus = MessageStatus.PENDING
    
    # Routing and delivery
    routing_key: Optional[str] = None
    delivery_attempts: int = 0
    max_delivery_attempts: int = 3
    
    # Security
    encrypted: bool = False
    signature: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextShareMessage(AgentMessage):
    """Message for sharing context between agents"""
    message_type: MessageType = MessageType.CONTEXT_SHARE
    context_data: ContextData


class ProgressUpdateMessage(AgentMessage):
    """Message for reporting progress updates"""
    message_type: MessageType = MessageType.PROGRESS_UPDATE
    progress_data: ProgressData


class StatusUpdateMessage(AgentMessage):
    """Message for updating agent status"""
    message_type: MessageType = MessageType.STATUS_UPDATE
    agent_info: AgentInfo


class ResourceRequestMessage(AgentMessage):
    """Message for requesting resource access"""
    message_type: MessageType = MessageType.RESOURCE_REQUEST
    resource_request: ResourceRequest


class ConflictResolutionMessage(AgentMessage):
    """Message for conflict resolution"""
    message_type: MessageType = MessageType.CONFLICT_RESOLUTION
    conflict_data: ConflictData


class DiscoveryMessage(AgentMessage):
    """Message for agent discovery and registration"""
    message_type: MessageType = MessageType.DISCOVERY
    agent_info: AgentInfo
    action: str  # "register", "unregister", "discover"


class HeartbeatMessage(AgentMessage):
    """Message for keeping agents alive"""
    message_type: MessageType = MessageType.HEARTBEAT
    agent_id: str
    status: AgentStatus
    current_task_id: Optional[str] = None


class ErrorReportMessage(AgentMessage):
    """Message for reporting errors"""
    message_type: MessageType = MessageType.ERROR_REPORT
    error_type: str
    error_message: str
    stack_trace: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class CoordinationMessage(AgentMessage):
    """Message for coordinating work between agents"""
    message_type: MessageType = MessageType.COORDINATION
    coordination_type: str  # "handoff", "sync", "delegate", "merge"
    coordination_data: Dict[str, Any] = Field(default_factory=dict)


class MessageBatch(BaseModel):
    """Batch of messages for efficient processing"""
    batch_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[AgentMessage] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source_agent_id: str
    priority: MessagePriority = MessagePriority.NORMAL
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CommunicationMetrics(BaseModel):
    """Metrics for monitoring agent communication"""
    total_messages_sent: int = 0
    total_messages_received: int = 0
    messages_by_type: Dict[str, int] = Field(default_factory=dict)
    average_response_time: Optional[float] = None
    failed_deliveries: int = 0
    active_agents: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
