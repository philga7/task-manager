#!/usr/bin/env python3
"""
Test script for agent specialization and assignment system
"""
import asyncio
import time
import uuid
import logging
from datetime import datetime, timedelta

# Enable detailed logging
logging.basicConfig(level=logging.INFO)

# Import our modules
from app.services.AgentManager import AgentManager
from app.models.Agents import (
    Agent, AgentType, AgentStatus, SkillLevel, AgentCapability,
    AgentPerformance, AgentHealth, AgentMatchingCriteria, AgentMatchingResult,
    AgentAssignment, AgentPool
)
from app.models.Workstream import Workstream, WorkstreamStatus


def test_agent_pool_initialization():
    """Test agent pool initialization and management"""
    print("🧪 Testing Agent Pool Initialization...")
    
    manager = AgentManager()
    
    # Initialize a pool
    pool = manager.initialize_pool("Development Team", "Main development team for web applications")
    assert pool.pool_id, "Pool ID not generated"
    assert pool.name == "Development Team", "Pool name not set correctly"
    
    print("✅ Agent pool initialization test passed!")


def test_agent_creation():
    """Test agent creation with different specializations"""
    print("🧪 Testing Agent Creation...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create UI Developer agent
    ui_capabilities = [
        AgentCapability(
            skill_name="React",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.95,
            experience_hours=2000,
            success_rate=0.92
        ),
        AgentCapability(
            skill_name="TypeScript",
            skill_level=SkillLevel.ADVANCED,
            confidence_score=0.88,
            experience_hours=1500,
            success_rate=0.89
        ),
        AgentCapability(
            skill_name="CSS",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.93,
            experience_hours=2500,
            success_rate=0.94
        )
    ]
    
    ui_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="UI Specialist Alice",
        agent_type=AgentType.UI_DEVELOPER,
        description="Expert in React and modern frontend development",
        capabilities=ui_capabilities,
        specializations=["React", "TypeScript", "Frontend Architecture"]
    )
    
    # Create API Developer agent
    api_capabilities = [
        AgentCapability(
            skill_name="Python",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.96,
            experience_hours=3000,
            success_rate=0.94
        ),
        AgentCapability(
            skill_name="FastAPI",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.92,
            experience_hours=1800,
            success_rate=0.91
        ),
        AgentCapability(
            skill_name="API Design",
            skill_level=SkillLevel.ADVANCED,
            confidence_score=0.89,
            experience_hours=1200,
            success_rate=0.88
        )
    ]
    
    api_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="API Expert Bob",
        agent_type=AgentType.API_DEVELOPER,
        description="Backend specialist with deep Python and API knowledge",
        capabilities=api_capabilities,
        specializations=["Python", "FastAPI", "Microservices"]
    )
    
    # Create Database Engineer agent
    db_capabilities = [
        AgentCapability(
            skill_name="PostgreSQL",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.94,
            experience_hours=2200,
            success_rate=0.93
        ),
        AgentCapability(
            skill_name="Database Design",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.91,
            experience_hours=1800,
            success_rate=0.90
        ),
        AgentCapability(
            skill_name="SQL",
            skill_level=SkillLevel.EXPERT,
            confidence_score=0.95,
            experience_hours=2500,
            success_rate=0.95
        )
    ]
    
    db_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Database Guru Carol",
        agent_type=AgentType.DATABASE_ENGINEER,
        description="Database optimization and design specialist",
        capabilities=db_capabilities,
        specializations=["PostgreSQL", "Database Optimization", "Data Modeling"]
    )
    
    # Verify agents were created
    assert len(pool.agents) == 3, f"Expected 3 agents, got {len(pool.agents)}"
    assert ui_agent.agent_type == AgentType.UI_DEVELOPER, "UI agent type not set correctly"
    assert api_agent.agent_type == AgentType.API_DEVELOPER, "API agent type not set correctly"
    assert db_agent.agent_type == AgentType.DATABASE_ENGINEER, "DB agent type not set correctly"
    
    print("✅ Agent creation test passed!")


def test_agent_matching():
    """Test intelligent agent matching to workstreams"""
    print("🧪 Testing Agent Matching...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create agents (reuse from previous test)
    ui_capabilities = [
        AgentCapability(skill_name="React", skill_level=SkillLevel.EXPERT, confidence_score=0.95, success_rate=0.92),
        AgentCapability(skill_name="TypeScript", skill_level=SkillLevel.ADVANCED, confidence_score=0.88, success_rate=0.89)
    ]
    
    api_capabilities = [
        AgentCapability(skill_name="Python", skill_level=SkillLevel.EXPERT, confidence_score=0.96, success_rate=0.94),
        AgentCapability(skill_name="FastAPI", skill_level=SkillLevel.EXPERT, confidence_score=0.92, success_rate=0.91)
    ]
    
    db_capabilities = [
        AgentCapability(skill_name="PostgreSQL", skill_level=SkillLevel.EXPERT, confidence_score=0.94, success_rate=0.93),
        AgentCapability(skill_name="Database Design", skill_level=SkillLevel.EXPERT, confidence_score=0.91, success_rate=0.90)
    ]
    
    ui_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="UI Specialist Alice",
        agent_type=AgentType.UI_DEVELOPER,
        description="Expert in React and modern frontend development",
        capabilities=ui_capabilities,
        specializations=["React", "TypeScript"]
    )
    
    api_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="API Expert Bob",
        agent_type=AgentType.API_DEVELOPER,
        description="Backend specialist with deep Python and API knowledge",
        capabilities=api_capabilities,
        specializations=["Python", "FastAPI"]
    )
    
    db_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Database Guru Carol",
        agent_type=AgentType.DATABASE_ENGINEER,
        description="Database optimization and design specialist",
        capabilities=db_capabilities,
        specializations=["PostgreSQL", "Database Design"]
    )
    
    # Create test workstreams
    original_task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    frontend_workstream = Workstream(
        id=f"frontend_{uuid.uuid4().hex[:8]}",
        name="Implement User Dashboard",
        description="Create a React-based user dashboard with TypeScript",
        original_task_id=original_task_id,
        status=WorkstreamStatus.PENDING,
        priority=1,
        tags=["frontend", "react", "typescript", "ui"]
    )
    
    backend_workstream = Workstream(
        id=f"backend_{uuid.uuid4().hex[:8]}",
        name="Build User API",
        description="Create FastAPI endpoints for user management",
        original_task_id=original_task_id,
        status=WorkstreamStatus.PENDING,
        priority=1,
        tags=["backend", "python", "fastapi", "api"]
    )
    
    database_workstream = Workstream(
        id=f"database_{uuid.uuid4().hex[:8]}",
        name="Design User Database Schema",
        description="Design and implement PostgreSQL schema for user data",
        original_task_id=original_task_id,
        status=WorkstreamStatus.PENDING,
        priority=1,
        tags=["database", "postgresql", "schema", "design"]
    )
    
    # Debug: Check agent status and health
    print(f"UI Agent ID: {ui_agent.id}, Status: {ui_agent.status}, Health: {ui_agent.health.is_healthy}")
    print(f"  Health agent_id: {ui_agent.health.agent_id}, Performance agent_id: {ui_agent.performance.agent_id}")
    print(f"API Agent ID: {api_agent.id}, Status: {api_agent.status}, Health: {api_agent.health.is_healthy}")
    print(f"  Health agent_id: {api_agent.health.agent_id}, Performance agent_id: {api_agent.performance.agent_id}")
    print(f"DB Agent ID: {db_agent.id}, Status: {db_agent.status}, Health: {db_agent.health.is_healthy}")
    print(f"  Health agent_id: {db_agent.health.agent_id}, Performance agent_id: {db_agent.performance.agent_id}")
    
    # Debug: Check available agents
    available_agents = [a for a in pool.agents if a.status == AgentStatus.AVAILABLE and a.health.is_healthy]
    print(f"Available agents: {len(available_agents)}")
    for agent in available_agents:
        print(f"  - {agent.name} ({agent.agent_type})")
        print(f"    Capabilities: {[cap.skill_name for cap in agent.capabilities]}")
        print(f"    Specializations: {agent.specializations}")
    
    # Test matching with debugging
    print(f"\nTesting frontend workstream: {frontend_workstream.name}")
    print(f"  Tags: {frontend_workstream.tags}")
    print(f"  Description: {frontend_workstream.description}")
    
    # Manually create criteria to debug
    from app.models.Agents import AgentMatchingCriteria
    manual_criteria = AgentMatchingCriteria(
        required_capabilities=["React", "TypeScript"],
        preferred_agent_types=[AgentType.UI_DEVELOPER, AgentType.FRONTEND_SPECIALIST]
    )
    print(f"  Manual criteria: {manual_criteria.required_capabilities}")
    
    frontend_assignment = manager.assign_agent_to_workstream(frontend_workstream, pool.pool_id, manual_criteria)
    
    print(f"\nTesting backend workstream: {backend_workstream.name}")
    print(f"  Tags: {backend_workstream.tags}")
    print(f"  Description: {backend_workstream.description}")
    
    backend_criteria = AgentMatchingCriteria(
        required_capabilities=["Python", "FastAPI"],
        preferred_agent_types=[AgentType.API_DEVELOPER, AgentType.BACKEND_SPECIALIST]
    )
    print(f"  Manual criteria: {backend_criteria.required_capabilities}")
    
    backend_assignment = manager.assign_agent_to_workstream(backend_workstream, pool.pool_id, backend_criteria)
    
    print(f"\nTesting database workstream: {database_workstream.name}")
    print(f"  Tags: {database_workstream.tags}")
    print(f"  Description: {database_workstream.description}")
    
    database_criteria = AgentMatchingCriteria(
        required_capabilities=["PostgreSQL", "Database Design"],
        preferred_agent_types=[AgentType.DATABASE_ENGINEER]
    )
    print(f"  Manual criteria: {database_criteria.required_capabilities}")
    
    database_assignment = manager.assign_agent_to_workstream(database_workstream, pool.pool_id, database_criteria)
    
    # Verify assignments
    assert frontend_assignment is not None, "Frontend assignment failed"
    assert backend_assignment is not None, "Backend assignment failed"
    assert database_assignment is not None, "Database assignment failed"
    
    # Verify correct agents were assigned
    assert frontend_assignment.agent_id == ui_agent.id, "Frontend workstream should be assigned to UI agent"
    assert backend_assignment.agent_id == api_agent.id, "Backend workstream should be assigned to API agent"
    assert database_assignment.agent_id == db_agent.id, "Database workstream should be assigned to DB agent"
    
    print("✅ Agent matching test passed!")


def test_agent_performance_tracking():
    """Test agent performance tracking and metrics"""
    print("🧪 Testing Agent Performance Tracking...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create a test agent
    agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Test Agent",
        agent_type=AgentType.FULL_STACK_DEVELOPER,
        description="Test agent for performance tracking",
        capabilities=[
            AgentCapability(skill_name="React", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.85),
            AgentCapability(skill_name="Python", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.80)
        ]
    )
    
    # Create and assign a workstream
    workstream = Workstream(
        id=f"test_{uuid.uuid4().hex[:8]}",
        name="Test Task",
        description="Test workstream for performance tracking with React and Python",
        original_task_id=f"task_{uuid.uuid4().hex[:8]}",
        status=WorkstreamStatus.PENDING,
        priority=1,
        tags=["test", "react", "python"]
    )
    
    assignment = manager.assign_agent_to_workstream(workstream, pool.pool_id)
    assert assignment is not None, "Assignment failed"
    
    # Complete the assignment with good performance
    success = manager.complete_assignment(
        assignment.assignment_id,
        quality_score=0.9,
        feedback_score=0.85
    )
    assert success, "Assignment completion failed"
    
    # Check performance metrics
    metrics = manager.get_agent_metrics(pool.pool_id)
    assert metrics.total_agents == 1, "Agent count incorrect"
    assert metrics.total_tasks_completed == 1, "Completed task count incorrect"
    assert metrics.total_tasks_failed == 0, "Failed task count should be 0"
    assert metrics.average_success_rate > 0.8, "Success rate should be high"
    
    print("✅ Agent performance tracking test passed!")


def test_agent_health_monitoring():
    """Test agent health monitoring and failover"""
    print("🧪 Testing Agent Health Monitoring...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create agents with basic capabilities
    primary_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Primary Agent",
        agent_type=AgentType.FULL_STACK_DEVELOPER,
        description="Primary agent for failover testing",
        capabilities=[
            AgentCapability(skill_name="General Development", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.80)
        ]
    )
    
    backup_agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Backup Agent",
        agent_type=AgentType.FULL_STACK_DEVELOPER,
        description="Backup agent for failover testing",
        capabilities=[
            AgentCapability(skill_name="General Development", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.75)
        ]
    )
    
    # Configure failover
    failover_config = manager.configure_failover(
        primary_agent_id=primary_agent.id,
        backup_agent_ids=[backup_agent.id],
        auto_failover=True,
        failover_threshold=2
    )
    
    assert failover_config.primary_agent_id == primary_agent.id, "Failover config not set correctly"
    assert backup_agent.id in failover_config.backup_agent_ids, "Backup agent not in failover config"
    
    # Create and assign workstream
    workstream = Workstream(
        id=f"failover_{uuid.uuid4().hex[:8]}",
        name="Failover Test Task",
        description="Test task for failover functionality",
        original_task_id=f"task_{uuid.uuid4().hex[:8]}",
        status=WorkstreamStatus.PENDING,
        priority=1,
        tags=["test", "failover"]
    )
    
    assignment = manager.assign_agent_to_workstream(workstream, pool.pool_id)
    assert assignment is not None, "Assignment failed"
    
    # Simulate failures to trigger failover
    manager.fail_assignment(assignment.assignment_id, "Simulated failure 1")
    
    # Create another assignment and fail it
    workstream2 = Workstream(
        id=f"failover2_{uuid.uuid4().hex[:8]}",
        name="Failover Test Task 2",
        description="Second test task for failover",
        original_task_id=f"task_{uuid.uuid4().hex[:8]}",
        status=WorkstreamStatus.PENDING,
        priority=1,
        tags=["test", "failover"]
    )
    
    assignment2 = manager.assign_agent_to_workstream(workstream2, pool.pool_id)
    if assignment2:  # Agent might still be available
        manager.fail_assignment(assignment2.assignment_id, "Simulated failure 2")
    
    # Check health report
    health_report = manager.get_agent_health_report(pool.pool_id)
    assert health_report['total_agents'] == 2, "Agent count in health report incorrect"
    
    print("✅ Agent health monitoring test passed!")


def test_agent_training():
    """Test agent training and capability improvement"""
    print("🧪 Testing Agent Training...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create an agent with basic capabilities
    agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Learning Agent",
        agent_type=AgentType.FRONTEND_SPECIALIST,
        description="Agent for training testing",
        capabilities=[
            AgentCapability(skill_name="HTML", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.75),
            AgentCapability(skill_name="CSS", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.70)
        ]
    )
    
    initial_capabilities = len(agent.capabilities)
    
    # Train the agent
    training_event = manager.train_agent(
        agent_id=agent.id,
        training_type="skill_improvement",
        training_data={
            "skill": "React",
            "training_materials": ["React documentation", "Advanced patterns"],
            "practice_projects": 5,
            "mentor_feedback": "Good progress on React fundamentals"
        }
    )
    
    assert training_event.agent_id == agent.id, "Training event agent ID incorrect"
    assert training_event.training_type == "skill_improvement", "Training type incorrect"
    assert training_event.improvement_score > 0, "Improvement score should be positive"
    
    # Check if agent gained new capabilities
    updated_agent = manager._get_agent_by_id(agent.id)
    assert updated_agent is not None, "Updated agent not found"
    
    print("✅ Agent training test passed!")


def test_load_balancing():
    """Test load balancing across agents"""
    print("🧪 Testing Load Balancing...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create multiple agents
    agents = []
    for i in range(3):
        agent = manager.add_agent(
            pool_id=pool.pool_id,
            name=f"Agent {i+1}",
            agent_type=AgentType.FULL_STACK_DEVELOPER,
            description=f"Test agent {i+1} for load balancing",
            capabilities=[
                AgentCapability(skill_name="JavaScript", skill_level=SkillLevel.INTERMEDIATE, success_rate=0.80)
            ]
        )
        agents.append(agent)
    
    # Create multiple workstreams
    workstreams = []
    for i in range(5):
        workstream = Workstream(
            id=f"loadtest_{i}_{uuid.uuid4().hex[:8]}",
            name=f"Load Test Task {i+1}",
            description=f"Test task {i+1} for load balancing",
            original_task_id=f"task_{uuid.uuid4().hex[:8]}",
            status=WorkstreamStatus.PENDING,
            priority=1,
            tags=["test", "load-balancing"]
        )
        workstreams.append(workstream)
    
    # Assign workstreams
    assignments = []
    for workstream in workstreams:
        assignment = manager.assign_agent_to_workstream(workstream, pool.pool_id)
        if assignment:
            assignments.append(assignment)
    
    # Check workload distribution
    workload_distribution = manager.load_balancer.get_workload_distribution()
    
    # Verify that work is distributed across agents
    agent_workloads = [workload_distribution[agent.id]['current_workload'] for agent in agents]
    max_workload = max(agent_workloads)
    min_workload = min(agent_workloads)
    
    # Workload should be reasonably balanced (not all work on one agent)
    assert max_workload - min_workload <= 2, f"Workload not balanced: max={max_workload}, min={min_workload}"
    
    print("✅ Load balancing test passed!")


def test_agent_removal():
    """Test agent removal and cleanup"""
    print("🧪 Testing Agent Removal...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create an agent
    agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Removable Agent",
        agent_type=AgentType.FULL_STACK_DEVELOPER,
        description="Agent to be removed"
    )
    
    initial_count = len(pool.agents)
    
    # Remove the agent
    success = manager.remove_agent(pool.pool_id, agent.id)
    assert success, "Agent removal failed"
    
    # Verify removal
    final_count = len(pool.agents)
    assert final_count == initial_count - 1, f"Agent count should be {initial_count - 1}, got {final_count}"
    
    # Try to remove non-existent agent
    success = manager.remove_agent(pool.pool_id, "non-existent-id")
    assert not success, "Should not be able to remove non-existent agent"
    
    print("✅ Agent removal test passed!")


def test_metrics_and_reporting():
    """Test comprehensive metrics and reporting"""
    print("🧪 Testing Metrics and Reporting...")
    
    manager = AgentManager()
    pool = manager.initialize_pool("Development Team")
    
    # Create agents and perform some work
    agent = manager.add_agent(
        pool_id=pool.pool_id,
        name="Metrics Agent",
        agent_type=AgentType.FULL_STACK_DEVELOPER,
        description="Agent for metrics testing"
    )
    
    # Create and complete some assignments
    for i in range(3):
        workstream = Workstream(
            id=f"metrics_{i}_{uuid.uuid4().hex[:8]}",
            name=f"Metrics Test {i+1}",
            description=f"Test task {i+1} for metrics",
            original_task_id=f"task_{uuid.uuid4().hex[:8]}",
            status=WorkstreamStatus.PENDING,
            priority=1,
            tags=["test", "metrics"]
        )
        
        assignment = manager.assign_agent_to_workstream(workstream, pool.pool_id)
        if assignment:
            # Complete with varying performance
            quality_score = 0.7 + (i * 0.1)  # 0.7, 0.8, 0.9
            manager.complete_assignment(assignment.assignment_id, quality_score=quality_score)
    
    # Get metrics
    metrics = manager.get_agent_metrics(pool.pool_id)
    health_report = manager.get_agent_health_report(pool.pool_id)
    
    # Verify metrics
    assert metrics.total_agents == 1, "Total agents count incorrect"
    assert metrics.total_tasks_completed >= 3, "Completed tasks count incorrect"
    assert metrics.average_success_rate > 0, "Success rate should be positive"
    
    # Verify health report
    assert health_report['total_agents'] == 1, "Health report agent count incorrect"
    assert 'healthy_agents' in health_report, "Health report missing healthy_agents"
    assert 'agents_by_status' in health_report, "Health report missing agents_by_status"
    
    print("✅ Metrics and reporting test passed!")


def run_all_tests():
    """Run all agent specialization tests"""
    print("🚀 Starting Agent Specialization and Assignment System Tests...\n")
    
    try:
        test_agent_pool_initialization()
        test_agent_creation()
        test_agent_matching()
        test_agent_performance_tracking()
        test_agent_health_monitoring()
        test_agent_training()
        test_load_balancing()
        test_agent_removal()
        test_metrics_and_reporting()
        
        print("\n🎉 All agent specialization tests passed! The system is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    run_all_tests()
