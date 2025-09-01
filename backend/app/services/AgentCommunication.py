"""
Agent Communication Service for coordinating multiple AI agents
"""
import asyncio
import logging
import threading
import time
from typing import Dict, List, Optional, Callable, Any, Set
from datetime import datetime, timedelta
import json
import hashlib
import uuid
from collections import defaultdict

from ..models.Messages import (
    AgentMessage, MessageType, MessagePriority, MessageStatus,
    AgentInfo, AgentStatus, ContextData, ProgressData, ResourceRequest,
    ConflictData, DiscoveryMessage, HeartbeatMessage, ErrorReportMessage,
    CoordinationMessage, MessageBatch, CommunicationMetrics
)
from ..utils.message_router import MessageRouter

# Configure logging
logger = logging.getLogger(__name__)


class AgentCommunicationService:
    """
    Main service for agent communication, providing high-level interface
    for context sharing, progress reporting, and coordination
    """
    
    def __init__(self):
        self.router = MessageRouter()
        self.agent_contexts: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.shared_resources: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.conflict_resolution_strategies: Dict[str, Callable] = {}
        self.encryption_key: Optional[str] = None
        self.is_running = False
        self.processing_thread: Optional[threading.Thread] = None
        
        # Register default message handlers
        self._register_default_handlers()
        
        # Initialize conflict resolution strategies
        self._initialize_conflict_resolution()
        
        logger.info("Agent Communication Service initialized")
    
    def start(self) -> bool:
        """
        Start the agent communication service
        
        Returns:
            True if started successfully, False otherwise
        """
        try:
            if self.is_running:
                logger.warning("Agent Communication Service already running")
                return True
            
            self.is_running = True
            self.processing_thread = threading.Thread(target=self._message_processing_loop)
            self.processing_thread.daemon = True
            self.processing_thread.start()
            
            logger.info("Agent Communication Service started")
            return True
            
        except Exception as e:
            logger.error(f"Error starting Agent Communication Service: {str(e)}")
            self.is_running = False
            return False
    
    def stop(self) -> bool:
        """
        Stop the agent communication service
        
        Returns:
            True if stopped successfully, False otherwise
        """
        try:
            if not self.is_running:
                logger.warning("Agent Communication Service not running")
                return True
            
            self.is_running = False
            
            if self.processing_thread and self.processing_thread.is_alive():
                self.processing_thread.join(timeout=5.0)
            
            logger.info("Agent Communication Service stopped")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping Agent Communication Service: {str(e)}")
            return False
    
    def register_agent(self, agent_info: AgentInfo) -> bool:
        """
        Register an agent with the communication service
        
        Args:
            agent_info: Information about the agent to register
            
        Returns:
            True if registration successful, False otherwise
        """
        try:
            # Register with router
            if not self.router.register_agent(agent_info):
                return False
            
            # Initialize agent context
            self.agent_contexts[agent_info.agent_id] = {
                'agent_info': agent_info,
                'context_data': {},
                'active_tasks': set(),
                'resource_locks': set(),
                'last_activity': datetime.utcnow()
            }
            
            # Send discovery message
            discovery_msg = DiscoveryMessage(
                sender_id=agent_info.agent_id,
                agent_info=agent_info,
                action="register"
            )
            self.router.send_message(discovery_msg)
            
            logger.info(f"Agent {agent_info.agent_name} registered successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error registering agent {agent_info.agent_id}: {str(e)}")
            return False
    
    def unregister_agent(self, agent_id: str) -> bool:
        """
        Unregister an agent from the communication service
        
        Args:
            agent_id: ID of the agent to unregister
            
        Returns:
            True if unregistration successful, False otherwise
        """
        try:
            # Send unregister discovery message
            if agent_id in self.agent_contexts:
                agent_info = self.agent_contexts[agent_id]['agent_info']
                discovery_msg = DiscoveryMessage(
                    sender_id=agent_id,
                    agent_info=agent_info,
                    action="unregister"
                )
                self.router.send_message(discovery_msg)
            
            # Clean up agent context
            if agent_id in self.agent_contexts:
                del self.agent_contexts[agent_id]
            
            # Unregister from router
            return self.router.unregister_agent(agent_id)
            
        except Exception as e:
            logger.error(f"Error unregistering agent {agent_id}: {str(e)}")
            return False
    
    def share_context(self, sender_id: str, context_data: ContextData, 
                     recipient_ids: Optional[List[str]] = None) -> str:
        """
        Share context information with other agents
        
        Args:
            sender_id: ID of the sending agent
            context_data: Context data to share
            recipient_ids: List of recipient agent IDs (None for broadcast)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Create context share message
            message = AgentMessage(
                message_type=MessageType.CONTEXT_SHARE,
                sender_id=sender_id,
                recipient_ids=recipient_ids or [],
                content={'context_data': context_data.dict()},
                priority=MessagePriority.NORMAL
            )
            
            # Store context locally
            if sender_id in self.agent_contexts:
                self.agent_contexts[sender_id]['context_data'][context_data.context_id] = context_data
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error sharing context from {sender_id}: {str(e)}")
            return ""
    
    def report_progress(self, sender_id: str, progress_data: ProgressData,
                       recipient_ids: Optional[List[str]] = None) -> str:
        """
        Report progress on a task or workstream
        
        Args:
            sender_id: ID of the sending agent
            progress_data: Progress data to report
            recipient_ids: List of recipient agent IDs (None for broadcast)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Create progress update message
            message = AgentMessage(
                message_type=MessageType.PROGRESS_UPDATE,
                sender_id=sender_id,
                recipient_ids=recipient_ids or [],
                content={'progress_data': progress_data.dict()},
                priority=MessagePriority.NORMAL
            )
            
            # Update local progress tracking
            if sender_id in self.agent_contexts:
                self.agent_contexts[sender_id]['active_tasks'].add(progress_data.task_id)
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error reporting progress from {sender_id}: {str(e)}")
            return ""
    
    def request_resource(self, sender_id: str, resource_request: ResourceRequest,
                        recipient_ids: Optional[List[str]] = None) -> str:
        """
        Request access to a shared resource
        
        Args:
            sender_id: ID of the requesting agent
            resource_request: Resource request details
            recipient_ids: List of recipient agent IDs (None for broadcast)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Create resource request message
            message = AgentMessage(
                message_type=MessageType.RESOURCE_REQUEST,
                sender_id=sender_id,
                recipient_ids=recipient_ids or [],
                content={'resource_request': resource_request.dict()},
                priority=resource_request.priority
            )
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error requesting resource from {sender_id}: {str(e)}")
            return ""
    
    def resolve_conflict(self, sender_id: str, conflict_data: ConflictData,
                        recipient_ids: Optional[List[str]] = None) -> str:
        """
        Initiate conflict resolution
        
        Args:
            sender_id: ID of the sending agent
            conflict_data: Conflict details
            recipient_ids: List of recipient agent IDs (None for broadcast)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Create conflict resolution message
            message = AgentMessage(
                message_type=MessageType.CONFLICT_RESOLUTION,
                sender_id=sender_id,
                recipient_ids=recipient_ids or [],
                content={'conflict_data': conflict_data.dict()},
                priority=MessagePriority.HIGH
            )
            
            # Apply automatic conflict resolution if possible
            resolution_strategy = self.conflict_resolution_strategies.get(conflict_data.conflict_type)
            if resolution_strategy:
                try:
                    resolution = resolution_strategy(conflict_data)
                    if resolution:
                        conflict_data.proposed_solution = resolution
                        conflict_data.resolution_strategy = "automatic"
                except Exception as e:
                    logger.warning(f"Automatic conflict resolution failed: {str(e)}")
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error resolving conflict from {sender_id}: {str(e)}")
            return ""
    
    def send_heartbeat(self, agent_id: str, status: AgentStatus = AgentStatus.AVAILABLE,
                      current_task_id: Optional[str] = None) -> str:
        """
        Send a heartbeat message to keep the agent alive
        
        Args:
            agent_id: ID of the agent sending heartbeat
            status: Current agent status
            current_task_id: ID of current task (if any)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Update local agent status
            if agent_id in self.agent_contexts:
                self.agent_contexts[agent_id]['agent_info'].current_status = status
                self.agent_contexts[agent_id]['agent_info'].current_task_id = current_task_id
                self.agent_contexts[agent_id]['last_activity'] = datetime.utcnow()
            
            # Create heartbeat message
            message = AgentMessage(
                message_type=MessageType.HEARTBEAT,
                sender_id=agent_id,
                content={
                    'agent_id': agent_id,
                    'status': status.value,
                    'current_task_id': current_task_id
                },
                priority=MessagePriority.LOW
            )
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error sending heartbeat from {agent_id}: {str(e)}")
            return ""
    
    def report_error(self, sender_id: str, error_type: str, error_message: str,
                    stack_trace: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Report an error to other agents
        
        Args:
            sender_id: ID of the sending agent
            error_type: Type of error
            error_message: Error message
            stack_trace: Stack trace (optional)
            context: Additional context (optional)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Create error report message
            message = AgentMessage(
                message_type=MessageType.ERROR_REPORT,
                sender_id=sender_id,
                content={
                    'error_type': error_type,
                    'error_message': error_message,
                    'stack_trace': stack_trace,
                    'context': context or {}
                },
                priority=MessagePriority.HIGH
            )
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error reporting error from {sender_id}: {str(e)}")
            return ""
    
    def coordinate_work(self, sender_id: str, coordination_type: str,
                       coordination_data: Dict[str, Any],
                       recipient_ids: Optional[List[str]] = None) -> str:
        """
        Coordinate work between agents
        
        Args:
            sender_id: ID of the sending agent
            coordination_type: Type of coordination (handoff, sync, delegate, merge)
            coordination_data: Coordination details
            recipient_ids: List of recipient agent IDs (None for broadcast)
            
        Returns:
            Message ID for tracking
        """
        try:
            # Create coordination message
            message = AgentMessage(
                message_type=MessageType.COORDINATION,
                sender_id=sender_id,
                recipient_ids=recipient_ids or [],
                content={
                    'coordination_type': coordination_type,
                    'coordination_data': coordination_data
                },
                priority=MessagePriority.HIGH
            )
            
            # Send message
            return self.router.send_message(message)
            
        except Exception as e:
            logger.error(f"Error coordinating work from {sender_id}: {str(e)}")
            return ""
    
    def get_agent_context(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current context for an agent
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Agent context or None if not found
        """
        return self.agent_contexts.get(agent_id)
    
    def get_communication_metrics(self) -> CommunicationMetrics:
        """
        Get current communication metrics
        
        Returns:
            Current communication metrics
        """
        return self.router.get_communication_metrics()
    
    def get_active_agents(self) -> List[AgentInfo]:
        """
        Get list of active agents
        
        Returns:
            List of active agent information
        """
        return list(self.router.registered_agents.values())
    
    def add_conflict_resolution_strategy(self, conflict_type: str, strategy: Callable) -> None:
        """
        Add a custom conflict resolution strategy
        
        Args:
            conflict_type: Type of conflict this strategy handles
            strategy: Function that takes ConflictData and returns resolution string
        """
        self.conflict_resolution_strategies[conflict_type] = strategy
        logger.info(f"Added conflict resolution strategy for type: {conflict_type}")
    
    def _register_default_handlers(self) -> None:
        """Register default message handlers"""
        
        def handle_context_share(message: AgentMessage, recipient_id: str) -> None:
            """Handle context share messages"""
            try:
                context_data_dict = message.content.get('context_data', {})
                context_data = ContextData(**context_data_dict)
                
                if recipient_id in self.agent_contexts:
                    self.agent_contexts[recipient_id]['context_data'][context_data.context_id] = context_data
                
                logger.debug(f"Context shared to {recipient_id}: {context_data.context_id}")
                
            except Exception as e:
                logger.error(f"Error handling context share: {str(e)}")
        
        def handle_progress_update(message: AgentMessage, recipient_id: str) -> None:
            """Handle progress update messages"""
            try:
                progress_data_dict = message.content.get('progress_data', {})
                progress_data = ProgressData(**progress_data_dict)
                
                # Update local progress tracking
                if recipient_id in self.agent_contexts:
                    self.agent_contexts[recipient_id]['active_tasks'].add(progress_data.task_id)
                
                logger.debug(f"Progress update received by {recipient_id}: {progress_data.task_id}")
                
            except Exception as e:
                logger.error(f"Error handling progress update: {str(e)}")
        
        def handle_resource_request(message: AgentMessage, recipient_id: str) -> None:
            """Handle resource request messages"""
            try:
                resource_request_dict = message.content.get('resource_request', {})
                resource_request = ResourceRequest(**resource_request_dict)
                
                # Check if this agent has the requested resource
                if resource_request.resource_id in self.shared_resources:
                    # Grant access if available
                    self.shared_resources[resource_request.resource_id]['locked_by'] = message.sender_id
                    logger.info(f"Resource {resource_request.resource_id} granted to {message.sender_id}")
                
            except Exception as e:
                logger.error(f"Error handling resource request: {str(e)}")
        
        def handle_conflict_resolution(message: AgentMessage, recipient_id: str) -> None:
            """Handle conflict resolution messages"""
            try:
                conflict_data_dict = message.content.get('conflict_data', {})
                conflict_data = ConflictData(**conflict_data_dict)
                
                # Apply resolution if automatic
                if conflict_data.resolution_strategy == "automatic" and conflict_data.proposed_solution:
                    logger.info(f"Applying automatic conflict resolution: {conflict_data.proposed_solution}")
                
            except Exception as e:
                logger.error(f"Error handling conflict resolution: {str(e)}")
        
        # Register handlers
        self.router.register_handler(MessageType.CONTEXT_SHARE, handle_context_share)
        self.router.register_handler(MessageType.PROGRESS_UPDATE, handle_progress_update)
        self.router.register_handler(MessageType.RESOURCE_REQUEST, handle_resource_request)
        self.router.register_handler(MessageType.CONFLICT_RESOLUTION, handle_conflict_resolution)
    
    def _initialize_conflict_resolution(self) -> None:
        """Initialize default conflict resolution strategies"""
        
        def resolve_resource_conflict(conflict_data: ConflictData) -> Optional[str]:
            """Resolve resource conflicts by granting access to highest priority agent"""
            try:
                # Find the agent with highest priority
                highest_priority_agent = None
                highest_priority = 0
                
                for agent_id in conflict_data.involved_agents:
                    if agent_id in self.agent_contexts:
                        agent_info = self.agent_contexts[agent_id]['agent_info']
                        # Simple priority based on agent type (can be enhanced)
                        priority = 1 if 'coordinator' in agent_info.agent_type.lower() else 0
                        if priority > highest_priority:
                            highest_priority = priority
                            highest_priority_agent = agent_id
                
                if highest_priority_agent:
                    return f"Grant resource access to {highest_priority_agent}"
                
                return None
                
            except Exception as e:
                logger.error(f"Error in resource conflict resolution: {str(e)}")
                return None
        
        def resolve_task_conflict(conflict_data: ConflictData) -> Optional[str]:
            """Resolve task conflicts by delegating to available agent"""
            try:
                # Find available agent
                for agent_id in self.agent_contexts:
                    if agent_id not in conflict_data.involved_agents:
                        agent_info = self.agent_contexts[agent_id]['agent_info']
                        if agent_info.current_status == AgentStatus.AVAILABLE:
                            return f"Delegate task to {agent_id}"
                
                return "Wait for agent availability"
                
            except Exception as e:
                logger.error(f"Error in task conflict resolution: {str(e)}")
                return None
        
        # Register default strategies
        self.add_conflict_resolution_strategy("resource", resolve_resource_conflict)
        self.add_conflict_resolution_strategy("task", resolve_task_conflict)
    
    def _message_processing_loop(self) -> None:
        """Main message processing loop"""
        while self.is_running:
            try:
                # Process messages
                self.router.process_messages()
                
                # Clean up expired messages
                self.router.cleanup_expired_messages()
                
                # Clean up expired contexts
                self._cleanup_expired_contexts()
                
                # Sleep briefly to prevent busy waiting
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error in message processing loop: {str(e)}")
                time.sleep(1.0)  # Longer sleep on error
    
    def _cleanup_expired_contexts(self) -> None:
        """Clean up expired context data"""
        current_time = datetime.utcnow()
        
        for agent_id, context in self.agent_contexts.items():
            expired_contexts = []
            
            for context_id, context_data in context['context_data'].items():
                if context_data.expires_at and current_time > context_data.expires_at:
                    expired_contexts.append(context_id)
            
            for context_id in expired_contexts:
                del context['context_data'][context_id]
            
            if expired_contexts:
                logger.debug(f"Cleaned up {len(expired_contexts)} expired contexts for agent {agent_id}")


# Global instance for easy access
agent_communication_service = AgentCommunicationService()
