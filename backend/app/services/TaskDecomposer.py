"""
TaskDecomposer service for intelligent task decomposition
"""
import uuid
import logging
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
import re

from ..models.Workstream import (
    Workstream, WorkstreamDependency, DependencyType, ResourceRequirement,
    TaskDecompositionResult, DecompositionRequest, DecompositionMetrics
)
from ..utils.dependency_analyzer import DependencyAnalyzer, DependencyPattern

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TaskDecomposer:
    """
    Intelligent task decomposition service that breaks down complex tasks
    into parallel workstreams for efficient execution
    """
    
    def __init__(self):
        self.dependency_analyzer = DependencyAnalyzer()
        self.algorithm_version = "1.0.0"
        
        # Decomposition strategies
        self.decomposition_strategies = {
            "sequential": self._decompose_sequential,
            "parallel": self._decompose_parallel,
            "hybrid": self._decompose_hybrid,
            "resource_optimized": self._decompose_resource_optimized
        }
    
    def decompose_task(self, request: DecompositionRequest) -> TaskDecompositionResult:
        """
        Main method to decompose a complex task into workstreams
        
        Args:
            request: DecompositionRequest containing task details and constraints
            
        Returns:
            TaskDecompositionResult with decomposed workstreams
        """
        logger.info(f"Starting task decomposition for task: {request.task_id}")
        
        try:
            # Step 1: Analyze the task
            analysis = self._analyze_task(request)
            
            # Step 2: Choose decomposition strategy
            strategy = self._choose_decomposition_strategy(request, analysis)
            
            # Step 3: Decompose using chosen strategy
            workstreams = self.decomposition_strategies[strategy](request, analysis)
            
            # Step 4: Optimize workstreams
            workstreams = self._optimize_workstreams(workstreams, request)
            
            # Step 5: Validate decomposition
            validation_errors = self._validate_decomposition(workstreams)
            
            # Step 6: Calculate metrics
            metrics = self._calculate_decomposition_metrics(workstreams)
            
            # Step 7: Build result
            result = self._build_decomposition_result(
                request, workstreams, analysis, metrics, validation_errors
            )
            
            logger.info(f"Task decomposition completed. Created {len(workstreams)} workstreams")
            return result
            
        except Exception as e:
            logger.error(f"Error during task decomposition: {str(e)}")
            raise
    
    def _analyze_task(self, request: DecompositionRequest) -> Dict[str, Any]:
        """
        Analyze the task to understand its structure and requirements
        
        Args:
            request: The decomposition request
            
        Returns:
            Analysis results
        """
        analysis = {
            "complexity_score": self.dependency_analyzer.calculate_complexity_score(
                request.task_description
            ),
            "dependency_patterns": self.dependency_analyzer.analyze_task_dependencies(
                request.task_description
            ),
            "resource_requirements": self.dependency_analyzer.detect_resource_requirements(
                request.task_description
            ),
            "estimated_duration": self.dependency_analyzer.estimate_duration(
                request.task_description,
                self.dependency_analyzer.calculate_complexity_score(request.task_description)
            ),
            "keywords": self._extract_keywords(request.task_description),
            "sentence_count": len(request.task_description.split('.')),
            "word_count": len(request.task_description.split())
        }
        
        return analysis
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        # Remove common words and extract technical terms
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [word for word in words if word not in common_words and len(word) > 3]
        return list(set(keywords))
    
    def _choose_decomposition_strategy(self, request: DecompositionRequest, analysis: Dict[str, Any]) -> str:
        """
        Choose the best decomposition strategy based on task characteristics
        
        Args:
            request: The decomposition request
            analysis: Task analysis results
            
        Returns:
            Strategy name to use
        """
        complexity = analysis["complexity_score"]
        dependency_patterns = analysis["dependency_patterns"]
        resource_requirements = analysis["resource_requirements"]
        
        # Check for resource optimization needs
        if len(resource_requirements) > 2:
            return "resource_optimized"
        
        # Check for parallel opportunities
        parallel_indicators = [p for p in dependency_patterns 
                             if p.pattern_type == DependencyPattern.PARALLEL_OPPORTUNITY]
        if parallel_indicators and complexity > 0.5:
            return "parallel"
        
        # Check for sequential dependencies
        sequential_indicators = [p for p in dependency_patterns 
                               if p.pattern_type == DependencyPattern.SEQUENTIAL_DEPENDENCY]
        if sequential_indicators and complexity < 0.3:
            return "sequential"
        
        # Default to hybrid approach
        return "hybrid"
    
    def _decompose_sequential(self, request: DecompositionRequest, analysis: Dict[str, Any]) -> List[Workstream]:
        """
        Decompose task into sequential workstreams
        
        Args:
            request: The decomposition request
            analysis: Task analysis results
            
        Returns:
            List of sequential workstreams
        """
        workstreams = []
        task_parts = self._split_into_sequential_parts(request.task_description)
        
        for i, part in enumerate(task_parts):
            workstream = Workstream(
                id=str(uuid.uuid4()),
                name=f"{request.task_name} - Part {i+1}",
                description=part,
                original_task_id=request.task_id,
                priority=request.max_parallel_workstreams or 5,
                estimated_duration=self.dependency_analyzer.estimate_duration(part, analysis["complexity_score"]),
                complexity_score=self.dependency_analyzer.calculate_complexity_score(part),
                tags=[f"sequential-part-{i+1}"]
            )
            
            # Add sequential dependency
            if i > 0:
                workstream.dependencies.append(WorkstreamDependency(
                    source_workstream_id=workstream.id,
                    target_workstream_id=workstreams[i-1].id,
                    dependency_type=DependencyType.REQUIRES,
                    description=f"Depends on completion of part {i}"
                ))
            
            workstreams.append(workstream)
        
        return workstreams
    
    def _decompose_parallel(self, request: DecompositionRequest, analysis: Dict[str, Any]) -> List[Workstream]:
        """
        Decompose task into parallel workstreams
        
        Args:
            request: The decomposition request
            analysis: Task analysis results
            
        Returns:
            List of parallel workstreams
        """
        workstreams = []
        task_parts = self._split_into_parallel_parts(request.task_description, analysis)
        
        for i, part in enumerate(task_parts):
            workstream = Workstream(
                id=str(uuid.uuid4()),
                name=f"{request.task_name} - Parallel {i+1}",
                description=part["description"],
                original_task_id=request.task_id,
                priority=part.get("priority", 5),
                estimated_duration=part.get("estimated_duration", 30),
                complexity_score=part.get("complexity_score", 0.5),
                parallelization_score=0.9,  # High parallelization potential
                tags=[f"parallel-{i+1}"] + part.get("tags", [])
            )
            
            # Add resource requirements if detected
            if "resources" in part:
                workstream.required_resources = part["resources"]
            
            workstreams.append(workstream)
        
        return workstreams
    
    def _decompose_hybrid(self, request: DecompositionRequest, analysis: Dict[str, Any]) -> List[Workstream]:
        """
        Decompose task using hybrid approach (mix of parallel and sequential)
        
        Args:
            request: The decomposition request
            analysis: Task analysis results
            
        Returns:
            List of hybrid workstreams
        """
        workstreams = []
        
        # Split into logical phases
        phases = self._identify_task_phases(request.task_description)
        
        for phase_idx, phase in enumerate(phases):
            phase_workstreams = []
            
            # Create workstreams for this phase
            for part_idx, part in enumerate(phase["parts"]):
                workstream = Workstream(
                    id=str(uuid.uuid4()),
                    name=f"{request.task_name} - {phase['name']} - {part_idx+1}",
                    description=part["description"],
                    original_task_id=request.task_id,
                    priority=part.get("priority", 5),
                    estimated_duration=part.get("estimated_duration", 30),
                    complexity_score=part.get("complexity_score", 0.5),
                    tags=[f"phase-{phase_idx+1}", phase["name"]] + part.get("tags", [])
                )
                
                # Add dependencies within phase
                if part_idx > 0 and phase.get("sequential", False):
                    workstream.dependencies.append(WorkstreamDependency(
                        source_workstream_id=workstream.id,
                        target_workstream_id=phase_workstreams[part_idx-1].id,
                        dependency_type=DependencyType.REQUIRES,
                        description=f"Depends on previous part in {phase['name']}"
                    ))
                
                phase_workstreams.append(workstream)
            
            # Add dependencies between phases
            if phase_idx > 0:
                for workstream in phase_workstreams:
                    # Each workstream in this phase depends on all workstreams in previous phase
                    for prev_workstream in workstreams:
                        if f"phase-{phase_idx}" in prev_workstream.tags:
                            workstream.dependencies.append(WorkstreamDependency(
                                source_workstream_id=workstream.id,
                                target_workstream_id=prev_workstream.id,
                                dependency_type=DependencyType.REQUIRES,
                                description=f"Depends on completion of {phases[phase_idx-1]['name']} phase"
                            ))
            
            workstreams.extend(phase_workstreams)
        
        return workstreams
    
    def _decompose_resource_optimized(self, request: DecompositionRequest, analysis: Dict[str, Any]) -> List[Workstream]:
        """
        Decompose task optimizing for resource usage
        
        Args:
            request: The decomposition request
            analysis: Task analysis results
            
        Returns:
            List of resource-optimized workstreams
        """
        workstreams = []
        resource_groups = self._group_by_resources(request.task_description, analysis["resource_requirements"])
        
        for group_idx, group in enumerate(resource_groups):
            for part_idx, part in enumerate(group["parts"]):
                workstream = Workstream(
                    id=str(uuid.uuid4()),
                    name=f"{request.task_name} - {group['resource_type']} - {part_idx+1}",
                    description=part["description"],
                    original_task_id=request.task_id,
                    priority=part.get("priority", 5),
                    estimated_duration=part.get("estimated_duration", 30),
                    complexity_score=part.get("complexity_score", 0.5),
                    tags=[f"resource-{group['resource_type']}", f"group-{group_idx+1}"]
                )
                
                # Add resource requirements
                workstream.required_resources = [group["resource"]]
                
                # Add dependencies for exclusive resources
                if group["resource"].is_exclusive and part_idx > 0:
                    workstream.dependencies.append(WorkstreamDependency(
                        source_workstream_id=workstream.id,
                        target_workstream_id=workstreams[-1].id,
                        dependency_type=DependencyType.REQUIRES,
                        description=f"Exclusive access to {group['resource_type']}"
                    ))
                
                workstreams.append(workstream)
        
        return workstreams
    
    def _split_into_sequential_parts(self, description: str) -> List[str]:
        """Split task description into sequential parts"""
        # Simple sentence-based splitting
        sentences = [s.strip() for s in description.split('.') if s.strip()]
        return sentences
    
    def _split_into_parallel_parts(self, description: str, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Split task description into parallel parts"""
        parts = []
        
        # Look for parallel indicators
        parallel_keywords = ["also", "additionally", "meanwhile", "in parallel", "simultaneously"]
        sentences = [s.strip() for s in description.split('.') if s.strip()]
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in parallel_keywords):
                parts.append({
                    "description": sentence,
                    "priority": 5,
                    "estimated_duration": 30,
                    "complexity_score": 0.5,
                    "tags": ["parallel-indicator"]
                })
            else:
                parts.append({
                    "description": sentence,
                    "priority": 5,
                    "estimated_duration": 30,
                    "complexity_score": 0.5,
                    "tags": ["standard"]
                })
        
        return parts
    
    def _identify_task_phases(self, description: str) -> List[Dict[str, Any]]:
        """Identify logical phases in the task"""
        phases = []
        
        # Common phase patterns
        phase_patterns = [
            ("setup", ["setup", "prepare", "initialize", "configure"]),
            ("implementation", ["implement", "create", "build", "develop", "code"]),
            ("testing", ["test", "verify", "validate", "check"]),
            ("deployment", ["deploy", "release", "publish", "launch"])
        ]
        
        sentences = [s.strip() for s in description.split('.') if s.strip()]
        
        for phase_name, keywords in phase_patterns:
            phase_sentences = []
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in keywords):
                    phase_sentences.append({
                        "description": sentence,
                        "priority": 5,
                        "estimated_duration": 30,
                        "complexity_score": 0.5,
                        "tags": [phase_name]
                    })
            
            if phase_sentences:
                phases.append({
                    "name": phase_name,
                    "parts": phase_sentences,
                    "sequential": phase_name in ["setup", "deployment"]  # These are usually sequential
                })
        
        # If no phases identified, create a default phase
        if not phases:
            phases.append({
                "name": "main",
                "parts": [{"description": description, "priority": 5, "estimated_duration": 30, "complexity_score": 0.5, "tags": ["main"]}],
                "sequential": False
            })
        
        return phases
    
    def _group_by_resources(self, description: str, resource_requirements: List[ResourceRequirement]) -> List[Dict[str, Any]]:
        """Group task parts by resource requirements"""
        groups = []
        
        for resource in resource_requirements:
            groups.append({
                "resource_type": resource.resource_type.value,
                "resource": resource,
                "parts": [{
                    "description": f"Task involving {resource.resource_name}",
                    "priority": 5,
                    "estimated_duration": resource.estimated_duration or 30,
                    "complexity_score": 0.5,
                    "tags": [f"resource-{resource.resource_type.value}"]
                }]
            })
        
        return groups
    
    def _optimize_workstreams(self, workstreams: List[Workstream], request: DecompositionRequest) -> List[Workstream]:
        """
        Optimize workstreams for better parallel execution
        
        Args:
            workstreams: List of workstreams to optimize
            request: Original decomposition request
            
        Returns:
            Optimized list of workstreams
        """
        # Apply optimization based on goals
        for goal in request.optimization_goals:
            if goal == "speed":
                workstreams = self._optimize_for_speed(workstreams)
            elif goal == "resource_efficiency":
                workstreams = self._optimize_for_resource_efficiency(workstreams)
            elif goal == "quality":
                workstreams = self._optimize_for_quality(workstreams)
        
        # Balance work distribution
        workstreams = self._balance_work_distribution(workstreams)
        
        return workstreams
    
    def _optimize_for_speed(self, workstreams: List[Workstream]) -> List[Workstream]:
        """Optimize workstreams for maximum speed"""
        # Merge very short workstreams
        merged_workstreams = []
        current_merge = []
        
        for workstream in workstreams:
            if workstream.estimated_duration and workstream.estimated_duration < 10:
                current_merge.append(workstream)
            else:
                if current_merge:
                    merged_workstreams.append(self._merge_workstreams(current_merge))
                    current_merge = []
                merged_workstreams.append(workstream)
        
        if current_merge:
            merged_workstreams.append(self._merge_workstreams(current_merge))
        
        return merged_workstreams
    
    def _optimize_for_resource_efficiency(self, workstreams: List[Workstream]) -> List[Workstream]:
        """Optimize workstreams for resource efficiency"""
        # Group workstreams by resource requirements
        resource_groups = {}
        
        for workstream in workstreams:
            for resource in workstream.required_resources:
                if resource.resource_id not in resource_groups:
                    resource_groups[resource.resource_id] = []
                resource_groups[resource.resource_id].append(workstream)
        
        # Merge workstreams that use the same resources
        optimized_workstreams = []
        processed = set()
        
        for resource_id, group in resource_groups.items():
            if len(group) > 1 and not any(ws.id in processed for ws in group):
                optimized_workstreams.append(self._merge_workstreams(group))
                processed.update(ws.id for ws in group)
            elif len(group) == 1 and group[0].id not in processed:
                optimized_workstreams.append(group[0])
                processed.add(group[0].id)
        
        return optimized_workstreams
    
    def _optimize_for_quality(self, workstreams: List[Workstream]) -> List[Workstream]:
        """Optimize workstreams for quality"""
        # Split complex workstreams into smaller, more manageable pieces
        optimized_workstreams = []
        
        for workstream in workstreams:
            if workstream.complexity_score and workstream.complexity_score > 0.7:
                # Split complex workstreams
                split_workstreams = self._split_complex_workstream(workstream)
                optimized_workstreams.extend(split_workstreams)
            else:
                optimized_workstreams.append(workstream)
        
        return optimized_workstreams
    
    def _balance_work_distribution(self, workstreams: List[Workstream]) -> List[Workstream]:
        """Balance work distribution across workstreams"""
        # Calculate average duration
        durations = [ws.estimated_duration for ws in workstreams if ws.estimated_duration]
        if not durations:
            return workstreams
        
        avg_duration = sum(durations) / len(durations)
        
        # Adjust priorities based on duration
        for workstream in workstreams:
            if workstream.estimated_duration:
                if workstream.estimated_duration > avg_duration * 1.5:
                    workstream.priority = max(1, workstream.priority - 2)  # Higher priority for longer tasks
                elif workstream.estimated_duration < avg_duration * 0.5:
                    workstream.priority = min(10, workstream.priority + 1)  # Lower priority for shorter tasks
        
        return workstreams
    
    def _merge_workstreams(self, workstreams: List[Workstream]) -> Workstream:
        """Merge multiple workstreams into one"""
        if not workstreams:
            raise ValueError("Cannot merge empty list of workstreams")
        
        if len(workstreams) == 1:
            return workstreams[0]
        
        # Create merged workstream
        merged = Workstream(
            id=str(uuid.uuid4()),
            name=f"Merged: {', '.join(ws.name for ws in workstreams)}",
            description="\n".join(ws.description for ws in workstreams),
            original_task_id=workstreams[0].original_task_id,
            priority=min(ws.priority for ws in workstreams),
            estimated_duration=sum(ws.estimated_duration or 0 for ws in workstreams),
            complexity_score=max(ws.complexity_score or 0 for ws in workstreams),
            tags=list(set(tag for ws in workstreams for tag in ws.tags)) + ["merged"]
        )
        
        # Merge resource requirements
        all_resources = []
        for ws in workstreams:
            all_resources.extend(ws.required_resources)
        merged.required_resources = all_resources
        
        return merged
    
    def _split_complex_workstream(self, workstream: Workstream) -> List[Workstream]:
        """Split a complex workstream into smaller parts"""
        # Simple splitting based on description
        parts = workstream.description.split('.')
        split_workstreams = []
        
        for i, part in enumerate(parts):
            if part.strip():
                split_workstream = Workstream(
                    id=str(uuid.uuid4()),
                    name=f"{workstream.name} - Part {i+1}",
                    description=part.strip(),
                    original_task_id=workstream.original_task_id,
                    priority=workstream.priority,
                    estimated_duration=max(5, (workstream.estimated_duration or 30) // len(parts)),
                    complexity_score=(workstream.complexity_score or 0.5) * 0.7,  # Reduced complexity
                    tags=workstream.tags + [f"split-part-{i+1}"]
                )
                split_workstreams.append(split_workstream)
        
        return split_workstreams
    
    def _validate_decomposition(self, workstreams: List[Workstream]) -> List[str]:
        """Validate the decomposition result"""
        errors = []
        
        # Use dependency analyzer to validate
        errors.extend(self.dependency_analyzer.validate_workstream_dependencies(workstreams))
        
        # Additional validations
        for workstream in workstreams:
            if not workstream.name or not workstream.description:
                errors.append(f"Workstream {workstream.id} has missing name or description")
            
            if workstream.estimated_duration and workstream.estimated_duration <= 0:
                errors.append(f"Workstream {workstream.id} has invalid estimated duration")
        
        return errors
    
    def _calculate_decomposition_metrics(self, workstreams: List[Workstream]) -> DecompositionMetrics:
        """Calculate metrics for the decomposition"""
        if not workstreams:
            return DecompositionMetrics(
                total_workstreams=0,
                parallel_workstreams=0,
                sequential_workstreams=0,
                dependency_depth=0,
                resource_utilization=0.0,
                load_balance_score=0.0,
                complexity_distribution={}
            )
        
        # Calculate parallel vs sequential workstreams
        parallel_count = sum(1 for ws in workstreams if not ws.dependencies)
        sequential_count = len(workstreams) - parallel_count
        
        # Calculate dependency depth
        dependency_graph = self.dependency_analyzer.build_dependency_graph(workstreams)
        max_depth = self._calculate_max_dependency_depth(dependency_graph)
        
        # Calculate resource utilization
        resource_usage = {}
        for ws in workstreams:
            for resource in ws.required_resources:
                if resource.resource_id not in resource_usage:
                    resource_usage[resource.resource_id] = 0
                resource_usage[resource.resource_id] += 1
        
        avg_resource_usage = sum(resource_usage.values()) / len(resource_usage) if resource_usage else 0
        
        # Calculate load balance score
        durations = [ws.estimated_duration for ws in workstreams if ws.estimated_duration]
        if durations:
            avg_duration = sum(durations) / len(durations)
            variance = sum((d - avg_duration) ** 2 for d in durations) / len(durations)
            load_balance_score = max(0, 1 - (variance / (avg_duration ** 2)))
        else:
            load_balance_score = 0.0
        
        # Calculate complexity distribution
        complexity_distribution = {"low": 0, "medium": 0, "high": 0}
        for ws in workstreams:
            if ws.complexity_score:
                if ws.complexity_score < 0.3:
                    complexity_distribution["low"] += 1
                elif ws.complexity_score < 0.7:
                    complexity_distribution["medium"] += 1
                else:
                    complexity_distribution["high"] += 1
        
        return DecompositionMetrics(
            total_workstreams=len(workstreams),
            parallel_workstreams=parallel_count,
            sequential_workstreams=sequential_count,
            dependency_depth=max_depth,
            resource_utilization=min(1.0, avg_resource_usage / 3),  # Normalize to 0-1
            load_balance_score=load_balance_score,
            complexity_distribution=complexity_distribution
        )
    
    def _calculate_max_dependency_depth(self, dependency_graph: Dict[str, List[str]]) -> int:
        """Calculate maximum dependency depth using DFS"""
        def dfs(node: str, depth: int, visited: set) -> int:
            if node in visited:
                return depth
            
            visited.add(node)
            max_depth = depth
            
            for dependent in dependency_graph.get(node, []):
                max_depth = max(max_depth, dfs(dependent, depth + 1, visited))
            
            return max_depth
        
        max_depth = 0
        for node in dependency_graph:
            max_depth = max(max_depth, dfs(node, 0, set()))
        
        return max_depth
    
    def _build_decomposition_result(
        self, 
        request: DecompositionRequest, 
        workstreams: List[Workstream], 
        analysis: Dict[str, Any],
        metrics: DecompositionMetrics,
        validation_errors: List[str]
    ) -> TaskDecompositionResult:
        """Build the final decomposition result"""
        # Calculate efficiency metrics
        total_sequential_duration = sum(ws.estimated_duration or 0 for ws in workstreams)
        parallel_groups = self.dependency_analyzer.find_parallel_groups(workstreams)
        
        # Estimate parallel execution duration
        parallel_duration = 0
        for group in parallel_groups:
            group_duration = max(
                next(ws.estimated_duration or 0 for ws in workstreams if ws.id == ws_id)
                for ws_id in group
            )
            parallel_duration += group_duration
        
        efficiency_gain = 0
        if total_sequential_duration > 0:
            efficiency_gain = ((total_sequential_duration - parallel_duration) / total_sequential_duration) * 100
        
        # Build dependency graph
        dependency_graph = self.dependency_analyzer.build_dependency_graph(workstreams)
        
        # Detect resource conflicts
        resource_conflicts = self.dependency_analyzer.detect_resource_conflicts(workstreams)
        
        # Calculate quality score
        quality_score = self._calculate_quality_score(metrics, validation_errors, efficiency_gain)
        
        return TaskDecompositionResult(
            original_task_id=request.task_id,
            workstreams=workstreams,
            total_estimated_duration=total_sequential_duration,
            parallel_execution_duration=parallel_duration,
            efficiency_gain=efficiency_gain,
            dependency_graph=dependency_graph,
            resource_conflicts=resource_conflicts,
            decomposition_quality_score=quality_score
        )
    
    def _calculate_quality_score(
        self, 
        metrics: DecompositionMetrics, 
        validation_errors: List[str], 
        efficiency_gain: float
    ) -> float:
        """Calculate overall quality score for the decomposition"""
        # Base score starts at 1.0
        score = 1.0
        
        # Penalize validation errors
        score -= len(validation_errors) * 0.1
        
        # Reward good metrics
        if metrics.parallel_workstreams > 0:
            score += min(0.2, metrics.parallel_workstreams / 10)
        
        if efficiency_gain > 0:
            score += min(0.3, efficiency_gain / 100)
        
        if metrics.load_balance_score > 0.7:
            score += 0.1
        
        # Penalize high dependency depth
        if metrics.dependency_depth > 5:
            score -= 0.2
        
        return max(0.0, min(1.0, score))
