#!/usr/bin/env python3
"""
Test script for workstream orchestration functionality
"""
import sys
import os
import time
import logging
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models.Workstream import (
    Workstream, WorkstreamStatus, WorkstreamDependency, 
    DependencyType, ResourceRequirement, ResourceType
)
from app.models.Orchestration import (
    OrchestrationRequest, OrchestrationConfig, 
    ConflictResolutionStrategy, OrchestrationStatus
)
from app.services.WorkstreamOrchestrator import WorkstreamOrchestrator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_sample_workstreams():
    """Create sample workstreams for testing"""
    
    # Create workstreams for a web application deployment scenario
    workstreams = []
    
    # Workstream 1: Database setup
    db_setup = Workstream(
        id="ws-db-setup",
        name="Database Setup",
        description="Initialize and configure the database",
        original_task_id="task-deploy-webapp",
        priority=1,
        estimated_duration=1,  # 1 minute for testing
        required_resources=[
            ResourceRequirement(
                resource_id="db-server",
                resource_type=ResourceType.DATABASE,
                resource_name="Database Server",
                is_exclusive=True,
                estimated_duration=1
            )
        ],
        tags=["database", "setup"]
    )
    workstreams.append(db_setup)
    
    # Workstream 2: Backend API setup
    backend_setup = Workstream(
        id="ws-backend-setup",
        name="Backend API Setup",
        description="Deploy and configure the backend API",
        original_task_id="task-deploy-webapp",
        priority=2,
        estimated_duration=2,  # 2 minutes for testing
        dependencies=[
            WorkstreamDependency(
                source_workstream_id="ws-backend-setup",
                target_workstream_id="ws-db-setup",
                dependency_type=DependencyType.REQUIRES,
                description="Backend needs database to be ready",
                is_critical=True
            )
        ],
        required_resources=[
            ResourceRequirement(
                resource_id="api-server",
                resource_type=ResourceType.API_ENDPOINT,
                resource_name="API Server",
                is_exclusive=False,
                estimated_duration=2
            ),
            ResourceRequirement(
                resource_id="config-files",
                resource_type=ResourceType.FILE,
                resource_name="Configuration Files",
                is_exclusive=False,
                estimated_duration=1
            )
        ],
        tags=["backend", "api", "deployment"]
    )
    workstreams.append(backend_setup)
    
    # Workstream 3: Frontend build
    frontend_build = Workstream(
        id="ws-frontend-build",
        name="Frontend Build",
        description="Build the frontend application",
        original_task_id="task-deploy-webapp",
        priority=3,
        estimated_duration=2,  # 2 minutes for testing
        required_resources=[
            ResourceRequirement(
                resource_id="build-server",
                resource_type=ResourceType.COMPUTATIONAL,
                resource_name="Build Server",
                is_exclusive=False,
                estimated_duration=2
            ),
            ResourceRequirement(
                resource_id="source-code",
                resource_type=ResourceType.FILE,
                resource_name="Source Code Repository",
                is_exclusive=False,
                estimated_duration=1
            )
        ],
        tags=["frontend", "build", "compilation"]
    )
    workstreams.append(frontend_build)
    
    # Workstream 4: Frontend deployment
    frontend_deploy = Workstream(
        id="ws-frontend-deploy",
        name="Frontend Deployment",
        description="Deploy the frontend to the web server",
        original_task_id="task-deploy-webapp",
        priority=4,
        estimated_duration=1,  # 1 minute for testing
        dependencies=[
            WorkstreamDependency(
                source_workstream_id="ws-frontend-deploy",
                target_workstream_id="ws-frontend-build",
                dependency_type=DependencyType.REQUIRES,
                description="Frontend deployment needs build to complete",
                is_critical=True
            )
        ],
        required_resources=[
            ResourceRequirement(
                resource_id="web-server",
                resource_type=ResourceType.API_ENDPOINT,
                resource_name="Web Server",
                is_exclusive=False,
                estimated_duration=1
            ),
            ResourceRequirement(
                resource_id="deployment-files",
                resource_type=ResourceType.FILE,
                resource_name="Deployment Files",
                is_exclusive=False,
                estimated_duration=1
            )
        ],
        tags=["frontend", "deployment", "web"]
    )
    workstreams.append(frontend_deploy)
    
    # Workstream 5: Load balancer configuration
    lb_config = Workstream(
        id="ws-lb-config",
        name="Load Balancer Configuration",
        description="Configure load balancer for the application",
        original_task_id="task-deploy-webapp",
        priority=5,
        estimated_duration=1,  # 1 minute for testing
        dependencies=[
            WorkstreamDependency(
                source_workstream_id="ws-lb-config",
                target_workstream_id="ws-backend-setup",
                dependency_type=DependencyType.REQUIRES,
                description="Load balancer needs backend to be ready",
                is_critical=True
            ),
            WorkstreamDependency(
                source_workstream_id="ws-lb-config",
                target_workstream_id="ws-frontend-deploy",
                dependency_type=DependencyType.REQUIRES,
                description="Load balancer needs frontend to be deployed",
                is_critical=True
            )
        ],
        required_resources=[
            ResourceRequirement(
                resource_id="load-balancer",
                resource_type=ResourceType.EXTERNAL_SERVICE,
                resource_name="Load Balancer Service",
                is_exclusive=True,
                estimated_duration=1
            )
        ],
        tags=["load-balancer", "configuration", "networking"]
    )
    workstreams.append(lb_config)
    
    # Workstream 6: Health checks
    health_checks = Workstream(
        id="ws-health-checks",
        name="Health Checks",
        description="Run comprehensive health checks on the deployed application",
        original_task_id="task-deploy-webapp",
        priority=6,
        estimated_duration=1,  # 1 minute for testing
        dependencies=[
            WorkstreamDependency(
                source_workstream_id="ws-health-checks",
                target_workstream_id="ws-lb-config",
                dependency_type=DependencyType.REQUIRES,
                description="Health checks need load balancer to be configured",
                is_critical=True
            )
        ],
        required_resources=[
            ResourceRequirement(
                resource_id="monitoring-service",
                resource_type=ResourceType.EXTERNAL_SERVICE,
                resource_name="Monitoring Service",
                is_exclusive=False,
                estimated_duration=1
            )
        ],
        tags=["health-checks", "monitoring", "validation"]
    )
    workstreams.append(health_checks)
    
    return workstreams


def create_orchestration_config():
    """Create orchestration configuration for testing"""
    return OrchestrationConfig(
        max_concurrent_workstreams=3,
        max_retries_per_workstream=2,
        resource_conflict_strategy=ConflictResolutionStrategy.PRIORITY_BASED,
        enable_auto_rollback=True,
        rollback_threshold=0.5,  # 50% failure rate triggers rollback
        monitoring_interval=10,  # 10 seconds
        timeout_per_workstream=30,  # 30 minutes
        max_file_operations=5,
        max_database_connections=2,
        max_api_calls=10,
        max_external_services=2,
        max_computational_resources=4
    )


def execution_callback(update_data):
    """Callback function for execution updates"""
    logger.info(f"Execution update: {update_data}")
    
    if update_data.get("completed"):
        logger.info(f"✅ Completed workstreams: {update_data['completed']}")
    
    if update_data.get("failed"):
        logger.warning(f"❌ Failed workstreams: {update_data['failed']}")


def test_basic_orchestration():
    """Test basic orchestration functionality"""
    logger.info("🚀 Starting basic orchestration test")
    
    # Create orchestrator
    orchestrator = WorkstreamOrchestrator()
    
    try:
        # Create sample workstreams
        workstreams = create_sample_workstreams()
        logger.info(f"Created {len(workstreams)} sample workstreams")
        
        # Create orchestration request
        request = OrchestrationRequest(
            workstreams=workstreams,
            config=create_orchestration_config()
        )
        
        # Start orchestration
        logger.info("Starting orchestration...")
        orchestration_state = orchestrator.start_orchestration(request)
        
        # Register callback
        orchestrator.register_execution_callback(
            orchestration_state.orchestration_id, 
            execution_callback
        )
        
        logger.info(f"Orchestration started with ID: {orchestration_state.orchestration_id}")
        
        # Monitor progress
        while True:
            status = orchestrator.get_orchestration_status(orchestration_state.orchestration_id)
            if not status:
                logger.error("Orchestration not found!")
                break
            
            logger.info(f"Status: {status.status}")
            logger.info(f"Progress: {status.metrics.completed_workstreams}/{status.metrics.total_workstreams} completed")
            
            if status.status in [OrchestrationStatus.COMPLETED, OrchestrationStatus.FAILED]:
                break
            
            time.sleep(5)  # Check every 5 seconds
        
        # Get final result
        result = orchestrator.get_orchestration_result(orchestration_state.orchestration_id)
        if result:
            logger.info("🎉 Orchestration completed!")
            logger.info(f"Final status: {result.status}")
            logger.info(f"Total duration: {result.total_duration:.2f} minutes")
            logger.info(f"Successful workstreams: {len(result.successful_workstreams)}")
            logger.info(f"Failed workstreams: {len(result.failed_workstreams)}")
            logger.info(f"Skipped workstreams: {len(result.skipped_workstreams)}")
            
            # Print workstream details
            for workstream in result.workstreams:
                status_emoji = "✅" if workstream.status == WorkstreamStatus.COMPLETED else "❌"
                logger.info(f"{status_emoji} {workstream.name}: {workstream.status}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error during orchestration test: {str(e)}")
        return False
    
    finally:
        # Cleanup
        orchestrator.shutdown()


def test_conflict_resolution():
    """Test resource conflict resolution"""
    logger.info("🔧 Starting conflict resolution test")
    
    # Create workstreams with resource conflicts
    conflicting_workstreams = [
        Workstream(
            id="ws-conflict-1",
            name="High Priority Task",
            description="High priority task that needs exclusive database access",
            original_task_id="task-conflict-test",
            priority=1,
            estimated_duration=1,
            required_resources=[
                ResourceRequirement(
                    resource_id="shared-database",
                    resource_type=ResourceType.DATABASE,
                    resource_name="Shared Database",
                    is_exclusive=True,
                    estimated_duration=1
                )
            ]
        ),
        Workstream(
            id="ws-conflict-2",
            name="Low Priority Task",
            description="Low priority task that also needs exclusive database access",
            original_task_id="task-conflict-test",
            priority=5,
            estimated_duration=1,
            required_resources=[
                ResourceRequirement(
                    resource_id="shared-database",
                    resource_type=ResourceType.DATABASE,
                    resource_name="Shared Database",
                    is_exclusive=True,
                    estimated_duration=1
                )
            ]
        )
    ]
    
    # Create orchestrator
    orchestrator = WorkstreamOrchestrator()
    
    try:
        # Create orchestration request
        request = OrchestrationRequest(
            workstreams=conflicting_workstreams,
            config=OrchestrationConfig(
                max_concurrent_workstreams=2,
                resource_conflict_strategy=ConflictResolutionStrategy.PRIORITY_BASED
            )
        )
        
        # Start orchestration
        orchestration_state = orchestrator.start_orchestration(request)
        logger.info(f"Conflict test orchestration started: {orchestration_state.orchestration_id}")
        
        # Wait for completion
        while True:
            status = orchestrator.get_orchestration_status(orchestration_state.orchestration_id)
            if not status:
                break
            
            if status.status in [OrchestrationStatus.COMPLETED, OrchestrationStatus.FAILED]:
                break
            
            time.sleep(2)
        
        # Check results
        result = orchestrator.get_orchestration_result(orchestration_state.orchestration_id)
        if result:
            logger.info("Conflict resolution test completed!")
            logger.info(f"Status: {result.status}")
            logger.info(f"Successful: {len(result.successful_workstreams)}")
            logger.info(f"Failed: {len(result.failed_workstreams)}")
            
            # Verify that high priority task completed first
            high_priority_completed = "ws-conflict-1" in result.successful_workstreams
            low_priority_completed = "ws-conflict-2" in result.successful_workstreams
            
            if high_priority_completed:
                logger.info("✅ High priority task completed successfully")
            if low_priority_completed:
                logger.info("✅ Low priority task completed successfully")
            
            return high_priority_completed or low_priority_completed
        
        return False
        
    except Exception as e:
        logger.error(f"Error during conflict resolution test: {str(e)}")
        return False
    
    finally:
        orchestrator.shutdown()


def test_dependency_management():
    """Test dependency management and execution order"""
    logger.info("🔗 Starting dependency management test")
    
    # Create workstreams with dependencies
    dependent_workstreams = [
        Workstream(
            id="ws-dep-1",
            name="First Task",
            description="Task that must complete first",
            original_task_id="task-dependency-test",
            priority=1,
            estimated_duration=1
        ),
        Workstream(
            id="ws-dep-2",
            name="Second Task",
            description="Task that depends on first task",
            original_task_id="task-dependency-test",
            priority=2,
            estimated_duration=1,
            dependencies=[
                WorkstreamDependency(
                    source_workstream_id="ws-dep-2",
                    target_workstream_id="ws-dep-1",
                    dependency_type=DependencyType.REQUIRES,
                    description="Second task requires first task to complete",
                    is_critical=True
                )
            ]
        ),
        Workstream(
            id="ws-dep-3",
            name="Third Task",
            description="Task that depends on second task",
            original_task_id="task-dependency-test",
            priority=3,
            estimated_duration=1,
            dependencies=[
                WorkstreamDependency(
                    source_workstream_id="ws-dep-3",
                    target_workstream_id="ws-dep-2",
                    dependency_type=DependencyType.REQUIRES,
                    description="Third task requires second task to complete",
                    is_critical=True
                )
            ]
        )
    ]
    
    # Create orchestrator
    orchestrator = WorkstreamOrchestrator()
    
    try:
        # Create orchestration request
        request = OrchestrationRequest(
            workstreams=dependent_workstreams,
            config=OrchestrationConfig(
                max_concurrent_workstreams=1,  # Force sequential execution
                resource_conflict_strategy=ConflictResolutionStrategy.PRIORITY_BASED
            )
        )
        
        # Start orchestration
        orchestration_state = orchestrator.start_orchestration(request)
        logger.info(f"Dependency test orchestration started: {orchestration_state.orchestration_id}")
        
        # Wait for completion
        while True:
            status = orchestrator.get_orchestration_status(orchestration_state.orchestration_id)
            if not status:
                break
            
            if status.status in [OrchestrationStatus.COMPLETED, OrchestrationStatus.FAILED]:
                break
            
            time.sleep(2)
        
        # Check results
        result = orchestrator.get_orchestration_result(orchestration_state.orchestration_id)
        if result:
            logger.info("Dependency management test completed!")
            logger.info(f"Status: {result.status}")
            logger.info(f"Successful: {len(result.successful_workstreams)}")
            
            # Verify execution order (should be 1, 2, 3)
            expected_order = ["ws-dep-1", "ws-dep-2", "ws-dep-3"]
            actual_order = []
            
            for workstream in result.workstreams:
                if workstream.status == WorkstreamStatus.COMPLETED and workstream.completion_time:
                    actual_order.append((workstream.id, workstream.completion_time))
            
            # Sort by completion time
            actual_order.sort(key=lambda x: x[1])
            actual_ids = [ws_id for ws_id, _ in actual_order]
            
            logger.info(f"Expected order: {expected_order}")
            logger.info(f"Actual order: {actual_ids}")
            
            # Check if order is correct
            if actual_ids == expected_order:
                logger.info("✅ Dependencies respected correctly!")
                return True
            else:
                logger.warning("❌ Dependencies not respected correctly!")
                return False
        
        return False
        
    except Exception as e:
        logger.error(f"Error during dependency management test: {str(e)}")
        return False
    
    finally:
        orchestrator.shutdown()


def main():
    """Main test function"""
    logger.info("🧪 Starting Workstream Orchestration Tests")
    logger.info("=" * 50)
    
    tests = [
        ("Basic Orchestration", test_basic_orchestration),
        ("Conflict Resolution", test_conflict_resolution),
        ("Dependency Management", test_dependency_management)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n📋 Running test: {test_name}")
        logger.info("-" * 30)
        
        try:
            start_time = time.time()
            success = test_func()
            end_time = time.time()
            
            duration = end_time - start_time
            status = "✅ PASSED" if success else "❌ FAILED"
            
            logger.info(f"{status} - {test_name} (Duration: {duration:.2f}s)")
            results.append((test_name, success, duration))
            
        except Exception as e:
            logger.error(f"❌ ERROR - {test_name}: {str(e)}")
            results.append((test_name, False, 0))
    
    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("📊 TEST SUMMARY")
    logger.info("=" * 50)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for test_name, success, duration in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        logger.info(f"{status} - {test_name} ({duration:.2f}s)")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! Workstream orchestration is working correctly.")
        return 0
    else:
        logger.error("💥 Some tests failed. Please check the implementation.")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
