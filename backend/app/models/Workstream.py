"""
Workstream data models for parallel task execution
"""
from typing import List, Dict, Optional, Set, Any
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime


class WorkstreamStatus(str, Enum):
    """Status of a workstream"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"


class DependencyType(str, Enum):
    """Types of dependencies between workstreams"""
    REQUIRES = "requires"  # Workstream A requires Workstream B to complete
    SHARES_RESOURCE = "shares_resource"  # Both workstreams need the same resource
    OPTIONAL = "optional"  # Workstream A can start before B but benefits from B's completion


class ResourceType(str, Enum):
    """Types of resources that workstreams might need"""
    FILE = "file"
    DATABASE = "database"
    API_ENDPOINT = "api_endpoint"
    EXTERNAL_SERVICE = "external_service"
    COMPUTATIONAL = "computational"


class ResourceRequirement(BaseModel):
    """Resource requirement for a workstream"""
    resource_id: str
    resource_type: ResourceType
    resource_name: str
    is_exclusive: bool = False  # Whether this resource can be shared
    estimated_duration: Optional[int] = None  # Duration in minutes


class WorkstreamDependency(BaseModel):
    """Dependency relationship between workstreams"""
    source_workstream_id: str
    target_workstream_id: str
    dependency_type: DependencyType
    description: Optional[str] = None
    is_critical: bool = True  # Whether this dependency blocks execution


class Workstream(BaseModel):
    """A parallel workstream that can be executed independently"""
    id: str
    name: str
    description: str
    original_task_id: str  # ID of the original complex task
    status: WorkstreamStatus = WorkstreamStatus.PENDING
    priority: int = Field(default=5, ge=1, le=10)  # 1=highest, 10=lowest
    
    # Dependencies
    dependencies: List[WorkstreamDependency] = Field(default_factory=list)
    dependent_workstreams: List[str] = Field(default_factory=list)  # IDs of workstreams that depend on this one
    
    # Resources
    required_resources: List[ResourceRequirement] = Field(default_factory=list)
    estimated_duration: Optional[int] = None  # Duration in minutes
    actual_duration: Optional[int] = None  # Actual duration once completed
    
    # Execution details
    assigned_agent_id: Optional[str] = None
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    complexity_score: Optional[float] = None  # 0.0 to 1.0
    parallelization_score: Optional[float] = None  # How well this can be parallelized
    
    # Validation
    validation_errors: List[str] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TaskDecompositionResult(BaseModel):
    """Result of task decomposition process"""
    original_task_id: str
    workstreams: List[Workstream]
    total_estimated_duration: Optional[int] = None
    parallel_execution_duration: Optional[int] = None
    efficiency_gain: Optional[float] = None  # Percentage improvement
    dependency_graph: Dict[str, List[str]] = Field(default_factory=dict)
    resource_conflicts: List[Dict[str, Any]] = Field(default_factory=list)
    decomposition_quality_score: Optional[float] = None  # 0.0 to 1.0
    
    # Metadata
    decomposition_time: datetime = Field(default_factory=datetime.now)
    algorithm_version: str = "1.0.0"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DecompositionRequest(BaseModel):
    """Request for task decomposition"""
    task_id: str
    task_name: str
    task_description: str
    task_complexity: Optional[float] = Field(None, ge=0.0, le=1.0)
    available_agents: List[str] = Field(default_factory=list)
    max_parallel_workstreams: Optional[int] = None
    optimization_goals: List[str] = Field(default_factory=list)  # e.g., ["speed", "resource_efficiency", "quality"]
    
    # Constraints
    max_duration: Optional[int] = None  # Maximum allowed duration in minutes
    resource_constraints: Dict[str, int] = Field(default_factory=dict)  # Resource type -> max concurrent usage
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DecompositionMetrics(BaseModel):
    """Metrics for evaluating decomposition quality"""
    total_workstreams: int
    parallel_workstreams: int
    sequential_workstreams: int
    dependency_depth: int  # Maximum number of dependencies in a chain
    resource_utilization: float  # 0.0 to 1.0
    load_balance_score: float  # How evenly work is distributed
    complexity_distribution: Dict[str, int]  # Distribution of complexity scores
