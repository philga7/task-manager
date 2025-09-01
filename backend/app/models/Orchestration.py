"""
Orchestration data models for workstream execution management
"""
from typing import List, Dict, Optional, Set, Any, Union
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from .Workstream import Workstream, WorkstreamStatus, ResourceType


class OrchestrationStatus(str, Enum):
    """Status of the overall orchestration process"""
    INITIALIZING = "initializing"
    SCHEDULING = "scheduling"
    EXECUTING = "executing"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLING_BACK = "rolling_back"


class ExecutionPhase(str, Enum):
    """Phases of workstream execution"""
    SCHEDULED = "scheduled"
    RESOURCE_ALLOCATED = "resource_allocated"
    STARTING = "starting"
    RUNNING = "running"
    COMPLETING = "completing"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class ResourceAllocationStatus(str, Enum):
    """Status of resource allocation"""
    AVAILABLE = "available"
    ALLOCATED = "allocated"
    CONFLICTED = "conflicted"
    RELEASED = "released"


class ConflictResolutionStrategy(str, Enum):
    """Strategies for resolving resource conflicts"""
    PRIORITY_BASED = "priority_based"
    FIFO = "fifo"  # First in, first out
    LIFO = "lifo"  # Last in, first out
    ROUND_ROBIN = "round_robin"
    MANUAL = "manual"


class ResourceAllocation(BaseModel):
    """Resource allocation for a workstream"""
    resource_id: str
    resource_type: ResourceType
    resource_name: str
    workstream_id: str
    allocation_time: datetime
    release_time: Optional[datetime] = None
    status: ResourceAllocationStatus = ResourceAllocationStatus.ALLOCATED
    is_exclusive: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ExecutionContext(BaseModel):
    """Execution context for a workstream"""
    workstream_id: str
    phase: ExecutionPhase = ExecutionPhase.SCHEDULED
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    allocated_resources: List[ResourceAllocation] = Field(default_factory=list)
    execution_log: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class OrchestrationConfig(BaseModel):
    """Configuration for workstream orchestration"""
    max_concurrent_workstreams: int = Field(default=5, ge=1, le=50)
    max_retries_per_workstream: int = Field(default=3, ge=0, le=10)
    resource_conflict_strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.PRIORITY_BASED
    enable_auto_rollback: bool = True
    rollback_threshold: float = Field(default=0.3, ge=0.0, le=1.0)  # Percentage of failed workstreams
    monitoring_interval: int = Field(default=30, ge=5, le=300)  # Seconds
    timeout_per_workstream: Optional[int] = None  # Minutes, None = no timeout
    
    # Resource limits
    max_file_operations: int = Field(default=10, ge=1)
    max_database_connections: int = Field(default=5, ge=1)
    max_api_calls: int = Field(default=20, ge=1)
    max_external_services: int = Field(default=3, ge=1)
    max_computational_resources: int = Field(default=8, ge=1)


class OrchestrationMetrics(BaseModel):
    """Metrics for orchestration performance"""
    total_workstreams: int = 0
    completed_workstreams: int = 0
    failed_workstreams: int = 0
    in_progress_workstreams: int = 0
    blocked_workstreams: int = 0
    
    # Timing metrics
    total_execution_time: Optional[float] = None  # Minutes
    average_workstream_duration: Optional[float] = None  # Minutes
    longest_workstream_duration: Optional[float] = None  # Minutes
    shortest_workstream_duration: Optional[float] = None  # Minutes
    
    # Resource utilization
    resource_utilization_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    resource_conflicts_resolved: int = 0
    resource_wait_time: Optional[float] = None  # Minutes
    
    # Efficiency metrics
    parallelization_efficiency: float = Field(default=0.0, ge=0.0, le=1.0)
    throughput_rate: Optional[float] = None  # Workstreams per minute
    
    # Error metrics
    retry_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    rollback_count: int = 0
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class OrchestrationState(BaseModel):
    """Current state of the orchestration process"""
    orchestration_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: OrchestrationStatus = OrchestrationStatus.INITIALIZING
    workstreams: List[Workstream] = Field(default_factory=list)
    execution_contexts: Dict[str, ExecutionContext] = Field(default_factory=dict)
    resource_allocations: Dict[str, ResourceAllocation] = Field(default_factory=dict)
    
    # Configuration
    config: OrchestrationConfig = Field(default_factory=OrchestrationConfig)
    
    # Metrics
    metrics: OrchestrationMetrics = Field(default_factory=OrchestrationMetrics)
    
    # Timing
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    
    # Error handling
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class OrchestrationRequest(BaseModel):
    """Request to start workstream orchestration"""
    workstreams: List[Workstream]
    config: Optional[OrchestrationConfig] = None
    priority_override: Optional[Dict[str, int]] = None  # workstream_id -> priority
    resource_constraints: Optional[Dict[str, int]] = None  # resource_type -> max_concurrent
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class OrchestrationResult(BaseModel):
    """Result of workstream orchestration"""
    orchestration_id: str
    status: OrchestrationStatus
    workstreams: List[Workstream]
    metrics: OrchestrationMetrics
    execution_summary: Dict[str, Any] = Field(default_factory=dict)
    
    # Timing
    total_duration: Optional[float] = None  # Minutes
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    
    # Results
    successful_workstreams: List[str] = Field(default_factory=list)
    failed_workstreams: List[str] = Field(default_factory=list)
    skipped_workstreams: List[str] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ResourceConflict(BaseModel):
    """A resource conflict between workstreams"""
    resource_id: str
    resource_type: ResourceType
    conflicting_workstreams: List[str]
    conflict_type: str  # "exclusive_access", "capacity_limit", "dependency"
    severity: str = "medium"  # "low", "medium", "high", "critical"
    resolution_strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.PRIORITY_BASED
    resolved: bool = False
    resolution_time: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ExecutionEvent(BaseModel):
    """An event during workstream execution"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    event_type: str  # "workstream_started", "workstream_completed", "resource_allocated", etc.
    workstream_id: Optional[str] = None
    resource_id: Optional[str] = None
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
