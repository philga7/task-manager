#!/usr/bin/env python3
"""
Test script for agent communication protocol
"""
import asyncio
import time
import uuid
from datetime import datetime, timedelta

# Import our modules
from app.services.AgentCommunication import agent_communication_service
from app.models.Messages import (
    AgentInfo, AgentStatus, ContextData, ProgressData, ResourceRequest,
    ConflictData, MessageType, MessagePriority
)


def test_agent_registration():
    """Test agent registration and unregistration"""
    print("🧪 Testing Agent Registration...")
    
    # Create test agents
    agent1 = AgentInfo(
        agent_id=f"test_agent_1_{uuid.uuid4().hex[:8]}",
        agent_name="Test Agent 1",
        agent_type="task_executor",
        capabilities=["task_execution", "progress_reporting"],
        current_status=AgentStatus.AVAILABLE
    )
    
    agent2 = AgentInfo(
        agent_id=f"test_agent_2_{uuid.uuid4().hex[:8]}",
        agent_name="Test Agent 2",
        agent_type="coordinator",
        capabilities=["coordination", "conflict_resolution"],
        current_status=AgentStatus.AVAILABLE
    )
    
    # Register agents
    assert agent_communication_service.register_agent(agent1), "Failed to register agent 1"
    assert agent_communication_service.register_agent(agent2), "Failed to register agent 2"
    
    # Verify registration
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) == 2, f"Expected 2 agents, got {len(active_agents)}"
    
    print("✅ Agent registration test passed!")


def test_context_sharing():
    """Test context sharing between agents"""
    print("🧪 Testing Context Sharing...")
    
    # Get the first registered agent
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) > 0, "No agents registered"
    agent_id = active_agents[0].agent_id
    
    # Create test context
    context_data = ContextData(
        task_id="test_task_123",
        workstream_id="test_workstream_456",
        data={
            "current_step": "data_processing",
            "processed_items": 150,
            "total_items": 300,
            "configuration": {"batch_size": 50, "timeout": 30}
        },
        metadata={"priority": "high", "deadline": "2024-01-15"},
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    
    # Share context
    message_id = agent_communication_service.share_context(
        sender_id=agent_id,
        context_data=context_data
    )
    
    assert message_id, "Failed to share context"
    
    # Verify context was stored
    agent_context = agent_communication_service.get_agent_context(agent_id)
    assert agent_context is not None, "Agent context not found"
    assert context_data.context_id in agent_context['context_data'], "Context not stored"
    
    print("✅ Context sharing test passed!")


def test_progress_reporting():
    """Test progress reporting"""
    print("🧪 Testing Progress Reporting...")
    
    # Get the first registered agent
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) > 0, "No agents registered"
    agent_id = active_agents[0].agent_id
    
    # Create progress data
    progress_data = ProgressData(
        task_id="test_task_123",
        workstream_id="test_workstream_456",
        progress_percentage=75.5,
        status="in_progress",
        completed_steps=["data_validation", "preprocessing", "feature_extraction"],
        remaining_steps=["model_training", "evaluation", "deployment"],
        estimated_completion=datetime.utcnow() + timedelta(hours=2),
        blockers=["waiting for data validation results"],
        achievements=["processed 1000 records", "optimized memory usage"]
    )
    
    # Report progress
    message_id = agent_communication_service.report_progress(
        sender_id=agent_id,
        progress_data=progress_data
    )
    
    assert message_id, "Failed to report progress"
    
    # Verify task is tracked
    agent_context = agent_communication_service.get_agent_context(agent_id)
    assert "test_task_123" in agent_context['active_tasks'], "Task not tracked"
    
    print("✅ Progress reporting test passed!")


def test_resource_request():
    """Test resource request handling"""
    print("🧪 Testing Resource Request...")
    
    # Get the first registered agent
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) > 0, "No agents registered"
    agent_id = active_agents[0].agent_id
    
    # Create resource request
    resource_request = ResourceRequest(
        resource_id="database_connection",
        resource_type="database",
        requested_access="exclusive",
        duration_minutes=30,
        priority=MessagePriority.HIGH,
        reason="Need exclusive access for data migration"
    )
    
    # Send request
    message_id = agent_communication_service.request_resource(
        sender_id=agent_id,
        resource_request=resource_request
    )
    
    assert message_id, "Failed to request resource"
    
    print("✅ Resource request test passed!")


def test_conflict_resolution():
    """Test conflict resolution"""
    print("🧪 Testing Conflict Resolution...")
    
    # Get registered agents
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) >= 2, "Need at least 2 agents for conflict resolution"
    agent1_id = active_agents[0].agent_id
    agent2_id = active_agents[1].agent_id
    
    # Create conflict data
    conflict_data = ConflictData(
        conflict_type="resource",
        description="Multiple agents requesting exclusive access to database",
        involved_agents=[agent1_id, agent2_id],
        proposed_solution="Grant access to coordinator agent",
        requires_human_intervention=False
    )
    
    # Resolve conflict
    message_id = agent_communication_service.resolve_conflict(
        sender_id=agent1_id,
        conflict_data=conflict_data
    )
    
    assert message_id, "Failed to resolve conflict"
    
    print("✅ Conflict resolution test passed!")


def test_heartbeat():
    """Test heartbeat functionality"""
    print("🧪 Testing Heartbeat...")
    
    # Get the first registered agent
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) > 0, "No agents registered"
    agent_id = active_agents[0].agent_id
    
    # Send heartbeat
    message_id = agent_communication_service.send_heartbeat(
        agent_id=agent_id,
        status=AgentStatus.BUSY,
        current_task_id="test_task_123"
    )
    
    assert message_id, "Failed to send heartbeat"
    
    # Verify status update
    agent_context = agent_communication_service.get_agent_context(agent_id)
    assert agent_context['agent_info'].current_status == AgentStatus.BUSY, "Status not updated"
    assert agent_context['agent_info'].current_task_id == "test_task_123", "Task ID not updated"
    
    print("✅ Heartbeat test passed!")


def test_error_reporting():
    """Test error reporting"""
    print("🧪 Testing Error Reporting...")
    
    # Get the first registered agent
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) > 0, "No agents registered"
    agent_id = active_agents[0].agent_id
    
    # Report error
    message_id = agent_communication_service.report_error(
        sender_id=agent_id,
        error_type="data_validation_error",
        error_message="Invalid data format detected in input file",
        stack_trace="Traceback (most recent call last):\n  File 'processor.py', line 45...",
        context={"file_path": "/data/input.csv", "line_number": 1234}
    )
    
    assert message_id, "Failed to report error"
    
    print("✅ Error reporting test passed!")


def test_coordination():
    """Test work coordination"""
    print("🧪 Testing Work Coordination...")
    
    # Get registered agents
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) >= 2, "Need at least 2 agents for coordination"
    agent1_id = active_agents[0].agent_id
    agent2_id = active_agents[1].agent_id
    
    # Coordinate work
    message_id = agent_communication_service.coordinate_work(
        sender_id=agent1_id,
        coordination_type="handoff",
        coordination_data={
            "task_id": "test_task_123",
            "handoff_reason": "Agent 1 completed preprocessing phase",
            "next_phase": "model_training",
            "estimated_duration": "2 hours"
        },
        recipient_ids=[agent2_id]
    )
    
    assert message_id, "Failed to coordinate work"
    
    print("✅ Work coordination test passed!")


def test_metrics():
    """Test metrics collection"""
    print("🧪 Testing Metrics Collection...")
    
    # Get metrics
    metrics = agent_communication_service.get_communication_metrics()
    
    assert metrics.total_messages_sent > 0, "No messages sent"
    assert metrics.active_agents == 2, f"Expected 2 active agents, got {metrics.active_agents}"
    assert "context_share" in metrics.messages_by_type, "Context share messages not tracked"
    assert "progress_update" in metrics.messages_by_type, "Progress update messages not tracked"
    
    print(f"📊 Metrics: {metrics.total_messages_sent} messages sent, {metrics.active_agents} active agents")
    print("✅ Metrics collection test passed!")


def test_cleanup():
    """Test cleanup and unregistration"""
    print("🧪 Testing Cleanup...")
    
    # Get all registered agents
    active_agents = agent_communication_service.get_active_agents()
    
    # Unregister all agents
    for agent in active_agents:
        assert agent_communication_service.unregister_agent(agent.agent_id), f"Failed to unregister agent {agent.agent_id}"
    
    # Verify unregistration
    active_agents = agent_communication_service.get_active_agents()
    assert len(active_agents) == 0, f"Expected 0 agents, got {len(active_agents)}"
    
    print("✅ Cleanup test passed!")


def run_all_tests():
    """Run all tests"""
    print("🚀 Starting Agent Communication Protocol Tests...\n")
    
    try:
        # Start the communication service
        assert agent_communication_service.start(), "Failed to start communication service"
        
        # Run tests
        test_agent_registration()
        test_context_sharing()
        test_progress_reporting()
        test_resource_request()
        test_conflict_resolution()
        test_heartbeat()
        test_error_reporting()
        test_coordination()
        test_metrics()
        test_cleanup()
        
        # Stop the service
        assert agent_communication_service.stop(), "Failed to stop communication service"
        
        print("\n🎉 All tests passed! Agent communication protocol is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        agent_communication_service.stop()
        raise


if __name__ == "__main__":
    run_all_tests()
