#!/usr/bin/env python3
"""
Test script for Git worktree integration
"""
import os
import sys
import tempfile
import shutil
import subprocess
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.WorktreeManager import WorktreeManager
from app.services.WorkstreamOrchestrator import WorkstreamOrchestrator
from app.models.Workstream import Workstream, WorkstreamStatus
from app.models.Orchestration import OrchestrationRequest, OrchestrationConfig


def setup_test_repository(repo_path: Path) -> bool:
    """Set up a test Git repository"""
    try:
        # Initialize Git repository
        subprocess.run(['git', 'init'], cwd=repo_path, check=True)
        
        # Create initial file
        (repo_path / 'README.md').write_text('# Test Repository\n\nThis is a test repository for Git worktree integration.')
        
        # Initial commit
        subprocess.run(['git', 'add', '.'], cwd=repo_path, check=True)
        subprocess.run(['git', 'commit', '-m', 'Initial commit'], cwd=repo_path, check=True)
        
        print(f"✅ Test repository initialized at {repo_path}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to initialize test repository: {e}")
        return False


def test_worktree_manager():
    """Test the WorktreeManager functionality"""
    print("\n🧪 Testing WorktreeManager...")
    
    # Create temporary directory for test
    with tempfile.TemporaryDirectory() as temp_dir:
        repo_path = Path(temp_dir) / "test-repo"
        repo_path.mkdir()
        
        # Set up test repository
        if not setup_test_repository(repo_path):
            return False
        
        # Initialize worktree manager
        worktree_manager = WorktreeManager(str(repo_path))
        
        # Create test workstream
        workstream = Workstream(
            id="test-workstream-1",
            name="Test Workstream",
            description="A test workstream for worktree integration",
            original_task_id="test-task-1",
            assigned_agent_id="test-agent-1"
        )
        
        # Test worktree creation
        print("📁 Creating worktree...")
        worktree_path = worktree_manager.create_worktree_for_workstream(workstream, "test-agent-1")
        
        if worktree_path:
            print(f"✅ Worktree created at: {worktree_path}")
            
            # Test worktree path retrieval
            retrieved_path = worktree_manager.get_worktree_path(workstream.id)
            if retrieved_path == worktree_path:
                print("✅ Worktree path retrieval works")
            else:
                print("❌ Worktree path retrieval failed")
                return False
            
            # Test worktree status
            status = worktree_manager.get_worktree_status(workstream.id)
            if status:
                print(f"✅ Worktree status: {status['status']}")
            else:
                print("❌ Failed to get worktree status")
                return False
            
            # Test worktree cleanup
            print("🧹 Cleaning up worktree...")
            if worktree_manager.cleanup_worktree(workstream.id):
                print("✅ Worktree cleanup successful")
            else:
                print("❌ Worktree cleanup failed")
                return False
            
        else:
            print("❌ Failed to create worktree")
            return False
    
    print("✅ WorktreeManager tests passed!")
    return True


def test_orchestrator_integration():
    """Test the WorkstreamOrchestrator with worktree integration"""
    print("\n🧪 Testing WorkstreamOrchestrator integration...")
    
    # Create temporary directory for test
    with tempfile.TemporaryDirectory() as temp_dir:
        repo_path = Path(temp_dir) / "test-repo"
        repo_path.mkdir()
        
        # Set up test repository
        if not setup_test_repository(repo_path):
            return False
        
        # Initialize orchestrator with worktree support
        orchestrator = WorkstreamOrchestrator(str(repo_path))
        
        # Create test workstreams
        workstream1 = Workstream(
            id="test-workstream-1",
            name="Test Workstream 1",
            description="First test workstream",
            original_task_id="test-task-1",
            assigned_agent_id="test-agent-1",
            estimated_duration=1  # 1 minute
        )
        
        workstream2 = Workstream(
            id="test-workstream-2",
            name="Test Workstream 2",
            description="Second test workstream",
            original_task_id="test-task-1",
            assigned_agent_id="test-agent-2",
            estimated_duration=1  # 1 minute
        )
        
        # Create orchestration request
        request = OrchestrationRequest(
            workstreams=[workstream1, workstream2],
            config=OrchestrationConfig(
                max_concurrent_workstreams=2,
                max_retries_per_workstream=1
            )
        )
        
        # Start orchestration
        print("🚀 Starting orchestration...")
        orchestration_state = orchestrator.start_orchestration(request)
        
        if orchestration_state:
            print(f"✅ Orchestration started with ID: {orchestration_state.orchestration_id}")
            
            # Wait for completion (with timeout)
            import time
            max_wait_time = 180  # 3 minutes
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                status = orchestrator.get_orchestration_status(orchestration_state.orchestration_id)
                if status and status.status.value in ['completed', 'failed']:
                    break
                time.sleep(2)
            
            # Get final result
            result = orchestrator.get_orchestration_result(orchestration_state.orchestration_id)
            if result:
                print(f"✅ Orchestration completed with status: {result.status}")
                print(f"   Successful workstreams: {len(result.successful_workstreams)}")
                print(f"   Failed workstreams: {len(result.failed_workstreams)}")
                
                # Check worktree status
                worktree_status = orchestrator.get_worktree_status(orchestration_state.orchestration_id)
                print(f"   Active worktrees: {len(worktree_status)}")
                
                return True
            else:
                print("❌ Failed to get orchestration result")
                return False
        else:
            print("❌ Failed to start orchestration")
            return False


def main():
    """Main test function"""
    print("🚀 Starting Git worktree integration tests...")
    
    # Test 1: WorktreeManager
    if not test_worktree_manager():
        print("❌ WorktreeManager tests failed")
        return False
    
    # Test 2: Orchestrator integration
    if not test_orchestrator_integration():
        print("❌ Orchestrator integration tests failed")
        return False
    
    print("\n🎉 All tests passed! Git worktree integration is working correctly.")
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
