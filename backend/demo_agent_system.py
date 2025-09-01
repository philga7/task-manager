#!/usr/bin/env python3
"""
Demo script for the Agent Specialization and Assignment System

This script demonstrates how to:
1. Create agent pools with specialized agents
2. Match agents to workstreams based on capabilities
3. Monitor performance and health
4. Handle failures and failover
5. Train agents to improve capabilities
"""

import asyncio
import logging
from datetime import datetime
from typing import List

from app.models.Agents import (
    Agent, AgentType, AgentStatus, SkillLevel, AgentCapability,
    AgentMatchingCriteria, AgentPool
)
from app.models.Workstream import Workstream, WorkstreamStatus
from app.services.AgentManager import AgentManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_demo_agents() -> List[Agent]:
    """Create demo agents with different specializations"""
    
    # UI Developer Agent
    ui_agent = Agent(
        name="React Specialist",
        agent_type=AgentType.UI_DEVELOPER,
        description="Expert in React, TypeScript, and modern frontend development",
        capabilities=[
            AgentCapability(skill_name="React", skill_level=SkillLevel.EXPERT, confidence_score=0.95, success_rate=0.92),
            AgentCapability(skill_name="TypeScript", skill_level=SkillLevel.EXPERT, confidence_score=0.93, success_rate=0.89),
            AgentCapability(skill_name="CSS", skill_level=SkillLevel.ADVANCED, confidence_score=0.88, success_rate=0.85),
            AgentCapability(skill_name="HTML", skill_level=SkillLevel.ADVANCED, confidence_score=0.90, success_rate=0.87)
        ],
        specializations=["React", "TypeScript", "Frontend Development", "UI/UX"],
        max_concurrent_tasks=3
    )
    
    # API Developer Agent
    api_agent = Agent(
        name="API Architect",
        agent_type=AgentType.API_DEVELOPER,
        description="Specialist in API design, FastAPI, and backend development",
        capabilities=[
            AgentCapability(skill_name="FastAPI", skill_level=SkillLevel.EXPERT, confidence_score=0.94, success_rate=0.91),
            AgentCapability(skill_name="Python", skill_level=SkillLevel.EXPERT, confidence_score=0.96, success_rate=0.93),
            AgentCapability(skill_name="API Design", skill_level=SkillLevel.EXPERT, confidence_score=0.92, success_rate=0.88),
            AgentCapability(skill_name="REST", skill_level=SkillLevel.ADVANCED, confidence_score=0.89, success_rate=0.86)
        ],
        specializations=["FastAPI", "Python", "API Design", "Backend Development"],
        max_concurrent_tasks=4
    )
    
    # Database Engineer Agent
    db_agent = Agent(
        name="Database Expert",
        agent_type=AgentType.DATABASE_ENGINEER,
        description="Expert in database design, optimization, and management",
        capabilities=[
            AgentCapability(skill_name="PostgreSQL", skill_level=SkillLevel.EXPERT, confidence_score=0.93, success_rate=0.90),
            AgentCapability(skill_name="SQL", skill_level=SkillLevel.EXPERT, confidence_score=0.95, success_rate=0.92),
            AgentCapability(skill_name="Database Design", skill_level=SkillLevel.EXPERT, confidence_score=0.91, success_rate=0.87),
            AgentCapability(skill_name="MongoDB", skill_level=SkillLevel.ADVANCED, confidence_score=0.87, success_rate=0.84)
        ],
        specializations=["PostgreSQL", "SQL", "Database Design", "Data Modeling"],
        max_concurrent_tasks=2
    )
    
    # Testing Engineer Agent
    test_agent = Agent(
        name="QA Specialist",
        agent_type=AgentType.TESTING_ENGINEER,
        description="Expert in testing strategies, automation, and quality assurance",
        capabilities=[
            AgentCapability(skill_name="Unit Testing", skill_level=SkillLevel.EXPERT, confidence_score=0.92, success_rate=0.89),
            AgentCapability(skill_name="Integration Testing", skill_level=SkillLevel.EXPERT, confidence_score=0.90, success_rate=0.87),
            AgentCapability(skill_name="Test Automation", skill_level=SkillLevel.ADVANCED, confidence_score=0.88, success_rate=0.85),
            AgentCapability(skill_name="Playwright", skill_level=SkillLevel.INTERMEDIATE, confidence_score=0.75, success_rate=0.72)
        ],
        specializations=["Testing", "Quality Assurance", "Test Automation", "Playwright"],
        max_concurrent_tasks=3
    )
    
    # Full Stack Developer Agent
    fullstack_agent = Agent(
        name="Full Stack Developer",
        agent_type=AgentType.FULL_STACK_DEVELOPER,
        description="Versatile developer capable of handling both frontend and backend tasks",
        capabilities=[
            AgentCapability(skill_name="React", skill_level=SkillLevel.ADVANCED, confidence_score=0.85, success_rate=0.82),
            AgentCapability(skill_name="Python", skill_level=SkillLevel.ADVANCED, confidence_score=0.87, success_rate=0.84),
            AgentCapability(skill_name="FastAPI", skill_level=SkillLevel.INTERMEDIATE, confidence_score=0.78, success_rate=0.75),
            AgentCapability(skill_name="SQL", skill_level=SkillLevel.INTERMEDIATE, confidence_score=0.80, success_rate=0.77)
        ],
        specializations=["Full Stack Development", "React", "Python", "Web Development"],
        max_concurrent_tasks=2
    )
    
    return [ui_agent, api_agent, db_agent, test_agent, fullstack_agent]


def create_demo_workstreams() -> List[Workstream]:
    """Create demo workstreams with different requirements"""
    
    workstreams = [
        # Frontend workstream
        Workstream(
            id="ws-001",
            name="Create React Component Library",
            description="Build a comprehensive React component library with TypeScript support",
            original_task_id="task-001",
            priority=1,
            tags=["frontend", "react", "typescript", "ui"],
            estimated_duration=120,  # 2 hours
            complexity_score=0.7
        ),
        
        # Backend workstream
        Workstream(
            id="ws-002",
            name="Design REST API Endpoints",
            description="Design and implement REST API endpoints for user management",
            original_task_id="task-002",
            priority=2,
            tags=["backend", "api", "rest", "python"],
            estimated_duration=90,  # 1.5 hours
            complexity_score=0.6
        ),
        
        # Database workstream
        Workstream(
            id="ws-003",
            name="Optimize Database Schema",
            description="Optimize database schema for better performance and scalability",
            original_task_id="task-003",
            priority=3,
            tags=["database", "postgresql", "optimization"],
            estimated_duration=180,  # 3 hours
            complexity_score=0.8
        ),
        
        # Testing workstream
        Workstream(
            id="ws-004",
            name="Implement Test Suite",
            description="Create comprehensive test suite with unit and integration tests",
            original_task_id="task-004",
            priority=2,
            tags=["testing", "unit-tests", "integration-tests"],
            estimated_duration=150,  # 2.5 hours
            complexity_score=0.5
        ),
        
        # Full stack workstream
        Workstream(
            id="ws-005",
            name="Build User Dashboard",
            description="Create a complete user dashboard with frontend and backend integration",
            original_task_id="task-005",
            priority=1,
            tags=["fullstack", "dashboard", "react", "api"],
            estimated_duration=240,  # 4 hours
            complexity_score=0.9
        )
    ]
    
    return workstreams


async def demo_agent_assignment():
    """Demonstrate agent assignment and matching"""
    logger.info("🚀 Starting Agent Specialization and Assignment Demo")
    
    # Initialize agent manager
    agent_manager = AgentManager()
    
    # Create agent pool
    pool = agent_manager.initialize_pool("Development Team", "Main development team for the project")
    
    # Add demo agents to pool
    demo_agents = create_demo_agents()
    for agent in demo_agents:
        agent_manager.add_agent(
            pool_id=pool.pool_id,
            name=agent.name,
            agent_type=agent.agent_type,
            description=agent.description,
            capabilities=agent.capabilities,
            specializations=agent.specializations
        )
    
    logger.info(f"✅ Created agent pool with {len(demo_agents)} agents")
    
    # Create demo workstreams
    workstreams = create_demo_workstreams()
    logger.info(f"✅ Created {len(workstreams)} workstreams")
    
    # Demonstrate agent matching for each workstream
    logger.info("\n🎯 Demonstrating Agent Matching:")
    logger.info("=" * 50)
    
    for workstream in workstreams:
        logger.info(f"\n📋 Workstream: {workstream.name}")
        logger.info(f"   Description: {workstream.description}")
        logger.info(f"   Tags: {', '.join(workstream.tags)}")
        logger.info(f"   Priority: {workstream.priority}")
        
        # Find best agent
        assignment = agent_manager.assign_agent_to_workstream(workstream, pool.pool_id)
        
        if assignment:
            agent = agent_manager._get_agent_by_id(assignment.agent_id)
            logger.info(f"   ✅ Assigned to: {agent.name} ({agent.agent_type.value})")
            logger.info(f"   📊 Confidence Score: {assignment.confidence_score:.2f}")
            logger.info(f"   🎯 Assignment Reason: {assignment.assignment_reason}")
        else:
            logger.warning(f"   ❌ No suitable agent found")
    
    # Demonstrate metrics and health monitoring
    logger.info("\n📊 Agent Metrics and Health:")
    logger.info("=" * 50)
    
    metrics = agent_manager.get_agent_metrics(pool.pool_id)
    logger.info(f"Total Agents: {metrics.total_agents}")
    logger.info(f"Available: {metrics.available_agents}")
    logger.info(f"Busy: {metrics.busy_agents}")
    logger.info(f"Offline: {metrics.offline_agents}")
    logger.info(f"Average Success Rate: {metrics.average_success_rate:.2f}")
    logger.info(f"Total Tasks Completed: {metrics.total_tasks_completed}")
    
    # Get health report
    health_report = agent_manager.get_agent_health_report(pool.pool_id)
    logger.info(f"\nHealthy Agents: {health_report['healthy_agents']}")
    logger.info(f"Unhealthy Agents: {health_report['unhealthy_agents']}")
    
    if health_report['agents_needing_attention']:
        logger.warning(f"Agents needing attention: {len(health_report['agents_needing_attention'])}")
        for agent_info in health_report['agents_needing_attention']:
            logger.warning(f"  - {agent_info['name']}: {', '.join(agent_info['issues'])}")
    
    # Demonstrate workload distribution
    logger.info("\n⚖️ Workload Distribution:")
    logger.info("=" * 50)
    
    for agent in demo_agents:
        current_agent = agent_manager._get_agent_by_id(agent.id)
        if current_agent:
            utilization = current_agent.current_workload / current_agent.max_concurrent_tasks
            logger.info(f"{current_agent.name}: {current_agent.current_workload}/{current_agent.max_concurrent_tasks} tasks ({utilization:.1%} utilization)")
    
    # Demonstrate agent training
    logger.info("\n🎓 Agent Training Demo:")
    logger.info("=" * 50)
    
    # Train the React specialist to improve Playwright skills
    react_agent = next(agent for agent in demo_agents if "React" in agent.name)
    # Get the actual agent from the manager (which has the correct ID)
    actual_react_agent = agent_manager._get_agent_by_name(react_agent.name)
    if actual_react_agent:
        training_event = agent_manager.train_agent(
            agent_id=actual_react_agent.id,
            training_type="capability_expansion",
            training_data={
                "new_skill": "Playwright",
                "training_materials": ["Playwright docs", "E2E testing best practices"],
                "target_skill_level": "intermediate"
            }
        )
        
        logger.info(f"Trained {actual_react_agent.name} in Playwright")
        logger.info(f"Improvement Score: {training_event.improvement_score:.2f}")
        logger.info(f"Training Duration: {training_event.duration_minutes:.1f} minutes")
        
        if training_event.new_capabilities:
            logger.info(f"New Capabilities: {[cap.skill_name for cap in training_event.new_capabilities]}")
    else:
        logger.warning("Could not find React agent for training")
    
    # Demonstrate failover configuration
    logger.info("\n🔄 Failover Configuration Demo:")
    logger.info("=" * 50)
    
    # Configure failover for the API agent
    api_agent = next(agent for agent in demo_agents if "API" in agent.name)
    fullstack_agent = next(agent for agent in demo_agents if "Full Stack" in agent.name)
    
    failover_config = agent_manager.configure_failover(
        primary_agent_id=api_agent.id,
        backup_agent_ids=[fullstack_agent.id],
        failover_threshold=3,
        auto_failover=True
    )
    
    logger.info(f"Configured failover for {api_agent.name}")
    logger.info(f"Backup Agent: {fullstack_agent.name}")
    logger.info(f"Failover Threshold: {failover_config.failover_threshold}")
    
    # Demonstrate assignment completion and performance tracking
    logger.info("\n✅ Assignment Completion Demo:")
    logger.info("=" * 50)
    
    # Simulate completing some assignments
    assignments = list(agent_manager.assignments.values())
    if assignments:
        # Complete first assignment with good quality
        assignment = assignments[0]
        success = agent_manager.complete_assignment(
            assignment_id=assignment.assignment_id,
            quality_score=0.9,
            feedback_score=0.85
        )
        
        if success:
            agent = agent_manager._get_agent_by_id(assignment.agent_id)
            logger.info(f"Completed assignment for {agent.name}")
            logger.info(f"Quality Score: 0.9")
            logger.info(f"Feedback Score: 0.85")
            logger.info(f"Updated Success Rate: {agent.performance.success_rate:.2f}")
    
    # Final metrics
    logger.info("\n📈 Final Metrics:")
    logger.info("=" * 50)
    
    final_metrics = agent_manager.get_agent_metrics(pool.pool_id)
    logger.info(f"Total Tasks Completed: {final_metrics.total_tasks_completed}")
    logger.info(f"Total Tasks Failed: {final_metrics.total_tasks_failed}")
    logger.info(f"Overall Success Rate: {final_metrics.average_success_rate:.2f}")
    
    logger.info("\n🎉 Demo completed successfully!")
    logger.info("The agent specialization and assignment system is working correctly!")


def demo_custom_matching_criteria():
    """Demonstrate custom matching criteria"""
    logger.info("\n🎯 Custom Matching Criteria Demo:")
    logger.info("=" * 50)
    
    # Create a workstream that requires specific criteria
    workstream = Workstream(
        id="ws-custom",
        name="High-Priority API Development",
        description="Critical API development requiring expert-level skills",
        original_task_id="task-critical",
        priority=1,
        tags=["api", "critical", "expert"],
        estimated_duration=120,
        complexity_score=0.9
    )
    
    # Create custom matching criteria
    criteria = AgentMatchingCriteria(
        required_capabilities=["FastAPI", "API Design"],
        minimum_skill_level=SkillLevel.EXPERT,
        minimum_success_rate=0.9,
        minimum_uptime=0.95,
        maximum_current_workload=2,
        preferred_agent_types=[AgentType.API_DEVELOPER],
        is_urgent=True,
        priority_boost=0.2
    )
    
    logger.info(f"Workstream: {workstream.name}")
    logger.info(f"Required Capabilities: {criteria.required_capabilities}")
    logger.info(f"Minimum Skill Level: {criteria.minimum_skill_level.value}")
    logger.info(f"Minimum Success Rate: {criteria.minimum_success_rate}")
    logger.info(f"Urgent: {criteria.is_urgent}")
    
    # This would be used with the agent manager
    logger.info("Custom criteria would filter agents more strictly for critical work")


if __name__ == "__main__":
    # Run the main demo
    asyncio.run(demo_agent_assignment())
    
    # Run custom criteria demo
    demo_custom_matching_criteria()
