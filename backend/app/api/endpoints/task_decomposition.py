"""
Task decomposition API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from ...services.TaskDecomposer import TaskDecomposer
from ...models.Workstream import (
    DecompositionRequest, TaskDecompositionResult, 
    DecompositionMetrics, Workstream
)

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize service
task_decomposer = TaskDecomposer()


@router.post("/decompose", response_model=TaskDecompositionResult)
async def decompose_task(request: DecompositionRequest) -> TaskDecompositionResult:
    """
    Decompose a complex task into parallel workstreams
    
    This endpoint analyzes a complex task and breaks it down into smaller,
    parallel workstreams that can be executed concurrently for better efficiency.
    
    Args:
        request: DecompositionRequest containing task details and constraints
        
    Returns:
        TaskDecompositionResult with decomposed workstreams and metrics
        
    Raises:
        HTTPException: If decomposition fails or validation errors occur
    """
    try:
        logger.info(f"Received decomposition request for task: {request.task_id}")
        
        # Validate request
        validation_errors = _validate_decomposition_request(request)
        if validation_errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid decomposition request",
                    "errors": validation_errors
                }
            )
        
        # Perform decomposition
        result = task_decomposer.decompose_task(request)
        
        logger.info(f"Successfully decomposed task {request.task_id} into {len(result.workstreams)} workstreams")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during task decomposition: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during task decomposition",
                "error": str(e)
            }
        )


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_task(request: DecompositionRequest) -> Dict[str, Any]:
    """
    Analyze a task without decomposing it
    
    This endpoint provides analysis of a task including complexity score,
    dependency patterns, and resource requirements without creating workstreams.
    
    Args:
        request: DecompositionRequest containing task details
        
    Returns:
        Analysis results including complexity, dependencies, and recommendations
    """
    try:
        logger.info(f"Analyzing task: {request.task_id}")
        
        # Perform analysis only
        analysis = task_decomposer._analyze_task(request)
        
        # Add recommendations
        recommendations = _generate_recommendations(analysis, request)
        
        result = {
            "task_id": request.task_id,
            "analysis": analysis,
            "recommendations": recommendations,
            "algorithm_version": task_decomposer.algorithm_version
        }
        
        logger.info(f"Task analysis completed for: {request.task_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error during task analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during task analysis",
                "error": str(e)
            }
        )


@router.get("/strategies", response_model=List[Dict[str, Any]])
async def get_decomposition_strategies() -> List[Dict[str, Any]]:
    """
    Get available decomposition strategies
    
    Returns:
        List of available decomposition strategies with descriptions
    """
    strategies = [
        {
            "id": "sequential",
            "name": "Sequential Decomposition",
            "description": "Break down task into sequential parts that must be completed in order",
            "best_for": ["Simple tasks", "Tasks with clear dependencies", "Low complexity tasks"],
            "characteristics": ["Linear execution", "Clear dependencies", "Easy to understand"]
        },
        {
            "id": "parallel",
            "name": "Parallel Decomposition", 
            "description": "Break down task into independent parts that can run simultaneously",
            "best_for": ["Complex tasks", "Tasks with independent components", "High complexity tasks"],
            "characteristics": ["Concurrent execution", "Independent workstreams", "Maximum efficiency"]
        },
        {
            "id": "hybrid",
            "name": "Hybrid Decomposition",
            "description": "Mix of parallel and sequential decomposition based on task phases",
            "best_for": ["Multi-phase tasks", "Tasks with mixed dependencies", "Medium complexity tasks"],
            "characteristics": ["Phase-based execution", "Mixed dependencies", "Balanced approach"]
        },
        {
            "id": "resource_optimized",
            "name": "Resource-Optimized Decomposition",
            "description": "Optimize decomposition based on resource requirements and constraints",
            "best_for": ["Resource-intensive tasks", "Tasks with resource conflicts", "Constrained environments"],
            "characteristics": ["Resource-aware", "Conflict resolution", "Efficient resource usage"]
        }
    ]
    
    return strategies


@router.post("/validate", response_model=Dict[str, Any])
async def validate_workstreams(workstreams: List[Workstream]) -> Dict[str, Any]:
    """
    Validate a list of workstreams for correctness and efficiency
    
    Args:
        workstreams: List of workstreams to validate
        
    Returns:
        Validation results including errors, warnings, and suggestions
    """
    try:
        logger.info(f"Validating {len(workstreams)} workstreams")
        
        # Perform validation
        validation_errors = task_decomposer._validate_decomposition(workstreams)
        
        # Calculate metrics
        metrics = task_decomposer._calculate_decomposition_metrics(workstreams)
        
        # Generate suggestions
        suggestions = _generate_validation_suggestions(workstreams, validation_errors, metrics)
        
        result = {
            "is_valid": len(validation_errors) == 0,
            "errors": validation_errors,
            "warnings": _generate_warnings(workstreams, metrics),
            "suggestions": suggestions,
            "metrics": metrics,
            "workstream_count": len(workstreams)
        }
        
        logger.info(f"Validation completed. Valid: {result['is_valid']}, Errors: {len(validation_errors)}")
        return result
        
    except Exception as e:
        logger.error(f"Error during workstream validation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during validation",
                "error": str(e)
            }
        )


@router.get("/health", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Health check for task decomposition service
    
    Returns:
        Service health status and version information
    """
    return {
        "service": "task-decomposition",
        "status": "healthy",
        "version": task_decomposer.algorithm_version,
        "strategies_available": len(task_decomposer.decomposition_strategies),
        "dependency_analyzer": "available"
    }


def _validate_decomposition_request(request: DecompositionRequest) -> List[str]:
    """Validate decomposition request"""
    errors = []
    
    if not request.task_id:
        errors.append("task_id is required")
    
    if not request.task_name:
        errors.append("task_name is required")
    
    if not request.task_description:
        errors.append("task_description is required")
    
    if request.task_complexity is not None and (request.task_complexity < 0 or request.task_complexity > 1):
        errors.append("task_complexity must be between 0.0 and 1.0")
    
    if request.max_parallel_workstreams is not None and request.max_parallel_workstreams <= 0:
        errors.append("max_parallel_workstreams must be positive")
    
    if request.max_duration is not None and request.max_duration <= 0:
        errors.append("max_duration must be positive")
    
    return errors


def _generate_recommendations(analysis: Dict[str, Any], request: DecompositionRequest) -> List[Dict[str, Any]]:
    """Generate recommendations based on analysis"""
    recommendations = []
    
    complexity = analysis.get("complexity_score", 0.5)
    dependency_patterns = analysis.get("dependency_patterns", [])
    resource_requirements = analysis.get("resource_requirements", [])
    
    # Complexity-based recommendations
    if complexity > 0.8:
        recommendations.append({
            "type": "complexity",
            "priority": "high",
            "message": "Task is very complex. Consider breaking it down into smaller subtasks.",
            "suggestion": "Use hybrid or parallel decomposition strategy"
        })
    elif complexity < 0.2:
        recommendations.append({
            "type": "complexity", 
            "priority": "low",
            "message": "Task is simple. Sequential decomposition may be most appropriate.",
            "suggestion": "Use sequential decomposition strategy"
        })
    
    # Dependency-based recommendations
    if any(p.pattern_type.value == "sequential_dependency" for p in dependency_patterns):
        recommendations.append({
            "type": "dependency",
            "priority": "medium",
            "message": "Sequential dependencies detected. Consider phase-based decomposition.",
            "suggestion": "Use hybrid decomposition with clear phases"
        })
    
    if any(p.pattern_type.value == "parallel_opportunity" for p in dependency_patterns):
        recommendations.append({
            "type": "dependency",
            "priority": "high",
            "message": "Parallel execution opportunities detected.",
            "suggestion": "Use parallel decomposition strategy for maximum efficiency"
        })
    
    # Resource-based recommendations
    if len(resource_requirements) > 3:
        recommendations.append({
            "type": "resource",
            "priority": "high",
            "message": "Multiple resource requirements detected. Resource conflicts possible.",
            "suggestion": "Use resource-optimized decomposition strategy"
        })
    
    # Optimization recommendations
    if request.optimization_goals:
        for goal in request.optimization_goals:
            if goal == "speed":
                recommendations.append({
                    "type": "optimization",
                    "priority": "medium",
                    "message": "Speed optimization requested.",
                    "suggestion": "Consider merging short workstreams and maximizing parallel execution"
                })
            elif goal == "resource_efficiency":
                recommendations.append({
                    "type": "optimization",
                    "priority": "medium", 
                    "message": "Resource efficiency optimization requested.",
                    "suggestion": "Group workstreams by resource requirements and minimize conflicts"
                })
    
    return recommendations


def _generate_validation_suggestions(workstreams: List[Workstream], errors: List[str], metrics: DecompositionMetrics) -> List[str]:
    """Generate suggestions for improving workstreams"""
    suggestions = []
    
    # Based on errors
    if any("circular dependency" in error.lower() for error in errors):
        suggestions.append("Review dependency relationships to eliminate circular dependencies")
    
    if any("non-existent workstream" in error.lower() for error in errors):
        suggestions.append("Ensure all referenced workstreams exist in the decomposition")
    
    # Based on metrics
    if metrics.dependency_depth > 5:
        suggestions.append("Consider flattening the dependency structure to reduce complexity")
    
    if metrics.load_balance_score < 0.5:
        suggestions.append("Work distribution is uneven. Consider redistributing work for better balance")
    
    if metrics.parallel_workstreams == 0:
        suggestions.append("No parallel workstreams detected. Consider identifying independent tasks")
    
    if metrics.resource_utilization > 0.8:
        suggestions.append("High resource utilization detected. Consider resource optimization")
    
    # Based on workstream characteristics
    short_workstreams = [ws for ws in workstreams if ws.estimated_duration and ws.estimated_duration < 5]
    if len(short_workstreams) > len(workstreams) * 0.3:
        suggestions.append("Many very short workstreams detected. Consider merging for efficiency")
    
    complex_workstreams = [ws for ws in workstreams if ws.complexity_score and ws.complexity_score > 0.8]
    if len(complex_workstreams) > len(workstreams) * 0.2:
        suggestions.append("Many complex workstreams detected. Consider further decomposition")
    
    return suggestions


def _generate_warnings(workstreams: List[Workstream], metrics: DecompositionMetrics) -> List[str]:
    """Generate warnings about potential issues"""
    warnings = []
    
    if metrics.dependency_depth > 8:
        warnings.append("Very deep dependency chain detected. This may cause scheduling issues")
    
    if metrics.load_balance_score < 0.3:
        warnings.append("Poor work distribution detected. Some workstreams may be overloaded")
    
    if metrics.resource_utilization > 0.9:
        warnings.append("Very high resource utilization. Resource conflicts likely")
    
    # Check for potential issues
    for workstream in workstreams:
        if workstream.estimated_duration and workstream.estimated_duration > 120:
            warnings.append(f"Workstream '{workstream.name}' has very long estimated duration")
        
        if workstream.complexity_score and workstream.complexity_score > 0.9:
            warnings.append(f"Workstream '{workstream.name}' is very complex")
    
    return warnings
