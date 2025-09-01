"""
Agent data models for specialization and assignment system
"""
from typing import List, Dict, Optional, Set, Any, Union
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class AgentType(str, Enum):
    """Types of specialized agents"""
    UI_DEVELOPER = "ui_developer"
    API_DEVELOPER = "api_developer"
    DATABASE_ENGINEER = "database_engineer"
    TESTING_ENGINEER = "testing_engineer"
    DEVOPS_ENGINEER = "devops_engineer"
    FRONTEND_SPECIALIST = "frontend_specialist"
    BACKEND_SPECIALIST = "backend_specialist"
    FULL_STACK_DEVELOPER = "full_stack_developer"
    CODE_REVIEWER = "code_reviewer"
    DOCUMENTATION_SPECIALIST = "documentation_specialist"


class AgentStatus(str, Enum):
    """Status of an agent"""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    FAILED = "failed"


class SkillLevel(str, Enum):
    """Skill proficiency levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class AgentCapability(BaseModel):
    """A specific capability of an agent"""
    skill_name: str
    skill_level: SkillLevel
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    experience_hours: int = Field(default=0, ge=0)
    last_used: Optional[datetime] = None
    success_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentPerformance(BaseModel):
    """Performance metrics for an agent"""
    agent_id: str
    total_tasks_completed: int = 0
    total_tasks_failed: int = 0
    average_completion_time: Optional[float] = None  # Minutes
    success_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    
    # Quality metrics
    code_quality_score: float = Field(default=0.0, ge=0.0, le=1.0)
    bug_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    review_score: float = Field(default=0.0, ge=0.0, le=1.0)
    
    # Efficiency metrics
    tasks_per_hour: float = Field(default=0.0, ge=0.0)
    resource_efficiency: float = Field(default=0.0, ge=0.0, le=1.0)
    
    # Learning metrics
    skill_improvement_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    adaptation_score: float = Field(default=0.0, ge=0.0, le=1.0)
    
    # Timing
    last_activity: Optional[datetime] = None
    uptime_percentage: float = Field(default=0.0, ge=0.0, le=1.0)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentHealth(BaseModel):
    """Health status of an agent"""
    agent_id: str
    status: AgentStatus = AgentStatus.AVAILABLE
    is_healthy: bool = True
    last_heartbeat: Optional[datetime] = None
    response_time: Optional[float] = None  # Seconds
    error_count: int = 0
    consecutive_failures: int = 0
    max_consecutive_failures: int = 3
    
    # Resource usage
    cpu_usage: Optional[float] = None  # Percentage
    memory_usage: Optional[float] = None  # Percentage
    disk_usage: Optional[float] = None  # Percentage
    
    # Health checks
    health_checks: Dict[str, bool] = Field(default_factory=dict)
    health_score: float = Field(default=1.0, ge=0.0, le=1.0)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Agent(BaseModel):
    """A specialized agent that can handle specific types of work"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    agent_type: AgentType
    description: str
    
    # Capabilities
    capabilities: List[AgentCapability] = Field(default_factory=list)
    specializations: List[str] = Field(default_factory=list)  # e.g., ["React", "TypeScript", "API Design"]
    
    # Status and health
    status: AgentStatus = AgentStatus.AVAILABLE
    health: AgentHealth = Field(default_factory=lambda: AgentHealth(agent_id=""))
    performance: AgentPerformance = Field(default_factory=lambda: AgentPerformance(agent_id=""))
    
    # Workload management
    current_workload: int = 0  # Number of active tasks
    max_concurrent_tasks: int = Field(default=3, ge=1, le=10)
    preferred_task_types: List[str] = Field(default_factory=list)
    
    # Learning and adaptation
    learning_rate: float = Field(default=0.1, ge=0.0, le=1.0)
    adaptation_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    last_updated: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentAssignment(BaseModel):
    """Assignment of an agent to a workstream"""
    assignment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    workstream_id: str
    assigned_at: datetime = Field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Assignment details
    assignment_reason: str  # Why this agent was chosen
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    priority_boost: float = Field(default=0.0, ge=0.0, le=1.0)  # Additional priority for this assignment
    
    # Performance tracking
    actual_completion_time: Optional[float] = None  # Minutes
    quality_score: Optional[float] = None  # 0.0 to 1.0
    feedback_score: Optional[float] = None  # User feedback score
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentPool(BaseModel):
    """A pool of available agents"""
    pool_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    
    # Agents in the pool
    agents: List[Agent] = Field(default_factory=list)
    agent_assignments: Dict[str, AgentAssignment] = Field(default_factory=dict)
    
    # Pool configuration
    max_agents: Optional[int] = None
    auto_scaling: bool = False
    scaling_threshold: float = Field(default=0.8, ge=0.0, le=1.0)  # Utilization threshold for scaling
    
    # Load balancing
    load_balancing_strategy: str = "round_robin"  # "round_robin", "least_busy", "capability_based"
    health_check_interval: int = Field(default=30, ge=5, le=300)  # Seconds
    
    # Performance tracking
    pool_performance: AgentPerformance = Field(default_factory=lambda: AgentPerformance(agent_id=""))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentMatchingCriteria(BaseModel):
    """Criteria for matching agents to workstreams"""
    required_capabilities: List[str] = Field(default_factory=list)
    preferred_capabilities: List[str] = Field(default_factory=list)
    minimum_skill_level: SkillLevel = SkillLevel.INTERMEDIATE
    required_specializations: List[str] = Field(default_factory=list)
    
    # Performance requirements
    minimum_success_rate: float = Field(default=0.0, ge=0.0, le=1.0)  # Start with 0 for new agents
    maximum_response_time: Optional[float] = None  # Seconds
    minimum_uptime: float = Field(default=0.0, ge=0.0, le=1.0)  # Start with 0 for new agents
    
    # Workload constraints
    maximum_current_workload: Optional[int] = None
    preferred_agent_types: List[AgentType] = Field(default_factory=list)
    
    # Priority and urgency
    priority_boost: float = Field(default=0.0, ge=0.0, le=1.0)
    is_urgent: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentMatchingResult(BaseModel):
    """Result of agent matching process"""
    workstream_id: str
    matched_agents: List[Agent] = Field(default_factory=list)
    best_match: Optional[Agent] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    
    # Matching details
    matching_criteria: AgentMatchingCriteria
    applied_filters: List[str] = Field(default_factory=list)
    excluded_agents: List[str] = Field(default_factory=list)  # Agent IDs that were excluded and why
    
    # Alternative matches
    alternative_matches: List[Agent] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentTrainingEvent(BaseModel):
    """Training event for agent improvement"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    training_type: str  # "skill_improvement", "capability_expansion", "performance_optimization"
    training_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Training results
    improvement_score: float = Field(default=0.0, ge=0.0, le=1.0)
    new_capabilities: List[AgentCapability] = Field(default_factory=list)
    updated_performance: Optional[AgentPerformance] = None
    
    # Timing
    training_started: datetime = Field(default_factory=datetime.now)
    training_completed: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentFailoverConfig(BaseModel):
    """Configuration for agent failover"""
    primary_agent_id: str
    backup_agent_ids: List[str] = Field(default_factory=list)
    failover_threshold: int = Field(default=3, ge=1, le=10)  # Consecutive failures before failover
    auto_failover: bool = True
    failover_strategy: str = "immediate"  # "immediate", "graceful", "manual"
    
    # Recovery settings
    recovery_timeout: int = Field(default=300, ge=60, le=3600)  # Seconds
    max_recovery_attempts: int = Field(default=3, ge=1, le=10)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
