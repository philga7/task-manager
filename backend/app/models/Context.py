"""
Context data models for persistent context management system
"""
from typing import List, Dict, Optional, Any, Union, Set
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid
import json


class ContextType(str, Enum):
    """Types of context that can be stored"""
    PROJECT_CONTEXT = "project_context"
    SESSION_CONTEXT = "session_context"
    AGENT_CONTEXT = "agent_context"
    WORKSTREAM_CONTEXT = "workstream_context"
    USER_CONTEXT = "user_context"
    SYSTEM_CONTEXT = "system_context"
    SHARED_CONTEXT = "shared_context"


class ContextStatus(str, Enum):
    """Status of context data"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    EXPIRED = "expired"
    LOCKED = "locked"
    CORRUPTED = "corrupted"


class ContextAccessLevel(str, Enum):
    """Access levels for context data"""
    PUBLIC = "public"
    SHARED = "shared"
    PRIVATE = "private"
    RESTRICTED = "restricted"


class ContextMetadata(BaseModel):
    """Metadata for context entries"""
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_by: Optional[str] = None
    modified_at: Optional[datetime] = None
    version: int = 1
    tags: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    access_level: ContextAccessLevel = ContextAccessLevel.SHARED
    expires_at: Optional[datetime] = None
    is_encrypted: bool = False
    checksum: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextEntry(BaseModel):
    """A single context entry"""
    context_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    context_type: ContextType
    key: str
    value: Any
    metadata: ContextMetadata
    status: ContextStatus = ContextStatus.ACTIVE
    size_bytes: Optional[int] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextSession(BaseModel):
    """Session context information"""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    workstream_id: Optional[str] = None
    project_id: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    context_entries: List[str] = Field(default_factory=list)  # List of context_id
    session_data: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextCollection(BaseModel):
    """A collection of related context entries"""
    collection_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    context_type: ContextType
    entries: List[ContextEntry] = Field(default_factory=list)
    metadata: ContextMetadata
    status: ContextStatus = ContextStatus.ACTIVE
    total_size_bytes: int = 0
    entry_count: int = 0
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextSnapshot(BaseModel):
    """A snapshot of context state at a point in time"""
    snapshot_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    collections: List[ContextCollection] = Field(default_factory=list)
    sessions: List[ContextSession] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_restorable: bool = True
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextQuery(BaseModel):
    """Query parameters for context retrieval"""
    context_type: Optional[ContextType] = None
    key_pattern: Optional[str] = None
    tags: Optional[List[str]] = None
    created_by: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    access_level: Optional[ContextAccessLevel] = None
    status: Optional[ContextStatus] = None
    limit: Optional[int] = 100
    offset: Optional[int] = 0
    sort_by: str = "created_at"
    sort_order: str = "desc"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextStats(BaseModel):
    """Statistics about context usage"""
    total_entries: int = 0
    total_collections: int = 0
    total_sessions: int = 0
    total_snapshots: int = 0
    total_size_bytes: int = 0
    entries_by_type: Dict[ContextType, int] = Field(default_factory=dict)
    entries_by_status: Dict[ContextStatus, int] = Field(default_factory=dict)
    entries_by_access_level: Dict[ContextAccessLevel, int] = Field(default_factory=dict)
    active_sessions: int = 0
    last_activity: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ContextBackup(BaseModel):
    """Backup information for context data"""
    backup_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    backup_type: str = "full"  # "full", "incremental", "differential"
    collections: List[str] = Field(default_factory=list)  # List of collection_ids
    sessions: List[str] = Field(default_factory=list)  # List of session_ids
    snapshots: List[str] = Field(default_factory=list)  # List of snapshot_ids
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    is_compressed: bool = True
    is_encrypted: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
