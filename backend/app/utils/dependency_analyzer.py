"""
Dependency analysis utilities for workstream decomposition
"""
from typing import List, Dict, Set, Tuple, Optional, Any
from collections import defaultdict, deque
import re
from dataclasses import dataclass
from enum import Enum

from ..models.Workstream import (
    Workstream, WorkstreamDependency, DependencyType, 
    ResourceRequirement, ResourceType
)


class DependencyPattern(str, Enum):
    """Common dependency patterns in task descriptions"""
    FILE_DEPENDENCY = "file_dependency"
    API_DEPENDENCY = "api_dependency"
    DATABASE_DEPENDENCY = "database_dependency"
    SEQUENTIAL_DEPENDENCY = "sequential_dependency"
    PARALLEL_OPPORTUNITY = "parallel_opportunity"
    RESOURCE_CONFLICT = "resource_conflict"


@dataclass
class DependencyMatch:
    """A detected dependency pattern"""
    pattern_type: DependencyPattern
    source_text: str
    confidence: float  # 0.0 to 1.0
    metadata: Dict[str, Any]


class DependencyAnalyzer:
    """Analyzes task dependencies and identifies parallelization opportunities"""
    
    def __init__(self):
        # Common patterns that indicate dependencies
        self.dependency_patterns = {
            DependencyPattern.FILE_DEPENDENCY: [
                r"after.*file.*created",
                r"wait.*for.*file",
                r"depends.*on.*file",
                r"read.*file.*first",
                r"file.*must.*exist"
            ],
            DependencyPattern.API_DEPENDENCY: [
                r"call.*api.*first",
                r"wait.*for.*api.*response",
                r"depends.*on.*endpoint",
                r"api.*must.*be.*ready"
            ],
            DependencyPattern.DATABASE_DEPENDENCY: [
                r"database.*must.*be.*updated",
                r"wait.*for.*database.*change",
                r"depends.*on.*table.*creation",
                r"schema.*must.*exist"
            ],
            DependencyPattern.SEQUENTIAL_DEPENDENCY: [
                r"after.*complete",
                r"wait.*for.*finish",
                r"step.*before.*step",
                r"must.*complete.*first"
            ],
            DependencyPattern.PARALLEL_OPPORTUNITY: [
                r"can.*run.*simultaneously",
                r"independent.*of",
                r"no.*dependencies",
                r"can.*start.*anytime"
            ],
            DependencyPattern.RESOURCE_CONFLICT: [
                r"exclusive.*access",
                r"lock.*resource",
                r"cannot.*share",
                r"single.*instance"
            ]
        }
        
        # Resource keywords that might indicate conflicts
        self.resource_keywords = {
            ResourceType.FILE: ["file", "document", "config", "data", "log"],
            ResourceType.DATABASE: ["database", "table", "schema", "connection"],
            ResourceType.API_ENDPOINT: ["api", "endpoint", "service", "url"],
            ResourceType.EXTERNAL_SERVICE: ["service", "third-party", "external"],
            ResourceType.COMPUTATIONAL: ["cpu", "memory", "gpu", "processing"]
        }
    
    def analyze_task_dependencies(self, task_description: str) -> List[DependencyMatch]:
        """
        Analyze a task description to identify dependency patterns
        
        Args:
            task_description: The task description to analyze
            
        Returns:
            List of detected dependency patterns
        """
        matches = []
        description_lower = task_description.lower()
        
        for pattern_type, patterns in self.dependency_patterns.items():
            for pattern in patterns:
                if re.search(pattern, description_lower):
                    confidence = self._calculate_confidence(pattern, description_lower)
                    matches.append(DependencyMatch(
                        pattern_type=pattern_type,
                        source_text=task_description,
                        confidence=confidence,
                        metadata={"pattern": pattern}
                    ))
        
        return matches
    
    def _calculate_confidence(self, pattern: str, text: str) -> float:
        """Calculate confidence score for a pattern match"""
        # Simple confidence calculation based on pattern specificity
        if "must" in pattern or "exclusive" in pattern:
            return 0.9
        elif "can" in pattern or "optional" in pattern:
            return 0.7
        elif "after" in pattern or "before" in pattern:
            return 0.8
        else:
            return 0.6
    
    def detect_resource_requirements(self, task_description: str) -> List[ResourceRequirement]:
        """
        Detect resource requirements from task description
        
        Args:
            task_description: The task description to analyze
            
        Returns:
            List of detected resource requirements
        """
        requirements = []
        description_lower = task_description.lower()
        
        for resource_type, keywords in self.resource_keywords.items():
            for keyword in keywords:
                if keyword in description_lower:
                    # Check if it's exclusive access
                    is_exclusive = any(word in description_lower 
                                     for word in ["exclusive", "lock", "single", "unique"])
                    
                    requirements.append(ResourceRequirement(
                        resource_id=f"{resource_type.value}_{keyword}",
                        resource_type=resource_type,
                        resource_name=keyword,
                        is_exclusive=is_exclusive
                    ))
        
        return requirements
    
    def build_dependency_graph(self, workstreams: List[Workstream]) -> Dict[str, List[str]]:
        """
        Build a dependency graph from workstreams
        
        Args:
            workstreams: List of workstreams to analyze
            
        Returns:
            Dictionary mapping workstream ID to list of dependent workstream IDs
        """
        graph = defaultdict(list)
        
        for workstream in workstreams:
            for dependency in workstream.dependencies:
                if dependency.dependency_type == DependencyType.REQUIRES:
                    graph[dependency.target_workstream_id].append(workstream.id)
        
        return dict(graph)
    
    def detect_cycles(self, dependency_graph: Dict[str, List[str]]) -> List[List[str]]:
        """
        Detect cycles in the dependency graph using DFS
        
        Args:
            dependency_graph: The dependency graph to analyze
            
        Returns:
            List of cycles found (each cycle is a list of workstream IDs)
        """
        cycles = []
        visited = set()
        rec_stack = set()
        
        def dfs(node: str, path: List[str]):
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
            
            for neighbor in dependency_graph.get(node, []):
                dfs(neighbor, path.copy())
            
            rec_stack.remove(node)
        
        for node in dependency_graph:
            if node not in visited:
                dfs(node, [])
        
        return cycles
    
    def find_parallel_groups(self, workstreams: List[Workstream]) -> List[List[str]]:
        """
        Find groups of workstreams that can run in parallel
        
        Args:
            workstreams: List of workstreams to analyze
            
        Returns:
            List of workstream groups that can run in parallel
        """
        # Build dependency graph
        dependency_graph = self.build_dependency_graph(workstreams)
        
        # Calculate in-degrees for each workstream
        in_degrees = defaultdict(int)
        for workstream in workstreams:
            in_degrees[workstream.id] = len(workstream.dependencies)
        
        # Use topological sort to find parallel groups
        parallel_groups = []
        queue = deque([ws.id for ws in workstreams if in_degrees[ws.id] == 0])
        
        while queue:
            current_group = []
            group_size = len(queue)
            
            for _ in range(group_size):
                current = queue.popleft()
                current_group.append(current)
                
                # Process dependents
                for dependent in dependency_graph.get(current, []):
                    in_degrees[dependent] -= 1
                    if in_degrees[dependent] == 0:
                        queue.append(dependent)
            
            if current_group:
                parallel_groups.append(current_group)
        
        return parallel_groups
    
    def detect_resource_conflicts(self, workstreams: List[Workstream]) -> List[Dict[str, Any]]:
        """
        Detect potential resource conflicts between workstreams
        
        Args:
            workstreams: List of workstreams to analyze
            
        Returns:
            List of detected resource conflicts
        """
        conflicts = []
        resource_usage = defaultdict(list)
        
        # Group workstreams by resource usage
        for workstream in workstreams:
            for resource in workstream.required_resources:
                resource_usage[resource.resource_id].append({
                    "workstream_id": workstream.id,
                    "workstream_name": workstream.name,
                    "resource": resource
                })
        
        # Check for conflicts
        for resource_id, usages in resource_usage.items():
            if len(usages) > 1:
                # Check if any usage requires exclusive access
                exclusive_usages = [u for u in usages if u["resource"].is_exclusive]
                
                if exclusive_usages:
                    conflicts.append({
                        "resource_id": resource_id,
                        "resource_name": usages[0]["resource"].resource_name,
                        "conflict_type": "exclusive_access",
                        "conflicting_workstreams": [u["workstream_id"] for u in usages],
                        "exclusive_workstreams": [u["workstream_id"] for u in exclusive_usages]
                    })
                elif len(usages) > 3:  # Too many concurrent users
                    conflicts.append({
                        "resource_id": resource_id,
                        "resource_name": usages[0]["resource"].resource_name,
                        "conflict_type": "resource_overload",
                        "conflicting_workstreams": [u["workstream_id"] for u in usages],
                        "concurrent_users": len(usages)
                    })
        
        return conflicts
    
    def calculate_complexity_score(self, task_description: str) -> float:
        """
        Calculate complexity score for a task (0.0 to 1.0)
        
        Args:
            task_description: The task description to analyze
            
        Returns:
            Complexity score between 0.0 and 1.0
        """
        complexity_factors = {
            "technical_terms": len(re.findall(r'\b(api|database|algorithm|optimization|integration)\b', 
                                            task_description.lower())),
            "dependency_indicators": len(re.findall(r'\b(after|before|depends|requires|wait)\b', 
                                                  task_description.lower())),
            "resource_mentions": len(re.findall(r'\b(file|database|service|resource)\b', 
                                              task_description.lower())),
            "length_factor": min(len(task_description.split()) / 50.0, 1.0)
        }
        
        # Weighted average of factors
        weights = {
            "technical_terms": 0.3,
            "dependency_indicators": 0.3,
            "resource_mentions": 0.2,
            "length_factor": 0.2
        }
        
        score = sum(factor * weights[name] for name, factor in complexity_factors.items())
        return min(score, 1.0)
    
    def estimate_duration(self, task_description: str, complexity_score: float) -> int:
        """
        Estimate task duration in minutes based on description and complexity
        
        Args:
            task_description: The task description
            complexity_score: The calculated complexity score
            
        Returns:
            Estimated duration in minutes
        """
        # Base duration based on complexity
        base_duration = int(complexity_score * 120)  # 0-120 minutes
        
        # Adjust based on keywords
        description_lower = task_description.lower()
        
        if any(word in description_lower for word in ["simple", "quick", "basic"]):
            base_duration *= 0.5
        elif any(word in description_lower for word in ["complex", "advanced", "optimization"]):
            base_duration *= 1.5
        elif any(word in description_lower for word in ["research", "analysis", "investigation"]):
            base_duration *= 2.0
        
        return max(base_duration, 5)  # Minimum 5 minutes
    
    def validate_workstream_dependencies(self, workstreams: List[Workstream]) -> List[str]:
        """
        Validate workstream dependencies and return any issues found
        
        Args:
            workstreams: List of workstreams to validate
            
        Returns:
            List of validation error messages
        """
        errors = []
        
        # Check for cycles
        dependency_graph = self.build_dependency_graph(workstreams)
        cycles = self.detect_cycles(dependency_graph)
        
        if cycles:
            for cycle in cycles:
                errors.append(f"Circular dependency detected: {' -> '.join(cycle)}")
        
        # Check for missing workstreams
        workstream_ids = {ws.id for ws in workstreams}
        for workstream in workstreams:
            for dependency in workstream.dependencies:
                if dependency.target_workstream_id not in workstream_ids:
                    errors.append(f"Workstream {workstream.id} depends on non-existent workstream {dependency.target_workstream_id}")
        
        return errors
