"""
Context management service for persistent context across sessions
"""
import os
import json
import logging
import asyncio
import hashlib
import gzip
from typing import List, Dict, Optional, Any, Union, Tuple
from datetime import datetime, timedelta, timezone
from pathlib import Path
import shutil

from ..models.Context import (
    ContextEntry, ContextSession, ContextCollection, ContextSnapshot,
    ContextBackup, ContextQuery, ContextStats, ContextType, ContextStatus,
    ContextAccessLevel, ContextMetadata
)

logger = logging.getLogger(__name__)


class ContextManager:
    """Main context management service for persistent context across sessions"""
    
    def __init__(self, base_path: str = ".claude/context"):
        self.base_path = Path(base_path)
        self.entries_path = self.base_path / "entries"
        self.collections_path = self.base_path / "collections"
        self.sessions_path = self.base_path / "sessions"
        self.snapshots_path = self.base_path / "snapshots"
        self.backups_path = self.base_path / "backups"
        self.logs_path = self.base_path / "logs"
        
        # In-memory cache for performance
        self._entries_cache: Dict[str, ContextEntry] = {}
        self._sessions_cache: Dict[str, ContextSession] = {}
        self._collections_cache: Dict[str, ContextCollection] = {}
        
        # Statistics
        self._stats = ContextStats()
        
        # Configuration
        self.max_cache_size = 1000
        self.auto_backup_interval = 3600  # 1 hour
        self.cleanup_interval = 86400  # 24 hours
        self.compression_enabled = True
        
        # Initialize directories
        self._ensure_directories()
        
        # Load existing data
        self._load_existing_data()
        
        logger.info(f"ContextManager initialized with base path: {self.base_path}")
    
    def _ensure_directories(self) -> None:
        """Ensure all required directories exist"""
        directories = [
            self.entries_path,
            self.collections_path,
            self.sessions_path,
            self.snapshots_path,
            self.backups_path,
            self.logs_path
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Ensured directory exists: {directory}")
    
    def _load_existing_data(self) -> None:
        """Load existing context data into cache"""
        try:
            # Load entries
            for entry_file in self.entries_path.glob("*.json"):
                try:
                    with open(entry_file, 'r') as f:
                        data = json.load(f)
                        entry = ContextEntry(**data)
                        self._entries_cache[entry.context_id] = entry
                except Exception as e:
                    logger.error(f"Failed to load entry {entry_file}: {e}")
            
            # Load sessions
            for session_file in self.sessions_path.glob("*.json"):
                try:
                    with open(session_file, 'r') as f:
                        data = json.load(f)
                        session = ContextSession(**data)
                        self._sessions_cache[session.session_id] = session
                except Exception as e:
                    logger.error(f"Failed to load session {session_file}: {e}")
            
            # Load collections
            for collection_file in self.collections_path.glob("*.json"):
                try:
                    with open(collection_file, 'r') as f:
                        data = json.load(f)
                        collection = ContextCollection(**data)
                        self._collections_cache[collection.collection_id] = collection
                except Exception as e:
                    logger.error(f"Failed to load collection {collection_file}: {e}")
            
            self._update_stats()
            logger.info(f"Loaded {len(self._entries_cache)} entries, {len(self._sessions_cache)} sessions, {len(self._collections_cache)} collections")
            
        except Exception as e:
            logger.error(f"Failed to load existing data: {e}")
    
    def _update_stats(self) -> None:
        """Update statistics based on current data"""
        self._stats.total_entries = len(self._entries_cache)
        self._stats.total_sessions = len(self._sessions_cache)
        self._stats.total_collections = len(self._collections_cache)
        
        # Count by type
        self._stats.entries_by_type = {}
        for entry in self._entries_cache.values():
            self._stats.entries_by_type[entry.context_type] = self._stats.entries_by_type.get(entry.context_type, 0) + 1
        
        # Count by status
        self._stats.entries_by_status = {}
        for entry in self._entries_cache.values():
            self._stats.entries_by_status[entry.status] = self._stats.entries_by_status.get(entry.status, 0) + 1
        
        # Count by access level
        self._stats.entries_by_access_level = {}
        for entry in self._entries_cache.values():
            self._stats.entries_by_access_level[entry.metadata.access_level] = self._stats.entries_by_access_level.get(entry.metadata.access_level, 0) + 1
        
        # Active sessions
        self._stats.active_sessions = sum(1 for session in self._sessions_cache.values() if session.is_active)
        
        # Total size
        self._stats.total_size_bytes = sum(entry.size_bytes or 0 for entry in self._entries_cache.values())
    
    def _get_entry_path(self, context_id: str) -> Path:
        """Get file path for a context entry"""
        return self.entries_path / f"{context_id}.json"
    
    def _get_session_path(self, session_id: str) -> Path:
        """Get file path for a session"""
        return self.sessions_path / f"{session_id}.json"
    
    def _get_collection_path(self, collection_id: str) -> Path:
        """Get file path for a collection"""
        return self.collections_path / f"{collection_id}.json"
    
    def _get_snapshot_path(self, snapshot_id: str) -> Path:
        """Get file path for a snapshot"""
        return self.snapshots_path / f"{snapshot_id}.json"
    
    def _get_backup_path(self, backup_id: str) -> Path:
        """Get file path for a backup"""
        return self.backups_path / f"{backup_id}.json"
    
    def _serialize_data(self, data: Any) -> str:
        """Serialize data to JSON string with optional compression"""
        json_str = json.dumps(data, default=str, indent=2)
        
        if self.compression_enabled and len(json_str) > 1024:  # Compress if > 1KB
            compressed = gzip.compress(json_str.encode('utf-8'))
            return json.dumps({
                "compressed": True,
                "data": compressed.hex()
            })
        
        return json_str
    
    def _deserialize_data(self, data_str: str) -> Any:
        """Deserialize data from JSON string with decompression support"""
        try:
            data = json.loads(data_str)
            
            # Check if data is compressed
            if isinstance(data, dict) and data.get("compressed"):
                compressed_data = bytes.fromhex(data["data"])
                decompressed = gzip.decompress(compressed_data)
                return json.loads(decompressed.decode('utf-8'))
            
            return data
        except Exception as e:
            logger.error(f"Failed to deserialize data: {e}")
            return None
    
    def _calculate_checksum(self, data: str) -> str:
        """Calculate SHA-256 checksum of data"""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def _save_entry(self, entry: ContextEntry) -> bool:
        """Save a context entry to disk"""
        try:
            file_path = self._get_entry_path(entry.context_id)
            
            # Calculate size and checksum
            entry_data = entry.model_dump()
            serialized = self._serialize_data(entry_data)
            entry.size_bytes = len(serialized.encode('utf-8'))
            entry.metadata.checksum = self._calculate_checksum(serialized)
            entry.metadata.modified_at = datetime.now(timezone.utc)
            
            # Save to disk
            with open(file_path, 'w') as f:
                f.write(serialized)
            
            # Update cache
            self._entries_cache[entry.context_id] = entry
            
            logger.debug(f"Saved context entry: {entry.context_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save context entry {entry.context_id}: {e}")
            return False
    
    def _load_entry(self, context_id: str) -> Optional[ContextEntry]:
        """Load a context entry from disk"""
        try:
            file_path = self._get_entry_path(context_id)
            
            if not file_path.exists():
                return None
            
            with open(file_path, 'r') as f:
                data_str = f.read()
            
            data = self._deserialize_data(data_str)
            if data is None:
                return None
            
            entry = ContextEntry(**data)
            
            # Verify checksum
            if entry.metadata.checksum:
                expected_checksum = self._calculate_checksum(data_str)
                if entry.metadata.checksum != expected_checksum:
                    logger.warning(f"Checksum mismatch for entry {context_id}")
                    entry.status = ContextStatus.CORRUPTED
            
            return entry
            
        except Exception as e:
            logger.error(f"Failed to load context entry {context_id}: {e}")
            return None
    
    def create_context_entry(
        self,
        context_type: ContextType,
        key: str,
        value: Any,
        created_by: str,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        access_level: ContextAccessLevel = ContextAccessLevel.SHARED,
        expires_at: Optional[datetime] = None
    ) -> Optional[ContextEntry]:
        """Create a new context entry"""
        try:
            metadata = ContextMetadata(
                created_by=created_by,
                description=description,
                tags=tags or [],
                access_level=access_level,
                expires_at=expires_at
            )
            
            entry = ContextEntry(
                context_type=context_type,
                key=key,
                value=value,
                metadata=metadata
            )
            
            if self._save_entry(entry):
                self._update_stats()
                logger.info(f"Created context entry: {entry.context_id} ({context_type})")
                return entry
            else:
                return None
                
        except Exception as e:
            logger.error(f"Failed to create context entry: {e}")
            return None
    
    def get_context_entry(self, context_id: str) -> Optional[ContextEntry]:
        """Get a context entry by ID"""
        # Check cache first
        if context_id in self._entries_cache:
            entry = self._entries_cache[context_id]
            
            # Check if expired
            if entry.metadata.expires_at and entry.metadata.expires_at < datetime.now(timezone.utc):
                entry.status = ContextStatus.EXPIRED
                self._save_entry(entry)
            
            return entry
        
        # Load from disk
        entry = self._load_entry(context_id)
        if entry:
            self._entries_cache[context_id] = entry
        
        return entry
    
    def update_context_entry(
        self,
        context_id: str,
        value: Any,
        modified_by: str,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> bool:
        """Update an existing context entry"""
        entry = self.get_context_entry(context_id)
        if not entry:
            return False
        
        try:
            entry.value = value
            entry.metadata.modified_by = modified_by
            entry.metadata.modified_at = datetime.now(timezone.utc)
            entry.metadata.version += 1
            
            if description:
                entry.metadata.description = description
            if tags:
                entry.metadata.tags = tags
            
            return self._save_entry(entry)
            
        except Exception as e:
            logger.error(f"Failed to update context entry {context_id}: {e}")
            return False
    
    def delete_context_entry(self, context_id: str) -> bool:
        """Delete a context entry"""
        try:
            # Remove from cache
            if context_id in self._entries_cache:
                del self._entries_cache[context_id]
            
            # Remove from disk
            file_path = self._get_entry_path(context_id)
            if file_path.exists():
                file_path.unlink()
            
            self._update_stats()
            logger.info(f"Deleted context entry: {context_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete context entry {context_id}: {e}")
            return False
    
    def query_context_entries(self, query: ContextQuery) -> List[ContextEntry]:
        """Query context entries based on criteria"""
        results = []
        
        for entry in self._entries_cache.values():
            # Apply filters
            if query.context_type and entry.context_type != query.context_type:
                continue
            
            if query.key_pattern and query.key_pattern not in entry.key:
                continue
            
            if query.tags and not any(tag in entry.metadata.tags for tag in query.tags):
                continue
            
            if query.created_by and entry.metadata.created_by != query.created_by:
                continue
            
            if query.created_after and entry.metadata.created_at < query.created_after:
                continue
            
            if query.created_before and entry.metadata.created_at > query.created_before:
                continue
            
            if query.access_level and entry.metadata.access_level != query.access_level:
                continue
            
            if query.status and entry.status != query.status:
                continue
            
            results.append(entry)
        
        # Sort results
        reverse = query.sort_order.lower() == "desc"
        if query.sort_by == "created_at":
            results.sort(key=lambda x: x.metadata.created_at, reverse=reverse)
        elif query.sort_by == "modified_at":
            results.sort(key=lambda x: x.metadata.modified_at or x.metadata.created_at, reverse=reverse)
        elif query.sort_by == "key":
            results.sort(key=lambda x: x.key, reverse=reverse)
        
        # Apply pagination
        start = query.offset or 0
        end = start + (query.limit or 100)
        return results[start:end]
    
    def create_session(
        self,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        workstream_id: Optional[str] = None,
        project_id: Optional[str] = None
    ) -> Optional[ContextSession]:
        """Create a new context session"""
        try:
            session = ContextSession(
                user_id=user_id,
                agent_id=agent_id,
                workstream_id=workstream_id,
                project_id=project_id
            )
            
            # Save session
            file_path = self._get_session_path(session.session_id)
            with open(file_path, 'w') as f:
                f.write(self._serialize_data(session.model_dump()))
            
            self._sessions_cache[session.session_id] = session
            self._update_stats()
            
            logger.info(f"Created session: {session.session_id}")
            return session
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            return None
    
    def get_session(self, session_id: str) -> Optional[ContextSession]:
        """Get a session by ID"""
        if session_id in self._sessions_cache:
            return self._sessions_cache[session_id]
        
        try:
            file_path = self._get_session_path(session_id)
            if not file_path.exists():
                return None
            
            with open(file_path, 'r') as f:
                data = self._deserialize_data(f.read())
            
            session = ContextSession(**data)
            self._sessions_cache[session_id] = session
            return session
            
        except Exception as e:
            logger.error(f"Failed to load session {session_id}: {e}")
            return None
    
    def update_session_activity(self, session_id: str) -> bool:
        """Update session last activity time"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        try:
            session.last_activity = datetime.now(timezone.utc)
            
            file_path = self._get_session_path(session_id)
            with open(file_path, 'w') as f:
                f.write(self._serialize_data(session.dict()))
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update session activity {session_id}: {e}")
            return False
    
    def close_session(self, session_id: str) -> bool:
        """Close a session"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        try:
            session.is_active = False
            
            file_path = self._get_session_path(session_id)
            with open(file_path, 'w') as f:
                f.write(self._serialize_data(session.dict()))
            
            self._update_stats()
            logger.info(f"Closed session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to close session {session_id}: {e}")
            return False
    
    def get_stats(self) -> ContextStats:
        """Get current context statistics"""
        self._update_stats()
        return self._stats
    
    def cleanup_expired_entries(self) -> int:
        """Clean up expired context entries"""
        expired_count = 0
        
        for entry in list(self._entries_cache.values()):
            if (entry.metadata.expires_at and 
                entry.metadata.expires_at < datetime.now(timezone.utc) and
                entry.status == ContextStatus.ACTIVE):
                
                entry.status = ContextStatus.EXPIRED
                self._save_entry(entry)
                expired_count += 1
        
        logger.info(f"Marked {expired_count} entries as expired")
        return expired_count
    
    def create_backup(self, name: str, created_by: str, description: Optional[str] = None) -> Optional[ContextBackup]:
        """Create a backup of all context data"""
        try:
            backup = ContextBackup(
                name=name,
                description=description,
                created_by=created_by
            )
            
            # Collect all data
            backup.collections = list(self._collections_cache.keys())
            backup.sessions = list(self._sessions_cache.keys())
            
            # Create backup file
            backup_data = {
                "backup": backup.dict(),
                "entries": [entry.dict() for entry in self._entries_cache.values()],
                "sessions": [session.dict() for session in self._sessions_cache.values()],
                "collections": [collection.dict() for collection in self._collections_cache.values()]
            }
            
            file_path = self._get_backup_path(backup.backup_id)
            serialized = self._serialize_data(backup_data)
            
            with open(file_path, 'w') as f:
                f.write(serialized)
            
            backup.file_path = str(file_path)
            backup.file_size_bytes = len(serialized.encode('utf-8'))
            backup.checksum = self._calculate_checksum(serialized)
            
            # Save backup metadata
            backup_meta_path = self.backups_path / f"{backup.backup_id}_meta.json"
            with open(backup_meta_path, 'w') as f:
                f.write(self._serialize_data(backup.dict()))
            
            logger.info(f"Created backup: {backup.backup_id} ({backup.name})")
            return backup
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return None
    
    def restore_backup(self, backup_id: str) -> bool:
        """Restore context data from a backup"""
        try:
            file_path = self._get_backup_path(backup_id)
            if not file_path.exists():
                logger.error(f"Backup file not found: {backup_id}")
                return False
            
            with open(file_path, 'r') as f:
                data = self._deserialize_data(f.read())
            
            if not data or "backup" not in data:
                logger.error(f"Invalid backup format: {backup_id}")
                return False
            
            # Clear current cache
            self._entries_cache.clear()
            self._sessions_cache.clear()
            self._collections_cache.clear()
            
            # Restore entries
            for entry_data in data.get("entries", []):
                entry = ContextEntry(**entry_data)
                self._entries_cache[entry.context_id] = entry
                self._save_entry(entry)
            
            # Restore sessions
            for session_data in data.get("sessions", []):
                session = ContextSession(**session_data)
                self._sessions_cache[session.session_id] = session
                self._get_session_path(session.session_id).write_text(self._serialize_data(session.dict()))
            
            # Restore collections
            for collection_data in data.get("collections", []):
                collection = ContextCollection(**collection_data)
                self._collections_cache[collection.collection_id] = collection
                self._get_collection_path(collection.collection_id).write_text(self._serialize_data(collection.dict()))
            
            self._update_stats()
            logger.info(f"Restored backup: {backup_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to restore backup {backup_id}: {e}")
            return False
