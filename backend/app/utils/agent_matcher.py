"""
Agent matching utilities for intelligent workstream assignment
"""
from typing import List, Dict, Optional, Tuple, Set, Any
from datetime import datetime, timedelta
import math
import logging
from dataclasses import dataclass

from ..models.Agents import (
    Agent, AgentType, AgentStatus, SkillLevel, AgentCapability,
    AgentPerformance, AgentHealth, AgentMatchingCriteria, AgentMatchingResult,
    AgentAssignment, AgentPool
)
from ..models.Workstream import Workstream, WorkstreamStatus

logger = logging.getLogger(__name__)


@dataclass
class MatchingScore:
    """Score for agent-workstream matching"""
    agent_id: str
    workstream_id: str
    overall_score: float
    capability_score: float
    performance_score: float
    availability_score: float
    workload_score: float
    health_score: float
    specialization_bonus: float
    reasoning: str


class AgentMatcher:
    """Intelligent agent matching system"""
    
    def __init__(self, agent_pool: AgentPool):
        self.agent_pool = agent_pool
        self.matching_history: Dict[str, List[MatchingScore]] = {}
        
    def match_agent_to_workstream(
        self, 
        workstream: Workstream, 
        criteria: Optional[AgentMatchingCriteria] = None
    ) -> AgentMatchingResult:
        """
        Find the best agent for a given workstream
        
        Args:
            workstream: The workstream to assign
            criteria: Optional matching criteria
            
        Returns:
            AgentMatchingResult with matched agents
        """
        if criteria is None:
            criteria = self._generate_default_criteria(workstream)
        
        # Get available agents
        available_agents = self._get_available_agents()
        
        # Filter agents based on criteria
        filtered_agents = self._filter_agents_by_criteria(available_agents, criteria)
        
        # Score each agent
        scored_agents = self._score_agents(filtered_agents, workstream, criteria)
        
        # Sort by score and select best matches
        scored_agents.sort(key=lambda x: x.overall_score, reverse=True)
        
        # Build result
        result = AgentMatchingResult(
            workstream_id=workstream.id,
            matching_criteria=criteria,
            matched_agents=[self._get_agent_by_id(score.agent_id) for score in scored_agents],
            best_match=self._get_agent_by_id(scored_agents[0].agent_id) if scored_agents else None,
            confidence_score=scored_agents[0].overall_score if scored_agents else 0.0,
            applied_filters=[f"Filtered {len(available_agents)} to {len(filtered_agents)} agents"],
            alternative_matches=[self._get_agent_by_id(score.agent_id) for score in scored_agents[1:3]]
        )
        
        # Store matching history
        self._store_matching_history(workstream.id, scored_agents)
        
        return result
    
    def _generate_default_criteria(self, workstream: Workstream) -> AgentMatchingCriteria:
        """Generate default matching criteria based on workstream"""
        criteria = AgentMatchingCriteria()
        
        # Analyze workstream tags and description for required capabilities
        text_content = f"{workstream.name} {workstream.description} {' '.join(workstream.tags)}"
        text_content = text_content.lower()
        
        # Map common terms to capabilities (use exact names that match agent capabilities)
        capability_mapping = {
            'ui': ['React', 'CSS', 'HTML'],
            'frontend': ['React', 'CSS', 'HTML'],
            'react': ['React'],
            'typescript': ['TypeScript'],
            'api': ['FastAPI', 'API Design', 'REST'],
            'backend': ['Python', 'FastAPI'],
            'python': ['Python'],
            'database': ['PostgreSQL', 'SQL', 'Database Design'],
            'postgresql': ['PostgreSQL'],
            'testing': ['Unit Testing', 'Integration Testing', 'Test Automation'],
            'devops': ['Docker', 'Kubernetes', 'CI/CD', 'Deployment'],
            'documentation': ['Technical Writing', 'API Documentation', 'User Guides']
        }
        
        # Add capabilities based on text content
        for term, capabilities in capability_mapping.items():
            if term in text_content:
                criteria.required_capabilities.extend(capabilities)
        
        # Remove duplicates
        criteria.required_capabilities = list(set(criteria.required_capabilities))
        
        # Set agent type preferences based on workstream characteristics
        if any(term in text_content for term in ['ui', 'frontend', 'react', 'vue']):
            criteria.preferred_agent_types = [AgentType.UI_DEVELOPER, AgentType.FRONTEND_SPECIALIST]
        elif any(term in text_content for term in ['api', 'backend', 'database']):
            criteria.preferred_agent_types = [AgentType.API_DEVELOPER, AgentType.BACKEND_SPECIALIST]
        elif 'testing' in text_content:
            criteria.preferred_agent_types = [AgentType.TESTING_ENGINEER]
        elif 'devops' in text_content:
            criteria.preferred_agent_types = [AgentType.DEVOPS_ENGINEER]
        
        return criteria
    
    def _get_available_agents(self) -> List[Agent]:
        """Get all available agents from the pool"""
        return [
            agent for agent in self.agent_pool.agents
            if agent.status == AgentStatus.AVAILABLE and agent.health.is_healthy
        ]
    
    def _filter_agents_by_criteria(
        self, 
        agents: List[Agent], 
        criteria: AgentMatchingCriteria
    ) -> List[Agent]:
        """Filter agents based on matching criteria"""
        filtered_agents = []
        
        logger.info(f"Filtering {len(agents)} agents with criteria:")
        logger.info(f"  Required capabilities: {criteria.required_capabilities}")
        logger.info(f"  Minimum success rate: {criteria.minimum_success_rate}")
        logger.info(f"  Minimum uptime: {criteria.minimum_uptime}")
        
        for agent in agents:
            logger.info(f"Checking agent {agent.name}:")
            
            # Check if agent meets minimum requirements
            if not self._meets_minimum_requirements(agent, criteria):
                logger.info(f"  ❌ Failed minimum requirements")
                continue
            
            # Check workload constraints
            if criteria.maximum_current_workload and agent.current_workload >= criteria.maximum_current_workload:
                logger.info(f"  ❌ Failed workload constraint (current: {agent.current_workload}, max: {criteria.maximum_current_workload})")
                continue
            
            # Check performance requirements
            if agent.performance.success_rate < criteria.minimum_success_rate:
                logger.info(f"  ❌ Failed performance requirement (success rate: {agent.performance.success_rate}, required: {criteria.minimum_success_rate})")
                continue
            
            # Check uptime requirements
            if agent.performance.uptime_percentage < criteria.minimum_uptime:
                logger.info(f"  ❌ Failed uptime requirement (uptime: {agent.performance.uptime_percentage}, required: {criteria.minimum_uptime})")
                continue
            
            logger.info(f"  ✅ Passed all filters")
            filtered_agents.append(agent)
        
        logger.info(f"Filtered to {len(filtered_agents)} agents")
        return filtered_agents
    
    def _meets_minimum_requirements(self, agent: Agent, criteria: AgentMatchingCriteria) -> bool:
        """Check if agent meets minimum requirements"""
        logger.info(f"    Checking minimum requirements for {agent.name}")
        logger.info(f"    Agent capabilities: {[cap.skill_name for cap in agent.capabilities]}")
        logger.info(f"    Required capabilities: {criteria.required_capabilities}")
        
        # Check required capabilities (allow partial matches)
        agent_capabilities = {cap.skill_name for cap in agent.capabilities}
        matching_capabilities = 0
        total_required = len(criteria.required_capabilities)
        
        for required_cap in criteria.required_capabilities:
            if required_cap in agent_capabilities:
                matching_capabilities += 1
            else:
                logger.info(f"    ❌ Missing capability: {required_cap}")
        
        # Require at least 50% of capabilities to match, but allow agents with no capabilities if no requirements specified
        if total_required == 0:
            logger.info(f"    ✅ No specific capabilities required")
            return True
        elif matching_capabilities < max(1, total_required // 2):
            logger.info(f"    ❌ Insufficient capability match: {matching_capabilities}/{total_required}")
            return False
        
        # Check required specializations
        for required_spec in criteria.required_specializations:
            if required_spec not in agent.specializations:
                logger.info(f"    ❌ Missing required specialization: {required_spec}")
                return False
        
        # Check skill level requirements for matching capabilities
        skill_level_order = {
            SkillLevel.BEGINNER: 0,
            SkillLevel.INTERMEDIATE: 1,
            SkillLevel.ADVANCED: 2,
            SkillLevel.EXPERT: 3
        }
        
        for required_cap in criteria.required_capabilities:
            if required_cap in agent_capabilities:
                cap = next((c for c in agent.capabilities if c.skill_name == required_cap), None)
                if cap:
                    agent_skill_level = skill_level_order.get(cap.skill_level, 0)
                    required_skill_level = skill_level_order.get(criteria.minimum_skill_level, 0)
                    if agent_skill_level < required_skill_level:
                        logger.info(f"    ❌ Skill level too low for {required_cap}: {cap.skill_level.value} (level {agent_skill_level}) < {criteria.minimum_skill_level.value} (level {required_skill_level})")
                        return False
        
        logger.info(f"    ✅ Meets minimum requirements ({matching_capabilities}/{total_required} capabilities)")
        return True
    
    def _score_agents(
        self, 
        agents: List[Agent], 
        workstream: Workstream, 
        criteria: AgentMatchingCriteria
    ) -> List[MatchingScore]:
        """Score agents for workstream assignment"""
        scores = []
        
        for agent in agents:
            capability_score = self._calculate_capability_score(agent, criteria)
            performance_score = self._calculate_performance_score(agent)
            availability_score = self._calculate_availability_score(agent)
            workload_score = self._calculate_workload_score(agent)
            health_score = self._calculate_health_score(agent)
            specialization_bonus = self._calculate_specialization_bonus(agent, criteria)
            
            # Calculate overall score with weights
            overall_score = (
                capability_score * 0.3 +
                performance_score * 0.25 +
                availability_score * 0.2 +
                workload_score * 0.15 +
                health_score * 0.1
            ) + specialization_bonus
            
            # Generate reasoning
            reasoning = self._generate_matching_reasoning(
                agent, workstream, capability_score, performance_score,
                availability_score, workload_score, health_score, specialization_bonus
            )
            
            scores.append(MatchingScore(
                agent_id=agent.id,
                workstream_id=workstream.id,
                overall_score=overall_score,
                capability_score=capability_score,
                performance_score=performance_score,
                availability_score=availability_score,
                workload_score=workload_score,
                health_score=health_score,
                specialization_bonus=specialization_bonus,
                reasoning=reasoning
            ))
        
        return scores
    
    def _calculate_capability_score(self, agent: Agent, criteria: AgentMatchingCriteria) -> float:
        """Calculate capability matching score"""
        if not criteria.required_capabilities:
            return 1.0
        
        total_score = 0.0
        max_possible_score = len(criteria.required_capabilities)
        
        # Skill level order mapping for scoring
        skill_level_order = {
            SkillLevel.BEGINNER: 0,
            SkillLevel.INTERMEDIATE: 1,
            SkillLevel.ADVANCED: 2,
            SkillLevel.EXPERT: 3
        }
        
        for required_cap in criteria.required_capabilities:
            cap = next((c for c in agent.capabilities if c.skill_name == required_cap), None)
            if cap:
                # Score based on skill level and confidence
                agent_skill_level = skill_level_order.get(cap.skill_level, 0)
                max_skill_level = skill_level_order.get(SkillLevel.EXPERT, 3)
                skill_level_score = agent_skill_level / max_skill_level
                confidence_score = cap.confidence_score
                success_score = cap.success_rate
                
                cap_score = (skill_level_score * 0.4 + confidence_score * 0.3 + success_score * 0.3)
                total_score += cap_score
        
        return total_score / max_possible_score if max_possible_score > 0 else 0.0
    
    def _calculate_performance_score(self, agent: Agent) -> float:
        """Calculate performance score"""
        perf = agent.performance
        
        # Base score from success rate
        base_score = perf.success_rate
        
        # Quality bonus
        quality_bonus = perf.code_quality_score * 0.2
        
        # Efficiency bonus
        efficiency_bonus = min(perf.tasks_per_hour / 2.0, 0.2)  # Cap at 0.2
        
        # Learning bonus
        learning_bonus = perf.skill_improvement_rate * 0.1
        
        return min(base_score + quality_bonus + efficiency_bonus + learning_bonus, 1.0)
    
    def _calculate_availability_score(self, agent: Agent) -> float:
        """Calculate availability score"""
        # Base availability
        base_score = agent.performance.uptime_percentage
        
        # Response time bonus (faster is better)
        if agent.health.response_time:
            response_bonus = max(0, 1.0 - (agent.health.response_time / 10.0)) * 0.2
        else:
            response_bonus = 0.0
        
        # Recent activity bonus
        if agent.performance.last_activity:
            time_since_activity = datetime.now() - agent.performance.last_activity
            if time_since_activity < timedelta(hours=1):
                activity_bonus = 0.1
            elif time_since_activity < timedelta(hours=24):
                activity_bonus = 0.05
            else:
                activity_bonus = 0.0
        else:
            activity_bonus = 0.0
        
        return min(base_score + response_bonus + activity_bonus, 1.0)
    
    def _calculate_workload_score(self, agent: Agent) -> float:
        """Calculate workload score (lower workload = higher score)"""
        workload_ratio = agent.current_workload / agent.max_concurrent_tasks
        return max(0, 1.0 - workload_ratio)
    
    def _calculate_health_score(self, agent: Agent) -> float:
        """Calculate health score"""
        health = agent.health
        
        # Base health score
        base_score = health.health_score
        
        # Failure penalty
        failure_penalty = min(health.consecutive_failures / health.max_consecutive_failures, 0.5)
        
        # Resource usage penalty
        resource_penalty = 0.0
        if health.cpu_usage and health.cpu_usage > 80:
            resource_penalty += 0.2
        if health.memory_usage and health.memory_usage > 80:
            resource_penalty += 0.2
        
        return max(0, base_score - failure_penalty - resource_penalty)
    
    def _calculate_specialization_bonus(self, agent: Agent, criteria: AgentMatchingCriteria) -> float:
        """Calculate specialization bonus"""
        bonus = 0.0
        
        # Agent type preference bonus
        if criteria.preferred_agent_types and agent.agent_type in criteria.preferred_agent_types:
            bonus += 0.1
        
        # Specialization matching bonus
        for preferred_spec in criteria.preferred_capabilities:
            if preferred_spec in agent.specializations:
                bonus += 0.05
        
        # Priority boost
        bonus += criteria.priority_boost
        
        return min(bonus, 0.3)  # Cap specialization bonus
    
    def _generate_matching_reasoning(
        self, 
        agent: Agent, 
        workstream: Workstream,
        capability_score: float,
        performance_score: float,
        availability_score: float,
        workload_score: float,
        health_score: float,
        specialization_bonus: float
    ) -> str:
        """Generate human-readable reasoning for the match"""
        reasons = []
        
        if capability_score > 0.8:
            reasons.append("Excellent capability match")
        elif capability_score > 0.6:
            reasons.append("Good capability match")
        
        if performance_score > 0.8:
            reasons.append("High performance history")
        elif performance_score > 0.6:
            reasons.append("Good performance history")
        
        if availability_score > 0.9:
            reasons.append("Highly available")
        elif availability_score > 0.7:
            reasons.append("Good availability")
        
        if workload_score > 0.8:
            reasons.append("Low current workload")
        elif workload_score < 0.3:
            reasons.append("High current workload")
        
        if health_score > 0.9:
            reasons.append("Excellent health status")
        elif health_score < 0.5:
            reasons.append("Health concerns")
        
        if specialization_bonus > 0.1:
            reasons.append("Specialized for this work type")
        
        if not reasons:
            reasons.append("Meets basic requirements")
        
        return "; ".join(reasons)
    
    def _get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID from the pool"""
        return next((agent for agent in self.agent_pool.agents if agent.id == agent_id), None)
    
    def _store_matching_history(self, workstream_id: str, scores: List[MatchingScore]):
        """Store matching history for analysis"""
        if workstream_id not in self.matching_history:
            self.matching_history[workstream_id] = []
        self.matching_history[workstream_id].extend(scores)


class LoadBalancer:
    """Load balancing for agent assignments"""
    
    def __init__(self, agent_pool: AgentPool):
        self.agent_pool = agent_pool
        self.assignment_history: List[AgentAssignment] = []
    
    def balance_workload(self, workstreams: List[Workstream]) -> Dict[str, str]:
        """
        Balance workload across available agents
        
        Args:
            workstreams: List of workstreams to assign
            
        Returns:
            Dictionary mapping workstream_id to agent_id
        """
        available_agents = [
            agent for agent in self.agent_pool.agents
            if agent.status == AgentStatus.AVAILABLE and agent.health.is_healthy
        ]
        
        if not available_agents:
            return {}
        
        # Sort workstreams by priority (higher priority first)
        sorted_workstreams = sorted(workstreams, key=lambda w: w.priority)
        
        # Sort agents by current workload (lower workload first)
        sorted_agents = sorted(available_agents, key=lambda a: a.current_workload)
        
        assignments = {}
        agent_workloads = {agent.id: agent.current_workload for agent in available_agents}
        
        for workstream in sorted_workstreams:
            # Find agent with lowest workload
            best_agent = min(sorted_agents, key=lambda a: agent_workloads[a.id])
            
            # Check if agent can handle more work
            if agent_workloads[best_agent.id] < best_agent.max_concurrent_tasks:
                assignments[workstream.id] = best_agent.id
                agent_workloads[best_agent.id] += 1
        
        return assignments
    
    def get_workload_distribution(self) -> Dict[str, Dict[str, Any]]:
        """Get current workload distribution across agents"""
        distribution = {}
        
        for agent in self.agent_pool.agents:
            distribution[agent.id] = {
                'name': agent.name,
                'agent_type': agent.agent_type,
                'current_workload': agent.current_workload,
                'max_concurrent_tasks': agent.max_concurrent_tasks,
                'utilization': agent.current_workload / agent.max_concurrent_tasks,
                'status': agent.status,
                'health_score': agent.health.health_score
            }
        
        return distribution


class PerformanceOptimizer:
    """Performance optimization for agent assignments"""
    
    def __init__(self, agent_pool: AgentPool):
        self.agent_pool = agent_pool
        self.performance_history: List[Dict[str, Any]] = []
    
    def optimize_assignments(self, assignments: Dict[str, str]) -> Dict[str, str]:
        """
        Optimize agent assignments based on historical performance
        
        Args:
            assignments: Current workstream to agent assignments
            
        Returns:
            Optimized assignments
        """
        optimized_assignments = assignments.copy()
        
        # Analyze historical performance for similar workstreams
        for workstream_id, agent_id in assignments.items():
            workstream = self._get_workstream_by_id(workstream_id)
            if not workstream:
                continue
            
            # Find better performing agents for this type of work
            better_agent = self._find_better_performing_agent(workstream, agent_id)
            if better_agent:
                optimized_assignments[workstream_id] = better_agent.id
        
        return optimized_assignments
    
    def _get_workstream_by_id(self, workstream_id: str) -> Optional[Workstream]:
        """Get workstream by ID (placeholder - would need access to workstream data)"""
        # This would need to be implemented based on how workstreams are stored
        return None
    
    def _find_better_performing_agent(self, workstream: Workstream, current_agent_id: str) -> Optional[Agent]:
        """Find a better performing agent for the workstream"""
        current_agent = self._get_agent_by_id(current_agent_id)
        if not current_agent:
            return None
        
        # Look for agents with better performance for similar work
        available_agents = [
            agent for agent in self.agent_pool.agents
            if agent.status == AgentStatus.AVAILABLE and 
               agent.health.is_healthy and
               agent.id != current_agent_id
        ]
        
        # Score agents based on performance for similar work
        best_agent = None
        best_score = 0.0
        
        for agent in available_agents:
            score = self._calculate_performance_score_for_work(agent, workstream)
            if score > best_score:
                best_score = score
                best_agent = agent
        
        # Only switch if the improvement is significant
        if best_agent and best_score > 0.2:  # 20% improvement threshold
            return best_agent
        
        return None
    
    def _get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID from the pool"""
        return next((agent for agent in self.agent_pool.agents if agent.id == agent_id), None)
    
    def _calculate_performance_score_for_work(self, agent: Agent, workstream: Workstream) -> float:
        """Calculate performance score for specific work type"""
        # This would analyze historical performance for similar workstreams
        # For now, return a simple score based on general performance
        return agent.performance.success_rate * agent.performance.code_quality_score
