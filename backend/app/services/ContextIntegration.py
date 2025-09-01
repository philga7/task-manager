"""
Context Integration Service for connecting context management with agent communication
"""
import logging
import asyncio
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta, timezone
import json

from .ContextManager import ContextManager
from .AgentCommunication import AgentCommunicationService
from ..models.Context import (
    ContextEntry, ContextSession, ContextCollection, ContextType,
    ContextStatus, ContextAccessLevel, ContextQuery
)
from ..models.Messages import (
    AgentMessage, MessageType, MessagePriority, ContextData,
    AgentInfo, AgentStatus
)
from ..models.Agents import Agent

logger = logging.getLogger(__name__)


class ContextIntegrationService:
    """Service for integrating context management with agent communication"""
    
    def __init__(self, context_manager: ContextManager, agent_communication: AgentCommunicationService):
        self.context_manager = context_manager
        self.agent_communication = agent_communication
        
        # Agent context mappings
        self.agent_context_sessions: Dict[str, str] = {}  # agent_id -> session_id
        self.agent_context_cache: Dict[str, Dict[str, Any]] = {}  # agent_id -> context_cache
        
        # Context sharing subscriptions
        self.context_subscribers: Dict[str, Set[str]] = {}  # context_type -> set of agent_ids
        
        # Performance metrics
        self.context_access_count = 0
        self.context_share_count = 0
        self.context_sync_count = 0
        
        logger.info("Context Integration Service initialized")
    
    def register_agent_context(self, agent_id: str, agent_info: AgentInfo) -> bool:
        """Register an agent for context management"""
        try:
            # Create a context session for the agent
            session = self.context_manager.create_session(
                agent_id=agent_id,
                user_id=agent_info.user_id if hasattr(agent_info, 'user_id') else None,
                workstream_id=agent_info.workstream_id if hasattr(agent_info, 'workstream_id') else None,
                project_id=agent_info.project_id if hasattr(agent_info, 'project_id') else None
            )
            
            if not session:
                logger.error(f"Failed to create context session for agent {agent_id}")
                return False
            
            # Store the session mapping
            self.agent_context_sessions[agent_id] = session.session_id
            self.agent_context_cache[agent_id] = {}
            
            # Create agent-specific context entry
            agent_context = {
                "agent_id": agent_id,
                "agent_name": agent_info.agent_name,
                "capabilities": agent_info.capabilities if hasattr(agent_info, 'capabilities') else [],
                "specializations": agent_info.specializations if hasattr(agent_info, 'specializations') else [],
                "status": agent_info.status.value if hasattr(agent_info, 'status') else "unknown",
                "registered_at": datetime.now(timezone.utc).isoformat()
            }
            
            entry = self.context_manager.create_context_entry(
                context_type=ContextType.AGENT_CONTEXT,
                key=f"agent_{agent_id}",
                value=agent_context,
                created_by=agent_id,
                description=f"Context for agent {agent_info.agent_name}",
                tags=["agent", "registration"],
                access_level=ContextAccessLevel.SHARED
            )
            
            if entry:
                logger.info(f"Registered agent {agent_id} for context management")
                return True
            else:
                logger.error(f"Failed to create agent context entry for {agent_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to register agent context for {agent_id}: {e}")
            return False
    
    def unregister_agent_context(self, agent_id: str) -> bool:
        """Unregister an agent from context management"""
        try:
            # Close the agent's session
            session_id = self.agent_context_sessions.get(agent_id)
            if session_id:
                self.context_manager.close_session(session_id)
                del self.agent_context_sessions[agent_id]
            
            # Clear agent cache
            if agent_id in self.agent_context_cache:
                del self.agent_context_cache[agent_id]
            
            # Remove from context subscribers
            for context_type, subscribers in self.context_subscribers.items():
                subscribers.discard(agent_id)
            
            # Mark agent context as archived
            query = ContextQuery(
                context_type=ContextType.AGENT_CONTEXT,
                key_pattern=f"agent_{agent_id}"
            )
            entries = self.context_manager.query_context_entries(query)
            
            for entry in entries:
                entry.status = ContextStatus.ARCHIVED
                self.context_manager._save_entry(entry)
            
            logger.info(f"Unregistered agent {agent_id} from context management")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unregister agent context for {agent_id}: {e}")
            return False
    
    def get_agent_context(self, agent_id: str, context_type: Optional[ContextType] = None) -> Dict[str, Any]:
        """Get context data for a specific agent"""
        try:
            self.context_access_count += 1
            
            # Check agent cache first
            if agent_id in self.agent_context_cache:
                cache = self.agent_context_cache[agent_id]
                if context_type:
                    return cache.get(context_type.value, {})
                return cache
            
            # Query context entries
            query = ContextQuery(
                context_type=context_type,
                limit=1000  # Get all relevant entries
            )
            
            entries = self.context_manager.query_context_entries(query)
            
            # Filter by access level and organize by type
            context_data = {}
            for entry in entries:
                if entry.status != ContextStatus.ACTIVE:
                    continue
                
                # Check access level
                if entry.metadata.access_level == ContextAccessLevel.PRIVATE:
                    if entry.metadata.created_by != agent_id:
                        continue
                elif entry.metadata.access_level == ContextAccessLevel.RESTRICTED:
                    # Add more sophisticated access control here
                    pass
                
                context_type_key = entry.context_type.value
                if context_type_key not in context_data:
                    context_data[context_type_key] = {}
                
                context_data[context_type_key][entry.key] = entry.value
            
            # Update agent cache
            self.agent_context_cache[agent_id] = context_data
            
            return context_data if not context_type else context_data.get(context_type.value, {})
            
        except Exception as e:
            logger.error(f"Failed to get context for agent {agent_id}: {e}")
            return {}
    
    def set_agent_context(
        self,
        agent_id: str,
        context_type: ContextType,
        key: str,
        value: Any,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        access_level: ContextAccessLevel = ContextAccessLevel.SHARED
    ) -> bool:
        """Set context data for a specific agent"""
        try:
            entry = self.context_manager.create_context_entry(
                context_type=context_type,
                key=key,
                value=value,
                created_by=agent_id,
                description=description,
                tags=tags,
                access_level=access_level
            )
            
            if entry:
                # Update agent cache
                if agent_id in self.agent_context_cache:
                    context_type_key = context_type.value
                    if context_type_key not in self.agent_context_cache[agent_id]:
                        self.agent_context_cache[agent_id][context_type_key] = {}
                    self.agent_context_cache[agent_id][context_type_key][key] = value
                
                # Notify subscribers if this is shared context
                if access_level in [ContextAccessLevel.SHARED, ContextAccessLevel.PUBLIC]:
                    self._notify_context_subscribers(context_type, entry)
                
                logger.debug(f"Set context for agent {agent_id}: {context_type.value}.{key}")
                return True
            else:
                logger.error(f"Failed to set context for agent {agent_id}: {context_type.value}.{key}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to set context for agent {agent_id}: {e}")
            return False
    
    def share_context_with_agents(
        self,
        context_type: ContextType,
        key: str,
        value: Any,
        target_agents: List[str],
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> bool:
        """Share context data with specific agents"""
        try:
            self.context_share_count += 1
            
            # Create shared context entry
            entry = self.context_manager.create_context_entry(
                context_type=context_type,
                key=key,
                value=value,
                created_by="system",
                description=description,
                tags=tags,
                access_level=ContextAccessLevel.SHARED
            )
            
            if not entry:
                return False
            
            # Send context share message to target agents
            context_data = ContextData(
                context_id=entry.context_id,
                task_id=value.get("task_id") if isinstance(value, dict) else None,
                workstream_id=value.get("workstream_id") if isinstance(value, dict) else None,
                data=value,
                metadata={
                    "context_type": context_type.value,
                    "key": key,
                    "created_by": "system",
                    "description": description,
                    "tags": tags
                }
            )
            
            for agent_id in target_agents:
                message = AgentMessage(
                    sender_id="system",
                    recipient_ids=[agent_id],
                    message_type=MessageType.CONTEXT_SHARE,
                    priority=MessagePriority.NORMAL,
                    content={"message": f"Shared context: {context_type.value}.{key}"},
                    timestamp=datetime.now(timezone.utc)
                )
                
                # Use the router's send_message method
                self.agent_communication.router.send_message(message)
            
            logger.info(f"Shared context {context_type.value}.{key} with {len(target_agents)} agents")
            return True
            
        except Exception as e:
            logger.error(f"Failed to share context with agents: {e}")
            return False
    
    def subscribe_to_context(self, agent_id: str, context_type: ContextType) -> bool:
        """Subscribe an agent to context updates of a specific type"""
        try:
            if context_type.value not in self.context_subscribers:
                self.context_subscribers[context_type.value] = set()
            
            self.context_subscribers[context_type.value].add(agent_id)
            logger.debug(f"Agent {agent_id} subscribed to {context_type.value} context")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe agent {agent_id} to {context_type.value} context: {e}")
            return False
    
    def unsubscribe_from_context(self, agent_id: str, context_type: ContextType) -> bool:
        """Unsubscribe an agent from context updates of a specific type"""
        try:
            if context_type.value in self.context_subscribers:
                self.context_subscribers[context_type.value].discard(agent_id)
            
            logger.debug(f"Agent {agent_id} unsubscribed from {context_type.value} context")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unsubscribe agent {agent_id} from {context_type.value} context: {e}")
            return False
    
    def _notify_context_subscribers(self, context_type: ContextType, entry: ContextEntry) -> None:
        """Notify subscribers about context updates"""
        try:
            subscribers = self.context_subscribers.get(context_type.value, set())
            
            if not subscribers:
                return
            
            context_data = ContextData(
                context_id=entry.context_id,
                task_id=entry.value.get("task_id") if isinstance(entry.value, dict) else None,
                workstream_id=entry.value.get("workstream_id") if isinstance(entry.value, dict) else None,
                data=entry.value,
                metadata={
                    "context_type": context_type.value,
                    "key": entry.key,
                    "created_by": entry.metadata.created_by,
                    "description": entry.metadata.description,
                    "tags": entry.metadata.tags
                }
            )
            
            for agent_id in subscribers:
                message = AgentMessage(
                    sender_id="system",
                    recipient_ids=[agent_id],
                    message_type=MessageType.CONTEXT_SHARE,
                    priority=MessagePriority.NORMAL,
                    content={"message": f"Context update: {context_type.value}.{entry.key}"},
                    timestamp=datetime.now(timezone.utc)
                )
                
                # Use the router's send_message method
                self.agent_communication.router.send_message(message)
            
            logger.debug(f"Notified {len(subscribers)} subscribers about {context_type.value} context update")
            
        except Exception as e:
            logger.error(f"Failed to notify context subscribers: {e}")
    
    def sync_agent_context(self, agent_id: str) -> bool:
        """Synchronize agent's context with the persistent storage"""
        try:
            self.context_sync_count += 1
            
            # Update session activity
            session_id = self.agent_context_sessions.get(agent_id)
            if session_id:
                self.context_manager.update_session_activity(session_id)
            
            # Clear agent cache to force refresh
            if agent_id in self.agent_context_cache:
                del self.agent_context_cache[agent_id]
            
            # Get fresh context data
            context_data = self.get_agent_context(agent_id)
            
            logger.debug(f"Synchronized context for agent {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync context for agent {agent_id}: {e}")
            return False
    
    def get_context_statistics(self) -> Dict[str, Any]:
        """Get context integration statistics"""
        stats = self.context_manager.get_stats()
        
        return {
            "context_manager_stats": stats.dict(),
            "integration_metrics": {
                "context_access_count": self.context_access_count,
                "context_share_count": self.context_share_count,
                "context_sync_count": self.context_sync_count,
                "registered_agents": len(self.agent_context_sessions),
                "context_subscribers": {
                    context_type: len(subscribers)
                    for context_type, subscribers in self.context_subscribers.items()
                }
            }
        }
    
    def cleanup_agent_context(self, agent_id: str) -> bool:
        """Clean up context data for a specific agent"""
        try:
            # Close session
            session_id = self.agent_context_sessions.get(agent_id)
            if session_id:
                self.context_manager.close_session(session_id)
                del self.agent_context_sessions[agent_id]
            
            # Clear cache
            if agent_id in self.agent_context_cache:
                del self.agent_context_cache[agent_id]
            
            # Remove from subscribers
            for context_type, subscribers in self.context_subscribers.items():
                subscribers.discard(agent_id)
            
            # Archive agent-specific context entries
            query = ContextQuery(
                context_type=ContextType.AGENT_CONTEXT,
                key_pattern=f"agent_{agent_id}"
            )
            entries = self.context_manager.query_context_entries(query)
            
            for entry in entries:
                entry.status = ContextStatus.ARCHIVED
                self.context_manager._save_entry(entry)
            
            logger.info(f"Cleaned up context for agent {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cleanup context for agent {agent_id}: {e}")
            return False
