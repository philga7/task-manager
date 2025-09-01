"""
Scheduling utilities for workstream orchestration
"""
from typing import List, Dict, Set, Optional, Tuple, Any
from collections import defaultdict, deque
from datetime import datetime, timedelta
import heapq
import logging

from ..models.Workstream import (
    Workstream, WorkstreamStatus, WorkstreamDependency, 
    DependencyType, ResourceRequirement, ResourceType
)
from ..models.Orchestration import (
    ResourceAllocation, ResourceAllocationStatus, 
    ConflictResolutionStrategy, ResourceConflict
)

logger = logging.getLogger(__name__)


class WorkstreamScheduler:
    """
    Scheduler for managing workstream execution order and resource allocation
    """
    
    def __init__(self):
        self.execution_queue = deque()
        self.blocked_workstreams = set()
        self.running_workstreams = set()
        self.completed_workstreams = set()
        self.failed_workstreams = set()
        
        # Resource tracking
        self.allocated_resources = {}  # resource_id -> ResourceAllocation
        self.resource_wait_queue = defaultdict(list)  # resource_id -> [workstream_ids]
        
        # Dependency tracking
        self.dependency_graph = defaultdict(set)  # workstream_id -> {dependent_workstream_ids}
        self.reverse_dependencies = defaultdict(set)  # workstream_id -> {dependency_workstream_ids}
        
    def build_execution_plan(self, workstreams: List[Workstream]) -> Dict[str, Any]:
        """
        Build an execution plan for the given workstreams
        
        Args:
            workstreams: List of workstreams to schedule
            
        Returns:
            Execution plan with scheduling information
        """
        logger.info(f"Building execution plan for {len(workstreams)} workstreams")
        
        # Step 1: Build dependency graph
        self._build_dependency_graph(workstreams)
        
        # Step 2: Detect cycles
        cycles = self._detect_cycles()
        if cycles:
            raise ValueError(f"Circular dependencies detected: {cycles}")
        
        # Step 3: Calculate execution order
        execution_order = self._calculate_execution_order(workstreams)
        
        # Step 4: Identify resource conflicts
        resource_conflicts = self._identify_resource_conflicts(workstreams)
        
        # Step 5: Build execution plan
        plan = {
            "execution_order": execution_order,
            "resource_conflicts": resource_conflicts,
            "dependency_graph": dict(self.dependency_graph),
            "estimated_duration": self._estimate_total_duration(workstreams, execution_order),
            "parallelization_opportunities": self._identify_parallelization_opportunities(workstreams)
        }
        
        logger.info(f"Execution plan built. Estimated duration: {plan['estimated_duration']} minutes")
        return plan
    
    def _build_dependency_graph(self, workstreams: List[Workstream]) -> None:
        """Build the dependency graph from workstream dependencies"""
        self.dependency_graph.clear()
        self.reverse_dependencies.clear()
        
        # Create workstream lookup
        workstream_map = {ws.id: ws for ws in workstreams}
        
        for workstream in workstreams:
            for dependency in workstream.dependencies:
                source_id = dependency.source_workstream_id
                target_id = dependency.target_workstream_id
                
                # Validate that both workstreams exist
                if source_id not in workstream_map or target_id not in workstream_map:
                    logger.warning(f"Invalid dependency: {source_id} -> {target_id}")
                    continue
                
                # Add to dependency graph
                self.dependency_graph[source_id].add(target_id)
                self.reverse_dependencies[target_id].add(source_id)
    
    def _detect_cycles(self) -> List[List[str]]:
        """Detect cycles in the dependency graph using DFS"""
        visited = set()
        rec_stack = set()
        cycles = []
        
        def dfs(node: str, path: List[str]) -> None:
            if node in rec_stack:
                # Found a cycle
                cycle_start = path.index(node)
                cycles.append(path[cycle_start:] + [node])
                return
            
            if node in visited:
                return
            
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in self.dependency_graph.get(node, set()):
                dfs(neighbor, path.copy())
            
            rec_stack.remove(node)
        
        for node in self.dependency_graph:
            if node not in visited:
                dfs(node, [])
        
        return cycles
    
    def _calculate_execution_order(self, workstreams: List[Workstream]) -> List[str]:
        """Calculate execution order using topological sort with priority"""
        # Calculate in-degrees
        in_degrees = defaultdict(int)
        for workstream in workstreams:
            in_degrees[workstream.id] = len(self.reverse_dependencies.get(workstream.id, set()))
        
        # Priority queue for workstreams with same in-degree
        ready_queue = []
        for workstream in workstreams:
            if in_degrees[workstream.id] == 0:
                # Use negative priority so higher priority (lower number) comes first
                heapq.heappush(ready_queue, (-workstream.priority, workstream.id))
        
        execution_order = []
        
        while ready_queue:
            priority, workstream_id = heapq.heappop(ready_queue)
            execution_order.append(workstream_id)
            
            # Update in-degrees for dependent workstreams
            for dependent_id in self.dependency_graph.get(workstream_id, set()):
                in_degrees[dependent_id] -= 1
                if in_degrees[dependent_id] == 0:
                    # Find the workstream to get its priority
                    workstream = next((ws for ws in workstreams if ws.id == dependent_id), None)
                    if workstream:
                        heapq.heappush(ready_queue, (-workstream.priority, dependent_id))
        
        # Check if all workstreams were processed
        if len(execution_order) != len(workstreams):
            remaining = set(ws.id for ws in workstreams) - set(execution_order)
            logger.warning(f"Some workstreams could not be scheduled: {remaining}")
        
        return execution_order
    
    def _identify_resource_conflicts(self, workstreams: List[Workstream]) -> List[ResourceConflict]:
        """Identify potential resource conflicts between workstreams"""
        conflicts = []
        resource_usage = defaultdict(list)  # resource_id -> [(workstream_id, is_exclusive)]
        
        for workstream in workstreams:
            for resource_req in workstream.required_resources:
                resource_usage[resource_req.resource_id].append(
                    (workstream.id, resource_req.is_exclusive)
                )
        
        for resource_id, usages in resource_usage.items():
            if len(usages) > 1:
                # Check for conflicts
                exclusive_users = [ws_id for ws_id, is_exclusive in usages if is_exclusive]
                if len(exclusive_users) > 1:
                    # Multiple workstreams need exclusive access
                    conflicts.append(ResourceConflict(
                        resource_id=resource_id,
                        resource_type=self._get_resource_type(resource_id, workstreams),
                        conflicting_workstreams=exclusive_users,
                        conflict_type="exclusive_access",
                        severity="high"
                    ))
                elif len(exclusive_users) == 1 and len(usages) > 1:
                    # One exclusive user conflicts with shared users
                    conflicts.append(ResourceConflict(
                        resource_id=resource_id,
                        resource_type=self._get_resource_type(resource_id, workstreams),
                        conflicting_workstreams=[ws_id for ws_id, _ in usages],
                        conflict_type="exclusive_vs_shared",
                        severity="medium"
                    ))
        
        return conflicts
    
    def _get_resource_type(self, resource_id: str, workstreams: List[Workstream]) -> ResourceType:
        """Get the resource type for a given resource ID"""
        for workstream in workstreams:
            for resource_req in workstream.required_resources:
                if resource_req.resource_id == resource_id:
                    return resource_req.resource_type
        return ResourceType.FILE  # Default fallback
    
    def _estimate_total_duration(self, workstreams: List[Workstream], execution_order: List[str]) -> float:
        """Estimate total execution duration considering dependencies and parallelization"""
        workstream_map = {ws.id: ws for ws in workstreams}
        
        # Calculate earliest start times
        earliest_start = {}
        for workstream_id in execution_order:
            workstream = workstream_map[workstream_id]
            
            # Find latest completion time of dependencies
            latest_dependency_completion = 0
            for dep_id in self.reverse_dependencies.get(workstream_id, set()):
                if dep_id in earliest_start:
                    dep_duration = workstream_map[dep_id].estimated_duration or 0
                    completion_time = earliest_start[dep_id] + dep_duration
                    latest_dependency_completion = max(latest_dependency_completion, completion_time)
            
            earliest_start[workstream_id] = latest_dependency_completion
        
        # Calculate total duration
        total_duration = 0
        for workstream_id in execution_order:
            workstream = workstream_map[workstream_id]
            start_time = earliest_start[workstream_id]
            duration = workstream.estimated_duration or 0
            completion_time = start_time + duration
            total_duration = max(total_duration, completion_time)
        
        return total_duration
    
    def _identify_parallelization_opportunities(self, workstreams: List[Workstream]) -> List[List[str]]:
        """Identify groups of workstreams that can run in parallel"""
        opportunities = []
        workstream_map = {ws.id: ws for ws in workstreams}
        
        # Find workstreams with no dependencies on each other
        for i, workstream1 in enumerate(workstreams):
            for j, workstream2 in enumerate(workstreams[i+1:], i+1):
                # Check if they can run in parallel (no dependencies between them)
                if (workstream1.id not in self.dependency_graph.get(workstream2.id, set()) and
                    workstream2.id not in self.dependency_graph.get(workstream1.id, set())):
                    
                    # Check for resource conflicts
                    can_parallelize = True
                    for res1 in workstream1.required_resources:
                        for res2 in workstream2.required_resources:
                            if (res1.resource_id == res2.resource_id and 
                                (res1.is_exclusive or res2.is_exclusive)):
                                can_parallelize = False
                                break
                        if not can_parallelize:
                            break
                    
                    if can_parallelize:
                        opportunities.append([workstream1.id, workstream2.id])
        
        return opportunities


class ResourceManager:
    """
    Manages resource allocation and conflict resolution
    """
    
    def __init__(self):
        self.allocated_resources = {}  # resource_id -> ResourceAllocation
        self.resource_capacity = {}  # resource_id -> max_concurrent_usage
        self.waiting_workstreams = defaultdict(list)  # resource_id -> [(workstream_id, priority, timestamp)]
    
    def allocate_resource(self, resource_id: str, workstream_id: str, 
                         resource_type: ResourceType, resource_name: str,
                         is_exclusive: bool = False) -> bool:
        """
        Attempt to allocate a resource to a workstream
        
        Args:
            resource_id: ID of the resource
            workstream_id: ID of the workstream requesting the resource
            resource_type: Type of the resource
            resource_name: Name of the resource
            is_exclusive: Whether this resource requires exclusive access
            
        Returns:
            True if allocation successful, False otherwise
        """
        # Check if resource is available
        if self._is_resource_available(resource_id, workstream_id, is_exclusive):
            allocation = ResourceAllocation(
                resource_id=resource_id,
                resource_type=resource_type,
                resource_name=resource_name,
                workstream_id=workstream_id,
                allocation_time=datetime.now(),
                is_exclusive=is_exclusive
            )
            self.allocated_resources[resource_id] = allocation
            logger.info(f"Resource {resource_id} allocated to workstream {workstream_id}")
            return True
        else:
            # Add to waiting queue
            self.waiting_workstreams[resource_id].append((
                workstream_id, 
                self._get_workstream_priority(workstream_id),
                datetime.now()
            ))
            logger.info(f"Workstream {workstream_id} waiting for resource {resource_id}")
            return False
    
    def release_resource(self, resource_id: str, workstream_id: str) -> bool:
        """
        Release a resource allocation
        
        Args:
            resource_id: ID of the resource to release
            workstream_id: ID of the workstream releasing the resource
            
        Returns:
            True if release successful, False otherwise
        """
        if (resource_id in self.allocated_resources and 
            self.allocated_resources[resource_id].workstream_id == workstream_id):
            
            allocation = self.allocated_resources[resource_id]
            allocation.release_time = datetime.now()
            allocation.status = ResourceAllocationStatus.RELEASED
            
            del self.allocated_resources[resource_id]
            
            # Process waiting workstreams
            self._process_waiting_workstreams(resource_id)
            
            logger.info(f"Resource {resource_id} released by workstream {workstream_id}")
            return True
        
        return False
    
    def _is_resource_available(self, resource_id: str, workstream_id: str, is_exclusive: bool) -> bool:
        """Check if a resource is available for allocation"""
        if resource_id not in self.allocated_resources:
            return True
        
        current_allocation = self.allocated_resources[resource_id]
        
        # If current allocation is exclusive, resource is not available
        if current_allocation.is_exclusive:
            return False
        
        # If requesting exclusive access, resource is not available if already allocated
        if is_exclusive:
            return False
        
        # Check capacity limits
        if resource_id in self.resource_capacity:
            current_usage = len([a for a in self.allocated_resources.values() 
                               if a.resource_id == resource_id])
            if current_usage >= self.resource_capacity[resource_id]:
                return False
        
        return True
    
    def _get_workstream_priority(self, workstream_id: str) -> int:
        """Get priority for a workstream (placeholder - should be passed from scheduler)"""
        return 5  # Default priority
    
    def _process_waiting_workstreams(self, resource_id: str) -> None:
        """Process workstreams waiting for a resource"""
        if resource_id not in self.waiting_workstreams:
            return
        
        # Sort by priority (higher priority first)
        waiting = sorted(self.waiting_workstreams[resource_id], 
                        key=lambda x: x[1], reverse=True)
        
        for workstream_id, priority, timestamp in waiting:
            # Try to allocate resource
            # Note: This is a simplified version - in practice, you'd need more context
            logger.info(f"Processing waiting workstream {workstream_id} for resource {resource_id}")
        
        # Clear waiting queue
        self.waiting_workstreams[resource_id].clear()


class ConflictResolver:
    """
    Resolves resource conflicts using different strategies
    """
    
    def __init__(self):
        self.resolution_strategies = {
            ConflictResolutionStrategy.PRIORITY_BASED: self._resolve_priority_based,
            ConflictResolutionStrategy.FIFO: self._resolve_fifo,
            ConflictResolutionStrategy.LIFO: self._resolve_lifo,
            ConflictResolutionStrategy.ROUND_ROBIN: self._resolve_round_robin
        }
    
    def resolve_conflict(self, conflict: ResourceConflict, 
                        workstreams: List[Workstream]) -> Dict[str, Any]:
        """
        Resolve a resource conflict using the specified strategy
        
        Args:
            conflict: The resource conflict to resolve
            workstreams: List of all workstreams for context
            
        Returns:
            Resolution result with selected workstream and reasoning
        """
        strategy = conflict.resolution_strategy
        if strategy not in self.resolution_strategies:
            logger.warning(f"Unknown resolution strategy: {strategy}")
            strategy = ConflictResolutionStrategy.PRIORITY_BASED
        
        resolver = self.resolution_strategies[strategy]
        return resolver(conflict, workstreams)
    
    def _resolve_priority_based(self, conflict: ResourceConflict, 
                               workstreams: List[Workstream]) -> Dict[str, Any]:
        """Resolve conflict based on workstream priority"""
        workstream_map = {ws.id: ws for ws in workstreams}
        
        # Find workstream with highest priority (lowest number)
        selected_workstream = None
        highest_priority = float('inf')
        
        for workstream_id in conflict.conflicting_workstreams:
            if workstream_id in workstream_map:
                workstream = workstream_map[workstream_id]
                if workstream.priority < highest_priority:
                    highest_priority = workstream.priority
                    selected_workstream = workstream
        
        return {
            "selected_workstream_id": selected_workstream.id if selected_workstream else None,
            "reasoning": f"Selected workstream with highest priority ({highest_priority})",
            "strategy": ConflictResolutionStrategy.PRIORITY_BASED
        }
    
    def _resolve_fifo(self, conflict: ResourceConflict, 
                     workstreams: List[Workstream]) -> Dict[str, Any]:
        """Resolve conflict using first-in-first-out"""
        # In a real implementation, you'd track when workstreams were created
        # For now, we'll use the first workstream in the list
        selected_workstream_id = conflict.conflicting_workstreams[0]
        
        return {
            "selected_workstream_id": selected_workstream_id,
            "reasoning": "Selected first workstream in conflict list (FIFO)",
            "strategy": ConflictResolutionStrategy.FIFO
        }
    
    def _resolve_lifo(self, conflict: ResourceConflict, 
                     workstreams: List[Workstream]) -> Dict[str, Any]:
        """Resolve conflict using last-in-first-out"""
        selected_workstream_id = conflict.conflicting_workstreams[-1]
        
        return {
            "selected_workstream_id": selected_workstream_id,
            "reasoning": "Selected last workstream in conflict list (LIFO)",
            "strategy": ConflictResolutionStrategy.LIFO
        }
    
    def _resolve_round_robin(self, conflict: ResourceConflict, 
                           workstreams: List[Workstream]) -> Dict[str, Any]:
        """Resolve conflict using round-robin (simplified)"""
        # In a real implementation, you'd track round-robin state
        # For now, we'll use the first workstream
        selected_workstream_id = conflict.conflicting_workstreams[0]
        
        return {
            "selected_workstream_id": selected_workstream_id,
            "reasoning": "Selected workstream using round-robin (simplified)",
            "strategy": ConflictResolutionStrategy.ROUND_ROBIN
        }
