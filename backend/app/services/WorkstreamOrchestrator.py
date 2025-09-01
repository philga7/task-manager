"""
WorkstreamOrchestrator service for managing parallel workstream execution
"""
import uuid
import logging
import asyncio
from typing import List, Dict, Optional, Tuple, Any, Callable
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

from ..models.Workstream import (
    Workstream, WorkstreamStatus, WorkstreamDependency, 
    DependencyType, ResourceRequirement, ResourceType
)
from ..models.Orchestration import (
    OrchestrationState, OrchestrationStatus, ExecutionPhase,
    OrchestrationConfig, OrchestrationMetrics, OrchestrationResult,
    OrchestrationRequest, ExecutionContext, ResourceAllocation,
    ResourceAllocationStatus, ExecutionEvent, ResourceConflict
)
from ..utils.scheduler import WorkstreamScheduler, ResourceManager, ConflictResolver
from .WorktreeManager import WorktreeManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WorkstreamOrchestrator:
    """
    Orchestrates the execution of parallel workstreams with resource management,
    conflict resolution, and completion detection
    """
    
    def __init__(self, repo_path: str = None):
        self.scheduler = WorkstreamScheduler()
        self.resource_manager = ResourceManager()
        self.conflict_resolver = ConflictResolver()
        
        # Git worktree management
        self.worktree_manager = WorktreeManager(repo_path)
        
        # Active orchestrations
        self.active_orchestrations: Dict[str, OrchestrationState] = {}
        
        # Execution callbacks
        self.execution_callbacks: Dict[str, Callable] = {}
        
        # Monitoring
        self.monitoring_thread = None
        self.stop_monitoring = threading.Event()
        
        # Thread pool for parallel execution
        self.executor = ThreadPoolExecutor(max_workers=10)
        
        logger.info("WorkstreamOrchestrator initialized with Git worktree support")
    
    def start_orchestration(self, request: OrchestrationRequest) -> OrchestrationState:
        """
        Start orchestrating the execution of workstreams
        
        Args:
            request: OrchestrationRequest containing workstreams and configuration
            
        Returns:
            OrchestrationState representing the current state
        """
        logger.info(f"Starting orchestration for {len(request.workstreams)} workstreams")
        
        try:
            # Step 1: Create orchestration state
            orchestration_id = str(uuid.uuid4())
            config = request.config or OrchestrationConfig()
            
            # Apply priority overrides if provided
            if request.priority_override:
                for workstream in request.workstreams:
                    if workstream.id in request.priority_override:
                        workstream.priority = request.priority_override[workstream.id]
            
            # Step 2: Initialize orchestration state
            orchestration_state = OrchestrationState(
                orchestration_id=orchestration_id,
                status=OrchestrationStatus.INITIALIZING,
                workstreams=request.workstreams,
                config=config,
                start_time=datetime.now()
            )
            
            # Step 3: Build execution plan
            execution_plan = self.scheduler.build_execution_plan(request.workstreams)
            
            # Step 4: Initialize execution contexts
            for workstream in request.workstreams:
                orchestration_state.execution_contexts[workstream.id] = ExecutionContext(
                    workstream_id=workstream.id,
                    max_retries=config.max_retries_per_workstream
                )
            
            # Step 5: Store orchestration state
            self.active_orchestrations[orchestration_id] = orchestration_state
            
            # Step 6: Start execution in background
            self._start_execution(orchestration_id, execution_plan)
            
            logger.info(f"Orchestration {orchestration_id} started successfully")
            return orchestration_state
            
        except Exception as e:
            logger.error(f"Error starting orchestration: {str(e)}")
            raise
    
    def get_orchestration_status(self, orchestration_id: str) -> Optional[OrchestrationState]:
        """
        Get the current status of an orchestration
        
        Args:
            orchestration_id: ID of the orchestration
            
        Returns:
            OrchestrationState or None if not found
        """
        return self.active_orchestrations.get(orchestration_id)
    
    def pause_orchestration(self, orchestration_id: str) -> bool:
        """
        Pause an active orchestration
        
        Args:
            orchestration_id: ID of the orchestration to pause
            
        Returns:
            True if paused successfully, False otherwise
        """
        if orchestration_id not in self.active_orchestrations:
            return False
        
        orchestration = self.active_orchestrations[orchestration_id]
        if orchestration.status in [OrchestrationStatus.EXECUTING, OrchestrationStatus.SCHEDULING]:
            orchestration.status = OrchestrationStatus.PAUSED
            logger.info(f"Orchestration {orchestration_id} paused")
            return True
        
        return False
    
    def resume_orchestration(self, orchestration_id: str) -> bool:
        """
        Resume a paused orchestration
        
        Args:
            orchestration_id: ID of the orchestration to resume
            
        Returns:
            True if resumed successfully, False otherwise
        """
        if orchestration_id not in self.active_orchestrations:
            return False
        
        orchestration = self.active_orchestrations[orchestration_id]
        if orchestration.status == OrchestrationStatus.PAUSED:
            orchestration.status = OrchestrationStatus.EXECUTING
            logger.info(f"Orchestration {orchestration_id} resumed")
            return True
        
        return False
    
    def stop_orchestration(self, orchestration_id: str) -> bool:
        """
        Stop an orchestration and clean up resources
        
        Args:
            orchestration_id: ID of the orchestration to stop
            
        Returns:
            True if stopped successfully, False otherwise
        """
        if orchestration_id not in self.active_orchestrations:
            return False
        
        orchestration = self.active_orchestrations[orchestration_id]
        orchestration.status = OrchestrationStatus.FAILED
        orchestration.completion_time = datetime.now()
        
        # Release all allocated resources
        self._release_all_resources(orchestration_id)
        
        logger.info(f"Orchestration {orchestration_id} stopped")
        return True
    
    def register_execution_callback(self, orchestration_id: str, callback: Callable) -> None:
        """
        Register a callback to be called when workstreams complete
        
        Args:
            orchestration_id: ID of the orchestration
            callback: Function to call with workstream updates
        """
        self.execution_callbacks[orchestration_id] = callback
    
    def _start_execution(self, orchestration_id: str, execution_plan: Dict[str, Any]) -> None:
        """Start the execution of workstreams in a background thread"""
        def execute():
            try:
                self._execute_orchestration(orchestration_id, execution_plan)
            except Exception as e:
                logger.error(f"Error in orchestration execution: {str(e)}")
                self._handle_orchestration_error(orchestration_id, str(e))
        
        # Start execution in background thread
        execution_thread = threading.Thread(target=execute, daemon=True)
        execution_thread.start()
    
    def _execute_orchestration(self, orchestration_id: str, execution_plan: Dict[str, Any]) -> None:
        """Execute the orchestration according to the execution plan"""
        orchestration = self.active_orchestrations[orchestration_id]
        orchestration.status = OrchestrationStatus.SCHEDULING
        
        try:
            execution_order = execution_plan["execution_order"]
            resource_conflicts = execution_plan["resource_conflicts"]
            
            # Resolve resource conflicts
            self._resolve_conflicts(orchestration, resource_conflicts)
            
            # Start execution
            orchestration.status = OrchestrationStatus.EXECUTING
            self._execute_workstreams(orchestration, execution_order)
            
            # Wait for completion
            self._wait_for_completion(orchestration)
            
            # Finalize orchestration
            self._finalize_orchestration(orchestration)
            
        except Exception as e:
            logger.error(f"Error during orchestration execution: {str(e)}")
            self._handle_orchestration_error(orchestration_id, str(e))
    
    def _resolve_conflicts(self, orchestration: OrchestrationState, 
                          conflicts: List[ResourceConflict]) -> None:
        """Resolve resource conflicts before execution"""
        for conflict in conflicts:
            resolution = self.conflict_resolver.resolve_conflict(conflict, orchestration.workstreams)
            
            if resolution["selected_workstream_id"]:
                # Mark other workstreams as blocked
                for workstream_id in conflict.conflicting_workstreams:
                    if workstream_id != resolution["selected_workstream_id"]:
                        workstream = next((ws for ws in orchestration.workstreams if ws.id == workstream_id), None)
                        if workstream:
                            workstream.status = WorkstreamStatus.BLOCKED
                            orchestration.warnings.append(
                                f"Workstream {workstream_id} blocked due to resource conflict: {resolution['reasoning']}"
                            )
                
                logger.info(f"Resource conflict resolved: {resolution['reasoning']}")
    
    def _execute_workstreams(self, orchestration: OrchestrationState, 
                           execution_order: List[str]) -> None:
        """Execute workstreams according to the execution order"""
        workstream_map = {ws.id: ws for ws in orchestration.workstreams}
        
        # Track running workstreams
        running_workstreams = set()
        completed_workstreams = set()
        failed_workstreams = set()
        
        for workstream_id in execution_order:
            workstream = workstream_map[workstream_id]
            
            # Check if workstream can start (dependencies completed)
            if not self._can_start_workstream(workstream, completed_workstreams):
                continue
            
            # Check resource availability
            if not self._allocate_resources(workstream, orchestration):
                continue
            
            # Start workstream execution
            self._start_workstream_execution(workstream, orchestration)
            running_workstreams.add(workstream_id)
            
            # Check if we've reached the concurrent limit
            if len(running_workstreams) >= orchestration.config.max_concurrent_workstreams:
                # Wait for some workstreams to complete
                self._wait_for_workstream_completion(orchestration, running_workstreams, completed_workstreams, failed_workstreams)
        
        # Wait for remaining workstreams to complete
        while running_workstreams:
            self._wait_for_workstream_completion(orchestration, running_workstreams, completed_workstreams, failed_workstreams)
    
    def _can_start_workstream(self, workstream: Workstream, 
                            completed_workstreams: set) -> bool:
        """Check if a workstream can start based on its dependencies"""
        for dependency in workstream.dependencies:
            if dependency.target_workstream_id not in completed_workstreams:
                return False
        return True
    
    def _allocate_resources(self, workstream: Workstream, 
                          orchestration: OrchestrationState) -> bool:
        """Allocate required resources for a workstream"""
        for resource_req in workstream.required_resources:
            success = self.resource_manager.allocate_resource(
                resource_id=resource_req.resource_id,
                workstream_id=workstream.id,
                resource_type=resource_req.resource_type,
                resource_name=resource_req.resource_name,
                is_exclusive=resource_req.is_exclusive
            )
            
            if not success:
                # Release any already allocated resources
                self._release_workstream_resources(workstream.id, orchestration)
                return False
            
            # Record allocation in orchestration state
            allocation = ResourceAllocation(
                resource_id=resource_req.resource_id,
                resource_type=resource_req.resource_type,
                resource_name=resource_req.resource_name,
                workstream_id=workstream.id,
                allocation_time=datetime.now(),
                is_exclusive=resource_req.is_exclusive
            )
            orchestration.resource_allocations[resource_req.resource_id] = allocation
        
        return True
    
    def _start_workstream_execution(self, workstream: Workstream, 
                                  orchestration: OrchestrationState) -> None:
        """Start the execution of a workstream"""
        # Update workstream status
        workstream.status = WorkstreamStatus.IN_PROGRESS
        workstream.start_time = datetime.now()
        
        # Update execution context
        context = orchestration.execution_contexts[workstream.id]
        context.phase = ExecutionPhase.STARTING
        context.start_time = datetime.now()
        
        # Create Git worktree for this workstream
        if workstream.assigned_agent_id:
            worktree_path = self.worktree_manager.create_worktree_for_workstream(
                workstream, workstream.assigned_agent_id
            )
            if worktree_path:
                context.metadata = {"worktree_path": worktree_path}
                logger.info(f"Created worktree for workstream {workstream.id} at {worktree_path}")
            else:
                logger.warning(f"Failed to create worktree for workstream {workstream.id}")
        
        # Submit workstream for execution
        future = self.executor.submit(self._execute_single_workstream, workstream, orchestration)
        
        # Store future for monitoring
        if "metadata" not in context.__dict__:
            context.metadata = {}
        context.metadata["future"] = future
        
        logger.info(f"Started execution of workstream {workstream.id}")
    
    def _execute_single_workstream(self, workstream: Workstream, 
                                 orchestration: OrchestrationState) -> Dict[str, Any]:
        """Execute a single workstream (placeholder for actual execution logic)"""
        try:
            # Update execution context
            context = orchestration.execution_contexts[workstream.id]
            context.phase = ExecutionPhase.RUNNING
            
            # Simulate workstream execution
            # In a real implementation, this would call the actual workstream execution logic
            execution_time = workstream.estimated_duration or 1  # Default to 1 minute
            time.sleep(execution_time * 60)  # Convert minutes to seconds
            
            # Handle Git worktree operations for completed workstream
            context.phase = ExecutionPhase.COMPLETING
            
            # Commit changes in worktree if it exists
            if hasattr(context, 'metadata') and context.metadata.get('worktree_path'):
                commit_success = self.worktree_manager.commit_worktree_changes(
                    workstream.id, 
                    f"Complete workstream {workstream.id} by agent {workstream.assigned_agent_id}"
                )
                if commit_success:
                    logger.info(f"Committed changes for workstream {workstream.id}")
                else:
                    logger.warning(f"Failed to commit changes for workstream {workstream.id}")
                
                # Merge worktree to main branch
                merge_success = self.worktree_manager.merge_worktree_to_main(workstream.id)
                if merge_success:
                    logger.info(f"Merged worktree for workstream {workstream.id} to main")
                else:
                    logger.warning(f"Failed to merge worktree for workstream {workstream.id}")
                
                # Clean up worktree
                cleanup_success = self.worktree_manager.cleanup_worktree(workstream.id)
                if cleanup_success:
                    logger.info(f"Cleaned up worktree for workstream {workstream.id}")
                else:
                    logger.warning(f"Failed to cleanup worktree for workstream {workstream.id}")
            
            # Update workstream status
            workstream.status = WorkstreamStatus.COMPLETED
            workstream.completion_time = datetime.now()
            
            # Calculate actual duration
            if workstream.start_time and workstream.completion_time:
                duration = (workstream.completion_time - workstream.start_time).total_seconds() / 60
                workstream.actual_duration = duration
            
            context.phase = ExecutionPhase.COMPLETED
            context.completion_time = datetime.now()
            
            logger.info(f"Workstream {workstream.id} completed successfully")
            
            return {
                "status": "completed",
                "workstream_id": workstream.id,
                "duration": workstream.actual_duration
            }
            
        except Exception as e:
            # Handle execution failure
            context = orchestration.execution_contexts[workstream.id]
            context.phase = ExecutionPhase.FAILED
            context.error_message = str(e)
            
            workstream.status = WorkstreamStatus.FAILED
            
            logger.error(f"Workstream {workstream.id} failed: {str(e)}")
            
            return {
                "status": "failed",
                "workstream_id": workstream.id,
                "error": str(e)
            }
    
    def _wait_for_workstream_completion(self, orchestration: OrchestrationState,
                                      running_workstreams: set, 
                                      completed_workstreams: set,
                                      failed_workstreams: set) -> None:
        """Wait for at least one workstream to complete"""
        workstream_map = {ws.id: ws for ws in orchestration.workstreams}
        
        # Check completed workstreams
        completed_ids = set()
        failed_ids = set()
        
        for workstream_id in list(running_workstreams):
            workstream = workstream_map[workstream_id]
            context = orchestration.execution_contexts[workstream_id]
            
            # Check if future is done
            if "future" in context.metadata:
                future = context.metadata["future"]
                if future.done():
                    try:
                        result = future.result(timeout=0)  # Non-blocking check
                        if result.get("status") == "completed":
                            context.phase = ExecutionPhase.COMPLETED
                            workstream.status = WorkstreamStatus.COMPLETED
                            workstream.completion_time = datetime.now()
                            if workstream.start_time and workstream.completion_time:
                                duration = (workstream.completion_time - workstream.start_time).total_seconds() / 60
                                workstream.actual_duration = duration
                        else:
                            context.phase = ExecutionPhase.FAILED
                            workstream.status = WorkstreamStatus.FAILED
                            context.error_message = result.get("error", "Unknown error")
                    except Exception as e:
                        context.phase = ExecutionPhase.FAILED
                        workstream.status = WorkstreamStatus.FAILED
                        context.error_message = str(e)
            
            # Check final status
            if context.phase in [ExecutionPhase.COMPLETED, ExecutionPhase.FAILED]:
                # Release resources
                self._release_workstream_resources(workstream_id, orchestration)
                
                if context.phase == ExecutionPhase.COMPLETED:
                    completed_ids.add(workstream_id)
                    completed_workstreams.add(workstream_id)
                else:
                    failed_ids.add(workstream_id)
                    failed_workstreams.add(workstream_id)
                
                running_workstreams.remove(workstream_id)
        
        # Only update metrics and call callback if there were actual changes
        if completed_ids or failed_ids:
            # Update metrics
            self._update_orchestration_metrics(orchestration)
            
            # Call execution callback if registered
            if orchestration.orchestration_id in self.execution_callbacks:
                callback = self.execution_callbacks[orchestration.orchestration_id]
                try:
                    callback({
                        "completed": list(completed_ids),
                        "failed": list(failed_ids),
                        "orchestration_id": orchestration.orchestration_id
                    })
                except Exception as e:
                    logger.error(f"Error in execution callback: {str(e)}")
            
            # Check for rollback conditions
            if orchestration.config.enable_auto_rollback:
                self._check_rollback_conditions(orchestration, failed_workstreams)
    
    def _release_workstream_resources(self, workstream_id: str, 
                                    orchestration: OrchestrationState) -> None:
        """Release all resources allocated to a workstream"""
        resources_to_release = []
        
        for resource_id, allocation in orchestration.resource_allocations.items():
            if allocation.workstream_id == workstream_id:
                resources_to_release.append(resource_id)
        
        for resource_id in resources_to_release:
            self.resource_manager.release_resource(resource_id, workstream_id)
            del orchestration.resource_allocations[resource_id]
    
    def _release_all_resources(self, orchestration_id: str) -> None:
        """Release all resources for an orchestration"""
        if orchestration_id not in self.active_orchestrations:
            return
        
        orchestration = self.active_orchestrations[orchestration_id]
        
        for resource_id, allocation in list(orchestration.resource_allocations.items()):
            self.resource_manager.release_resource(resource_id, allocation.workstream_id)
            del orchestration.resource_allocations[resource_id]
    
    def _update_orchestration_metrics(self, orchestration: OrchestrationState) -> None:
        """Update orchestration metrics based on current state"""
        total = len(orchestration.workstreams)
        completed = len([ws for ws in orchestration.workstreams if ws.status == WorkstreamStatus.COMPLETED])
        failed = len([ws for ws in orchestration.workstreams if ws.status == WorkstreamStatus.FAILED])
        in_progress = len([ws for ws in orchestration.workstreams if ws.status == WorkstreamStatus.IN_PROGRESS])
        blocked = len([ws for ws in orchestration.workstreams if ws.status == WorkstreamStatus.BLOCKED])
        
        orchestration.metrics = OrchestrationMetrics(
            total_workstreams=total,
            completed_workstreams=completed,
            failed_workstreams=failed,
            in_progress_workstreams=in_progress,
            blocked_workstreams=blocked,
            retry_rate=0.0,  # TODO: Calculate actual retry rate
            rollback_count=0  # TODO: Track rollback count
        )
        
        # Calculate timing metrics
        if orchestration.start_time:
            total_time = (datetime.now() - orchestration.start_time).total_seconds() / 60
            orchestration.metrics.total_execution_time = total_time
    
    def _check_rollback_conditions(self, orchestration: OrchestrationState, 
                                 failed_workstreams: set) -> None:
        """Check if rollback conditions are met"""
        total_workstreams = len(orchestration.workstreams)
        failed_count = len(failed_workstreams)
        
        failure_rate = failed_count / total_workstreams if total_workstreams > 0 else 0
        
        if failure_rate >= orchestration.config.rollback_threshold:
            logger.warning(f"Rollback threshold exceeded: {failure_rate:.2%} failures")
            self._initiate_rollback(orchestration)
    
    def _initiate_rollback(self, orchestration: OrchestrationState) -> None:
        """Initiate rollback of the orchestration"""
        orchestration.status = OrchestrationStatus.ROLLING_BACK
        orchestration.metrics.rollback_count += 1
        
        # Stop all running workstreams
        for workstream in orchestration.workstreams:
            if workstream.status == WorkstreamStatus.IN_PROGRESS:
                workstream.status = WorkstreamStatus.FAILED
                context = orchestration.execution_contexts[workstream.id]
                context.phase = ExecutionPhase.ROLLED_BACK
        
        # Release all resources
        self._release_all_resources(orchestration.orchestration_id)
        
        logger.info(f"Rollback completed for orchestration {orchestration.orchestration_id}")
    
    def _wait_for_completion(self, orchestration: OrchestrationState) -> None:
        """Wait for all workstreams to complete"""
        max_wait_time = 300  # 5 minutes maximum wait time
        start_time = time.time()
        
        while True:
            # Check if all workstreams are completed or failed
            active_workstreams = [
                ws for ws in orchestration.workstreams 
                if ws.status in [WorkstreamStatus.PENDING, WorkstreamStatus.IN_PROGRESS]
            ]
            
            if not active_workstreams:
                logger.info("All workstreams completed or failed")
                break
            
            # Check for timeout
            if time.time() - start_time > max_wait_time:
                logger.warning(f"Timeout waiting for workstream completion after {max_wait_time} seconds")
                # Mark remaining workstreams as failed
                for workstream in active_workstreams:
                    workstream.status = WorkstreamStatus.FAILED
                    context = orchestration.execution_contexts[workstream.id]
                    context.phase = ExecutionPhase.FAILED
                    context.error_message = "Timeout waiting for completion"
                break
            
            time.sleep(2)  # Wait 2 seconds before checking again
    
    def _finalize_orchestration(self, orchestration: OrchestrationState) -> None:
        """Finalize the orchestration and calculate final metrics"""
        # Determine final status
        failed_count = len([ws for ws in orchestration.workstreams if ws.status == WorkstreamStatus.FAILED])
        total_count = len(orchestration.workstreams)
        
        if failed_count == 0:
            orchestration.status = OrchestrationStatus.COMPLETED
        elif failed_count == total_count:
            orchestration.status = OrchestrationStatus.FAILED
        else:
            orchestration.status = OrchestrationStatus.COMPLETED  # Partial success
        
        orchestration.completion_time = datetime.now()
        
        # Calculate final metrics
        self._update_orchestration_metrics(orchestration)
        
        # Calculate efficiency metrics
        if orchestration.metrics.total_execution_time:
            orchestration.metrics.throughput_rate = (
                orchestration.metrics.completed_workstreams / 
                orchestration.metrics.total_execution_time
            )
        
        logger.info(f"Orchestration {orchestration.orchestration_id} finalized with status: {orchestration.status}")
    
    def _handle_orchestration_error(self, orchestration_id: str, error_message: str) -> None:
        """Handle errors during orchestration execution"""
        if orchestration_id not in self.active_orchestrations:
            return
        
        orchestration = self.active_orchestrations[orchestration_id]
        orchestration.status = OrchestrationStatus.FAILED
        orchestration.errors.append(error_message)
        orchestration.completion_time = datetime.now()
        
        # Clean up worktrees for all workstreams
        self._cleanup_orchestration_worktrees(orchestration)
        
        # Release all resources
        self._release_all_resources(orchestration_id)
        
        logger.error(f"Orchestration {orchestration_id} failed: {error_message}")
    
    def _cleanup_orchestration_worktrees(self, orchestration: OrchestrationState) -> None:
        """Clean up all worktrees associated with an orchestration"""
        for workstream in orchestration.workstreams:
            if workstream.status in [WorkstreamStatus.IN_PROGRESS, WorkstreamStatus.PENDING]:
                # Clean up worktree if it exists
                cleanup_success = self.worktree_manager.cleanup_worktree(workstream.id)
                if cleanup_success:
                    logger.info(f"Cleaned up worktree for workstream {workstream.id} due to orchestration failure")
                else:
                    logger.warning(f"Failed to cleanup worktree for workstream {workstream.id}")
    
    def get_orchestration_result(self, orchestration_id: str) -> Optional[OrchestrationResult]:
        """
        Get the final result of an orchestration
        
        Args:
            orchestration_id: ID of the orchestration
            
        Returns:
            OrchestrationResult or None if not found
        """
        if orchestration_id not in self.active_orchestrations:
            return None
        
        orchestration = self.active_orchestrations[orchestration_id]
        
        # Calculate total duration
        total_duration = None
        if orchestration.start_time and orchestration.completion_time:
            total_duration = (orchestration.completion_time - orchestration.start_time).total_seconds() / 60
        
        # Categorize workstreams
        successful_workstreams = [ws.id for ws in orchestration.workstreams if ws.status == WorkstreamStatus.COMPLETED]
        failed_workstreams = [ws.id for ws in orchestration.workstreams if ws.status == WorkstreamStatus.FAILED]
        skipped_workstreams = [ws.id for ws in orchestration.workstreams if ws.status == WorkstreamStatus.BLOCKED]
        
        return OrchestrationResult(
            orchestration_id=orchestration_id,
            status=orchestration.status,
            workstreams=orchestration.workstreams,
            metrics=orchestration.metrics,
            total_duration=total_duration,
            start_time=orchestration.start_time,
            completion_time=orchestration.completion_time,
            successful_workstreams=successful_workstreams,
            failed_workstreams=failed_workstreams,
            skipped_workstreams=skipped_workstreams
        )
    
    def get_worktree_status(self, orchestration_id: str = None) -> Dict[str, Any]:
        """
        Get status of all worktrees or worktrees for a specific orchestration
        
        Args:
            orchestration_id: Optional orchestration ID to filter worktrees
            
        Returns:
            Dictionary with worktree status information
        """
        if orchestration_id:
            # Get worktrees for specific orchestration
            if orchestration_id not in self.active_orchestrations:
                return {}
            
            orchestration = self.active_orchestrations[orchestration_id]
            worktree_status = {}
            
            for workstream in orchestration.workstreams:
                status = self.worktree_manager.get_worktree_status(workstream.id)
                if status:
                    worktree_status[workstream.id] = status
            
            return worktree_status
        else:
            # Get all active worktrees
            return {
                workstream_id: self.worktree_manager.get_worktree_status(workstream_id)
                for workstream_id in self.worktree_manager.active_worktrees.keys()
            }
    
    def cleanup_completed_orchestrations(self) -> None:
        """Clean up completed orchestrations to free memory"""
        completed_ids = []
        
        for orchestration_id, orchestration in self.active_orchestrations.items():
            if orchestration.status in [OrchestrationStatus.COMPLETED, OrchestrationStatus.FAILED]:
                completed_ids.append(orchestration_id)
        
        for orchestration_id in completed_ids:
            del self.active_orchestrations[orchestration_id]
            if orchestration_id in self.execution_callbacks:
                del self.execution_callbacks[orchestration_id]
        
        if completed_ids:
            logger.info(f"Cleaned up {len(completed_ids)} completed orchestrations")
    
    def shutdown(self) -> None:
        """Shutdown the orchestrator and clean up resources"""
        logger.info("Shutting down WorkstreamOrchestrator")
        
        # Stop all active orchestrations
        for orchestration_id in list(self.active_orchestrations.keys()):
            self.stop_orchestration(orchestration_id)
        
        # Shutdown thread pool
        self.executor.shutdown(wait=True)
        
        # Stop monitoring
        if self.monitoring_thread:
            self.stop_monitoring.set()
            self.monitoring_thread.join()
        
        logger.info("WorkstreamOrchestrator shutdown complete")
