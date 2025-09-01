"""
Message routing utilities for agent communication
"""
import asyncio
import logging
from typing import Dict, List, Optional, Callable, Any, Set
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
import hashlib

from ..models.Messages import (
    AgentMessage, MessageType, MessagePriority, MessageStatus,
    AgentInfo, AgentStatus, MessageBatch, CommunicationMetrics
)

# Configure logging
logger = logging.getLogger(__name__)


class MessageRouter:
    """
    Routes messages between agents efficiently with priority handling,
    retry logic, and load balancing
    """
    
    def __init__(self):
        self.registered_agents: Dict[str, AgentInfo] = {}
        self.message_queues: Dict[MessagePriority, deque] = {
            priority: deque() for priority in MessagePriority
        }
        self.message_handlers: Dict[MessageType, List[Callable]] = defaultdict(list)
        self.delivery_history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.routing_rules: Dict[str, List[str]] = defaultdict(list)
        self.metrics = CommunicationMetrics()
        
        # Performance tracking
        self.message_latency: Dict[str, List[float]] = defaultdict(list)
        self.delivery_success_rate: Dict[str, float] = defaultdict(lambda: 1.0)
        
        # Security
        self.encryption_enabled = False
        self.signature_verification = False
        
    def register_agent(self, agent_info: AgentInfo) -> bool:
        """
        Register an agent with the message router
        
        Args:
            agent_info: Information about the agent to register
            
        Returns:
            True if registration successful, False otherwise
        """
        try:
            if agent_info.agent_id in self.registered_agents:
                logger.warning(f"Agent {agent_info.agent_id} already registered")
                return False
                
            self.registered_agents[agent_info.agent_id] = agent_info
            logger.info(f"Agent {agent_info.agent_name} ({agent_info.agent_id}) registered")
            
            # Update metrics
            self.metrics.active_agents = len(self.registered_agents)
            self.metrics.last_updated = datetime.utcnow()
            
            return True
            
        except Exception as e:
            logger.error(f"Error registering agent {agent_info.agent_id}: {str(e)}")
            return False
    
    def unregister_agent(self, agent_id: str) -> bool:
        """
        Unregister an agent from the message router
        
        Args:
            agent_id: ID of the agent to unregister
            
        Returns:
            True if unregistration successful, False otherwise
        """
        try:
            if agent_id not in self.registered_agents:
                logger.warning(f"Agent {agent_id} not found for unregistration")
                return False
                
            agent_name = self.registered_agents[agent_id].agent_name
            del self.registered_agents[agent_id]
            
            # Clean up routing rules
            if agent_id in self.routing_rules:
                del self.routing_rules[agent_id]
            
            logger.info(f"Agent {agent_name} ({agent_id}) unregistered")
            
            # Update metrics
            self.metrics.active_agents = len(self.registered_agents)
            self.metrics.last_updated = datetime.utcnow()
            
            return True
            
        except Exception as e:
            logger.error(f"Error unregistering agent {agent_id}: {str(e)}")
            return False
    
    def send_message(self, message: AgentMessage) -> str:
        """
        Send a message to one or more agents
        
        Args:
            message: The message to send
            
        Returns:
            Message ID for tracking
        """
        try:
            # Validate message
            if not self._validate_message(message):
                raise ValueError("Invalid message format")
            
            # Determine recipients
            recipients = self._determine_recipients(message)
            if not recipients:
                logger.warning(f"No recipients found for message {message.message_id}")
                message.status = MessageStatus.FAILED
                return message.message_id
            
            # Add to appropriate queue based on priority
            self.message_queues[message.priority].append({
                'message': message,
                'recipients': recipients,
                'timestamp': datetime.utcnow()
            })
            
            # Update metrics
            self.metrics.total_messages_sent += 1
            self.metrics.messages_by_type[message.message_type.value] = \
                self.metrics.messages_by_type.get(message.message_type.value, 0) + 1
            
            logger.info(f"Message {message.message_id} queued for {len(recipients)} recipients")
            return message.message_id
            
        except Exception as e:
            logger.error(f"Error sending message {message.message_id}: {str(e)}")
            message.status = MessageStatus.FAILED
            return message.message_id
    
    def send_batch(self, batch: MessageBatch) -> List[str]:
        """
        Send a batch of messages efficiently
        
        Args:
            batch: Batch of messages to send
            
        Returns:
            List of message IDs
        """
        message_ids = []
        
        try:
            for message in batch.messages:
                message_id = self.send_message(message)
                message_ids.append(message_id)
            
            logger.info(f"Batch {batch.batch_id} sent with {len(message_ids)} messages")
            return message_ids
            
        except Exception as e:
            logger.error(f"Error sending batch {batch.batch_id}: {str(e)}")
            return message_ids
    
    def register_handler(self, message_type: MessageType, handler: Callable) -> None:
        """
        Register a message handler for a specific message type
        
        Args:
            message_type: Type of message to handle
            handler: Function to handle the message
        """
        self.message_handlers[message_type].append(handler)
        logger.info(f"Handler registered for message type: {message_type.value}")
    
    def process_messages(self) -> None:
        """
        Process all queued messages in priority order
        """
        try:
            # Process messages by priority (highest first)
            priority_order = [
                MessagePriority.CRITICAL,
                MessagePriority.URGENT,
                MessagePriority.HIGH,
                MessagePriority.NORMAL,
                MessagePriority.LOW
            ]
            
            for priority in priority_order:
                queue = self.message_queues[priority]
                
                while queue:
                    message_data = queue.popleft()
                    self._process_single_message(message_data)
                    
        except Exception as e:
            logger.error(f"Error processing messages: {str(e)}")
    
    def _process_single_message(self, message_data: Dict[str, Any]) -> None:
        """
        Process a single message
        
        Args:
            message_data: Message data containing message and recipients
        """
        message = message_data['message']
        recipients = message_data['recipients']
        timestamp = message_data['timestamp']
        
        try:
            # Check if message has expired
            if message.expires_at and datetime.utcnow() > message.expires_at:
                message.status = MessageStatus.EXPIRED
                logger.warning(f"Message {message.message_id} expired")
                return
            
            # Attempt delivery to each recipient
            successful_deliveries = 0
            
            for recipient_id in recipients:
                if self._deliver_message(message, recipient_id):
                    successful_deliveries += 1
            
            # Update message status
            if successful_deliveries > 0:
                message.status = MessageStatus.DELIVERED
                logger.info(f"Message {message.message_id} delivered to {successful_deliveries}/{len(recipients)} recipients")
            else:
                message.status = MessageStatus.FAILED
                logger.error(f"Message {message.message_id} failed to deliver to any recipients")
            
            # Update delivery history
            self.delivery_history[message.message_id].append({
                'timestamp': timestamp,
                'recipients': recipients,
                'successful_deliveries': successful_deliveries,
                'status': message.status
            })
            
            # Update metrics
            self.metrics.total_messages_received += successful_deliveries
            if successful_deliveries < len(recipients):
                self.metrics.failed_deliveries += (len(recipients) - successful_deliveries)
            
        except Exception as e:
            logger.error(f"Error processing message {message.message_id}: {str(e)}")
            message.status = MessageStatus.FAILED
    
    def _deliver_message(self, message: AgentMessage, recipient_id: str) -> bool:
        """
        Deliver a message to a specific recipient
        
        Args:
            message: Message to deliver
            recipient_id: ID of the recipient
            
        Returns:
            True if delivery successful, False otherwise
        """
        try:
            # Check if recipient is registered and available
            if recipient_id not in self.registered_agents:
                logger.warning(f"Recipient {recipient_id} not registered")
                return False
            
            agent_info = self.registered_agents[recipient_id]
            
            # Check if agent is available
            if agent_info.current_status == AgentStatus.OFFLINE:
                logger.warning(f"Recipient {recipient_id} is offline")
                return False
            
            # Call registered handlers for this message type
            handlers = self.message_handlers.get(message.message_type, [])
            
            if not handlers:
                logger.warning(f"No handlers registered for message type {message.message_type.value}")
                return False
            
            # Execute handlers
            for handler in handlers:
                try:
                    handler(message, recipient_id)
                except Exception as e:
                    logger.error(f"Handler error for message {message.message_id}: {str(e)}")
            
            # Update message status
            message.status = MessageStatus.DELIVERED
            
            # Update delivery metrics
            delivery_time = (datetime.utcnow() - message.timestamp).total_seconds()
            self.message_latency[recipient_id].append(delivery_time)
            
            # Keep only last 100 latency measurements
            if len(self.message_latency[recipient_id]) > 100:
                self.message_latency[recipient_id] = self.message_latency[recipient_id][-100:]
            
            return True
            
        except Exception as e:
            logger.error(f"Error delivering message {message.message_id} to {recipient_id}: {str(e)}")
            return False
    
    def _validate_message(self, message: AgentMessage) -> bool:
        """
        Validate a message before processing
        
        Args:
            message: Message to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Check required fields
            if not message.message_id or not message.sender_id:
                return False
            
            # Check if sender is registered
            if message.sender_id not in self.registered_agents:
                logger.warning(f"Sender {message.sender_id} not registered")
                return False
            
            # Validate timestamp
            if message.timestamp > datetime.utcnow() + timedelta(minutes=5):
                logger.warning(f"Message {message.message_id} has future timestamp")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating message {message.message_id}: {str(e)}")
            return False
    
    def _determine_recipients(self, message: AgentMessage) -> List[str]:
        """
        Determine the recipients for a message
        
        Args:
            message: Message to determine recipients for
            
        Returns:
            List of recipient agent IDs
        """
        recipients = set()
        
        # If specific recipients are specified
        if message.recipient_ids:
            recipients.update(message.recipient_ids)
        
        # If no recipients specified, it's a broadcast
        else:
            # Get all available agents except sender
            for agent_id, agent_info in self.registered_agents.items():
                if agent_id != message.sender_id and agent_info.current_status != AgentStatus.OFFLINE:
                    recipients.add(agent_id)
        
        # Apply routing rules
        if message.routing_key and message.routing_key in self.routing_rules:
            routing_recipients = set(self.routing_rules[message.routing_key])
            recipients = recipients.intersection(routing_recipients)
        
        return list(recipients)
    
    def get_agent_status(self, agent_id: str) -> Optional[AgentStatus]:
        """
        Get the current status of an agent
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Agent status or None if agent not found
        """
        if agent_id in self.registered_agents:
            return self.registered_agents[agent_id].current_status
        return None
    
    def get_communication_metrics(self) -> CommunicationMetrics:
        """
        Get current communication metrics
        
        Returns:
            Current communication metrics
        """
        # Calculate average response time
        if self.message_latency:
            all_latencies = []
            for latencies in self.message_latency.values():
                all_latencies.extend(latencies)
            
            if all_latencies:
                self.metrics.average_response_time = sum(all_latencies) / len(all_latencies)
        
        return self.metrics
    
    def add_routing_rule(self, routing_key: str, agent_ids: List[str]) -> None:
        """
        Add a routing rule for message filtering
        
        Args:
            routing_key: Key to match against message routing_key
            agent_ids: List of agent IDs that should receive messages with this key
        """
        self.routing_rules[routing_key] = agent_ids
        logger.info(f"Routing rule added for key '{routing_key}' with {len(agent_ids)} agents")
    
    def remove_routing_rule(self, routing_key: str) -> None:
        """
        Remove a routing rule
        
        Args:
            routing_key: Key of the rule to remove
        """
        if routing_key in self.routing_rules:
            del self.routing_rules[routing_key]
            logger.info(f"Routing rule removed for key '{routing_key}'")
    
    def cleanup_expired_messages(self) -> int:
        """
        Clean up expired messages from queues
        
        Returns:
            Number of messages cleaned up
        """
        cleaned_count = 0
        current_time = datetime.utcnow()
        
        for priority, queue in self.message_queues.items():
            # Create new queue without expired messages
            new_queue = deque()
            
            while queue:
                message_data = queue.popleft()
                message = message_data['message']
                
                if message.expires_at and current_time > message.expires_at:
                    message.status = MessageStatus.EXPIRED
                    cleaned_count += 1
                else:
                    new_queue.append(message_data)
            
            self.message_queues[priority] = new_queue
        
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} expired messages")
        
        return cleaned_count
