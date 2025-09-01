"""
Agent management service for specialization and assignment system
"""
from typing import List, Dict, Optional, Tuple, Set, Any
from datetime import datetime, timedelta
import logging
import asyncio
from dataclasses import dataclass

from ..models.Agents import (
    Agent, AgentType, AgentStatus, SkillLevel, AgentCapability,
    AgentPerformance, AgentHealth, AgentMatchingCriteria, AgentMatchingResult,
    AgentAssignment, AgentPool, AgentTrainingEvent, AgentFailoverConfig
)
from ..models.Workstream import Workstream, WorkstreamStatus
from ..utils.agent_matcher import AgentMatcher, LoadBalancer, PerformanceOptimizer

logger = logging.getLogger(__name__)


@dataclass
class AgentMetrics:
    """Aggregated metrics for agent management"""
    total_agents: int
    available_agents: int
    busy_agents: int
    offline_agents: int
    average_success_rate: float
    average_response_time: float
    total_tasks_completed: int
    total_tasks_failed: int


class AgentManager:
    """Main agent management service"""
    
    def __init__(self):
        self.agent_pools: Dict[str, AgentPool] = {}
        self.assignments: Dict[str, AgentAssignment] = {}
        self.failover_configs: Dict[str, AgentFailoverConfig] = {}
        self.training_events: List[AgentTrainingEvent] = []
        
        # Initialize components
        self.matcher = None
        self.load_balancer = None
        self.optimizer = None
        
        # Monitoring
        self.health_check_interval = 30  # seconds
        self.performance_update_interval = 60  # seconds
        self.is_monitoring = False
        
    def initialize_pool(self, pool_name: str, pool_description: str = "") -> AgentPool:
        """Initialize a new agent pool"""
        pool = AgentPool(
            pool_id=str(len(self.agent_pools) + 1),
            name=pool_name,
            description=pool_description
        )
        self.agent_pools[pool.pool_id] = pool
        
        # Initialize components for this pool
        if not self.matcher:
            self.matcher = AgentMatcher(pool)
            self.load_balancer = LoadBalancer(pool)
            self.optimizer = PerformanceOptimizer(pool)
        
        logger.info(f"Initialized agent pool: {pool_name}")
        return pool
    
    def add_agent(
        self, 
        pool_id: str, 
        name: str, 
        agent_type: AgentType, 
        description: str,
        capabilities: List[AgentCapability] = None,
        specializations: List[str] = None
    ) -> Agent:
        """Add a new agent to a pool"""
        if pool_id not in self.agent_pools:
            raise ValueError(f"Pool {pool_id} not found")
        
        pool = self.agent_pools[pool_id]
        
        agent = Agent(
            name=name,
            agent_type=agent_type,
            description=description,
            capabilities=capabilities or [],
            specializations=specializations or []
        )
        
        # Initialize health and performance
        agent.health = AgentHealth(agent_id=agent.id)
        agent.performance = AgentPerformance(agent_id=agent.id)
        
        pool.agents.append(agent)
        
        logger.info(f"Added agent {name} ({agent_type}) to pool {pool_id}")
        return agent
    
    def remove_agent(self, pool_id: str, agent_id: str) -> bool:
        """Remove an agent from a pool"""
        if pool_id not in self.agent_pools:
            return False
        
        pool = self.agent_pools[pool_id]
        agent = next((a for a in pool.agents if a.id == agent_id), None)
        
        if not agent:
            return False
        
        # Check if agent has active assignments
        active_assignments = [
            assignment for assignment in self.assignments.values()
            if assignment.agent_id == agent_id and not assignment.completed_at
        ]
        
        if active_assignments:
            logger.warning(f"Cannot remove agent {agent_id} - has active assignments")
            return False
        
        pool.agents.remove(agent)
        logger.info(f"Removed agent {agent.name} from pool {pool_id}")
        return True
    
    def assign_agent_to_workstream(
        self, 
        workstream: Workstream, 
        pool_id: str,
        criteria: Optional[AgentMatchingCriteria] = None
    ) -> Optional[AgentAssignment]:
        """Assign the best agent to a workstream"""
        if pool_id not in self.agent_pools:
            logger.error(f"Pool {pool_id} not found")
            return None
        
        pool = self.agent_pools[pool_id]
        
        # Update matcher with current pool
        self.matcher.agent_pool = pool
        
        # Find best agent
        matching_result = self.matcher.match_agent_to_workstream(workstream, criteria)
        
        if not matching_result.best_match:
            logger.warning(f"No suitable agent found for workstream {workstream.id}")
            return None
        
        # Create assignment
        assignment = AgentAssignment(
            agent_id=matching_result.best_match.id,
            workstream_id=workstream.id,
            assignment_reason=f"Best match with confidence score {matching_result.confidence_score:.2f}",
            confidence_score=matching_result.confidence_score
        )
        
        # Update agent status
        best_agent = matching_result.best_match
        best_agent.current_workload += 1
        best_agent.status = AgentStatus.BUSY if best_agent.current_workload >= best_agent.max_concurrent_tasks else AgentStatus.AVAILABLE
        
        # Store assignment
        self.assignments[assignment.assignment_id] = assignment
        pool.agent_assignments[assignment.assignment_id] = assignment
        
        logger.info(f"Assigned agent {best_agent.name} to workstream {workstream.id}")
        return assignment
    
    def complete_assignment(self, assignment_id: str, quality_score: float = None, feedback_score: float = None) -> bool:
        """Mark an assignment as completed"""
        if assignment_id not in self.assignments:
            return False
        
        assignment = self.assignments[assignment_id]
        assignment.completed_at = datetime.now()
        
        # Calculate actual completion time
        if assignment.started_at:
            completion_time = (assignment.completed_at - assignment.started_at).total_seconds() / 60
            assignment.actual_completion_time = completion_time
        
        # Update scores
        if quality_score is not None:
            assignment.quality_score = quality_score
        if feedback_score is not None:
            assignment.feedback_score = feedback_score
        
        # Update agent performance
        agent = self._get_agent_by_id(assignment.agent_id)
        if agent:
            self._update_agent_performance(agent, assignment)
            agent.current_workload = max(0, agent.current_workload - 1)
            agent.status = AgentStatus.AVAILABLE if agent.current_workload < agent.max_concurrent_tasks else AgentStatus.BUSY
        
        logger.info(f"Completed assignment {assignment_id}")
        return True
    
    def fail_assignment(self, assignment_id: str, error_message: str) -> bool:
        """Mark an assignment as failed"""
        if assignment_id not in self.assignments:
            return False
        
        assignment = self.assignments[assignment_id]
        assignment.completed_at = datetime.now()
        
        # Update agent performance
        agent = self._get_agent_by_id(assignment.agent_id)
        if agent:
            agent.performance.total_tasks_failed += 1
            agent.health.consecutive_failures += 1
            agent.health.error_count += 1
            
            # Check for failover
            if agent.health.consecutive_failures >= agent.health.max_consecutive_failures:
                self._trigger_failover(agent)
            
            agent.current_workload = max(0, agent.current_workload - 1)
            agent.status = AgentStatus.AVAILABLE if agent.current_workload < agent.max_concurrent_tasks else AgentStatus.BUSY
        
        logger.error(f"Failed assignment {assignment_id}: {error_message}")
        return True
    
    def get_agent_metrics(self, pool_id: str = None) -> AgentMetrics:
        """Get aggregated metrics for agents"""
        all_agents = []
        
        if pool_id:
            if pool_id in self.agent_pools:
                all_agents = self.agent_pools[pool_id].agents
        else:
            for pool in self.agent_pools.values():
                all_agents.extend(pool.agents)
        
        if not all_agents:
            return AgentMetrics(0, 0, 0, 0, 0.0, 0.0, 0, 0)
        
        available_agents = len([a for a in all_agents if a.status == AgentStatus.AVAILABLE])
        busy_agents = len([a for a in all_agents if a.status == AgentStatus.BUSY])
        offline_agents = len([a for a in all_agents if a.status in [AgentStatus.OFFLINE, AgentStatus.FAILED]])
        
        success_rates = [a.performance.success_rate for a in all_agents if a.performance.total_tasks_completed > 0]
        average_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0.0
        
        response_times = [a.health.response_time for a in all_agents if a.health.response_time]
        average_response_time = sum(response_times) / len(response_times) if response_times else 0.0
        
        total_completed = sum(a.performance.total_tasks_completed for a in all_agents)
        total_failed = sum(a.performance.total_tasks_failed for a in all_agents)
        
        return AgentMetrics(
            total_agents=len(all_agents),
            available_agents=available_agents,
            busy_agents=busy_agents,
            offline_agents=offline_agents,
            average_success_rate=average_success_rate,
            average_response_time=average_response_time,
            total_tasks_completed=total_completed,
            total_tasks_failed=total_failed
        )
    
    def get_agent_health_report(self, pool_id: str = None) -> Dict[str, Any]:
        """Get detailed health report for agents"""
        all_agents = []
        
        if pool_id:
            if pool_id in self.agent_pools:
                all_agents = self.agent_pools[pool_id].agents
        else:
            for pool in self.agent_pools.values():
                all_agents.extend(pool.agents)
        
        health_report = {
            'total_agents': len(all_agents),
            'healthy_agents': len([a for a in all_agents if a.health.is_healthy]),
            'unhealthy_agents': len([a for a in all_agents if not a.health.is_healthy]),
            'agents_by_status': {},
            'agents_needing_attention': [],
            'resource_usage': {
                'high_cpu': len([a for a in all_agents if a.health.cpu_usage and a.health.cpu_usage > 80]),
                'high_memory': len([a for a in all_agents if a.health.memory_usage and a.health.memory_usage > 80]),
                'high_disk': len([a for a in all_agents if a.health.disk_usage and a.health.disk_usage > 80])
            }
        }
        
        # Group by status
        for agent in all_agents:
            status = agent.status.value
            if status not in health_report['agents_by_status']:
                health_report['agents_by_status'][status] = []
            health_report['agents_by_status'][status].append({
                'id': agent.id,
                'name': agent.name,
                'agent_type': agent.agent_type.value,
                'health_score': agent.health.health_score,
                'consecutive_failures': agent.health.consecutive_failures
            })
        
        # Identify agents needing attention
        for agent in all_agents:
            if (agent.health.consecutive_failures >= 2 or 
                agent.health.health_score < 0.5 or
                (agent.health.cpu_usage and agent.health.cpu_usage > 90) or
                (agent.health.memory_usage and agent.health.memory_usage > 90)):
                health_report['agents_needing_attention'].append({
                    'id': agent.id,
                    'name': agent.name,
                    'issues': self._identify_agent_issues(agent)
                })
        
        return health_report
    
    def start_monitoring(self):
        """Start background monitoring of agents"""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        asyncio.create_task(self._monitor_agents())
        logger.info("Started agent monitoring")
    
    def stop_monitoring(self):
        """Stop background monitoring of agents"""
        self.is_monitoring = False
        logger.info("Stopped agent monitoring")
    
    def train_agent(self, agent_id: str, training_type: str, training_data: Dict[str, Any]) -> AgentTrainingEvent:
        """Train an agent to improve capabilities"""
        agent = self._get_agent_by_id(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        training_event = AgentTrainingEvent(
            agent_id=agent_id,
            training_type=training_type,
            training_data=training_data
        )
        
        # Simulate training process
        improvement_score = self._simulate_training_improvement(agent, training_type, training_data)
        training_event.improvement_score = improvement_score
        
        # Update agent capabilities
        if improvement_score > 0.1:  # Significant improvement
            new_capabilities = self._generate_new_capabilities(agent, training_type, training_data)
            training_event.new_capabilities = new_capabilities
            agent.capabilities.extend(new_capabilities)
        
        training_event.training_completed = datetime.now()
        training_event.duration_minutes = (training_event.training_completed - training_event.training_started).total_seconds() / 60
        
        self.training_events.append(training_event)
        
        logger.info(f"Trained agent {agent.name} - improvement score: {improvement_score}")
        return training_event
    
    def configure_failover(self, primary_agent_id: str, backup_agent_ids: List[str], **kwargs) -> AgentFailoverConfig:
        """Configure failover for an agent"""
        config = AgentFailoverConfig(
            primary_agent_id=primary_agent_id,
            backup_agent_ids=backup_agent_ids,
            **kwargs
        )
        
        self.failover_configs[primary_agent_id] = config
        logger.info(f"Configured failover for agent {primary_agent_id}")
        return config
    
    def _get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID from any pool"""
        for pool in self.agent_pools.values():
            agent = next((a for a in pool.agents if a.id == agent_id), None)
            if agent:
                return agent
        return None
    
    def _get_agent_by_name(self, agent_name: str) -> Optional[Agent]:
        """Get agent by name from any pool"""
        for pool in self.agent_pools.values():
            agent = next((a for a in pool.agents if a.name == agent_name), None)
            if agent:
                return agent
        return None
    
    def _update_agent_performance(self, agent: Agent, assignment: AgentAssignment):
        """Update agent performance metrics after assignment completion"""
        perf = agent.performance
        
        # Update completion counts
        perf.total_tasks_completed += 1
        
        # Update success rate
        total_tasks = perf.total_tasks_completed + perf.total_tasks_failed
        perf.success_rate = perf.total_tasks_completed / total_tasks if total_tasks > 0 else 0.0
        
        # Update average completion time
        if assignment.actual_completion_time:
            if perf.average_completion_time:
                perf.average_completion_time = (perf.average_completion_time + assignment.actual_completion_time) / 2
            else:
                perf.average_completion_time = assignment.actual_completion_time
        
        # Update quality scores
        if assignment.quality_score:
            perf.code_quality_score = (perf.code_quality_score + assignment.quality_score) / 2
        
        # Update tasks per hour
        if assignment.actual_completion_time:
            tasks_per_hour = 60 / assignment.actual_completion_time
            perf.tasks_per_hour = (perf.tasks_per_hour + tasks_per_hour) / 2
        
        # Update last activity
        perf.last_activity = datetime.now()
        
        # Reset consecutive failures on success
        agent.health.consecutive_failures = 0
    
    def _trigger_failover(self, failed_agent: Agent):
        """Trigger failover for a failed agent"""
        config = self.failover_configs.get(failed_agent.id)
        if not config or not config.auto_failover:
            return
        
        # Find backup agent
        backup_agent = None
        for backup_id in config.backup_agent_ids:
            backup_agent = self._get_agent_by_id(backup_id)
            if backup_agent and backup_agent.status == AgentStatus.AVAILABLE:
                break
        
        if backup_agent:
            # Transfer active assignments
            active_assignments = [
                assignment for assignment in self.assignments.values()
                if assignment.agent_id == failed_agent.id and not assignment.completed_at
            ]
            
            for assignment in active_assignments:
                assignment.agent_id = backup_agent.id
                backup_agent.current_workload += 1
            
            logger.info(f"Failed over from {failed_agent.name} to {backup_agent.name}")
        else:
            logger.error(f"No available backup agent for {failed_agent.name}")
    
    def _identify_agent_issues(self, agent: Agent) -> List[str]:
        """Identify issues with an agent"""
        issues = []
        
        if agent.health.consecutive_failures >= 2:
            issues.append(f"High failure rate ({agent.health.consecutive_failures} consecutive failures)")
        
        if agent.health.health_score < 0.5:
            issues.append(f"Low health score ({agent.health.health_score})")
        
        if agent.health.cpu_usage and agent.health.cpu_usage > 90:
            issues.append(f"High CPU usage ({agent.health.cpu_usage}%)")
        
        if agent.health.memory_usage and agent.health.memory_usage > 90:
            issues.append(f"High memory usage ({agent.health.memory_usage}%)")
        
        if agent.performance.success_rate < 0.7:
            issues.append(f"Low success rate ({agent.performance.success_rate})")
        
        return issues
    
    def _simulate_training_improvement(self, agent: Agent, training_type: str, training_data: Dict[str, Any]) -> float:
        """Simulate training improvement (placeholder for actual training logic)"""
        # This would integrate with actual training systems
        base_improvement = 0.1
        
        # Adjust based on training type
        if training_type == "skill_improvement":
            base_improvement = 0.15
        elif training_type == "capability_expansion":
            base_improvement = 0.2
        elif training_type == "performance_optimization":
            base_improvement = 0.12
        
        # Adjust based on agent's learning rate
        improvement = base_improvement * agent.learning_rate
        
        # Add some randomness
        import random
        improvement += random.uniform(-0.02, 0.02)
        
        return max(0.0, min(1.0, improvement))
    
    def _generate_new_capabilities(self, agent: Agent, training_type: str, training_data: Dict[str, Any]) -> List[AgentCapability]:
        """Generate new capabilities based on training (placeholder)"""
        new_capabilities = []
        
        # This would analyze training data and generate appropriate capabilities
        # For now, return empty list
        return new_capabilities
    
    async def _monitor_agents(self):
        """Background monitoring of agent health and performance"""
        while self.is_monitoring:
            try:
                # Update health status
                for pool in self.agent_pools.values():
                    for agent in pool.agents:
                        await self._update_agent_health(agent)
                
                # Check for agents needing attention
                health_report = self.get_agent_health_report()
                if health_report['agents_needing_attention']:
                    logger.warning(f"{len(health_report['agents_needing_attention'])} agents need attention")
                
                await asyncio.sleep(self.health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in agent monitoring: {e}")
                await asyncio.sleep(10)
    
    async def _update_agent_health(self, agent: Agent):
        """Update agent health status (placeholder for actual health checks)"""
        # This would perform actual health checks
        # For now, just update the last heartbeat
        agent.health.last_heartbeat = datetime.now()
        
        # Simulate some health metrics
        import random
        agent.health.cpu_usage = random.uniform(20, 80)
        agent.health.memory_usage = random.uniform(30, 70)
        agent.health.response_time = random.uniform(0.1, 2.0)
