"""
Git Worktree Manager for parallel agent execution
"""
import os
import shutil
import logging
import subprocess
import tempfile
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from datetime import datetime
import uuid
import json

from ..models.Workstream import Workstream, WorkstreamStatus
from ..models.Orchestration import ExecutionContext

# Configure logging
logger = logging.getLogger(__name__)


class WorktreeManager:
    """
    Manages Git worktrees for parallel agent execution.
    
    This service creates isolated Git worktrees for each agent, allowing them
    to work on the same repository without conflicts. It handles worktree
    creation, cleanup, and merging of completed work.
    """
    
    def __init__(self, repo_path: str = None):
        """
        Initialize the worktree manager
        
        Args:
            repo_path: Path to the Git repository. If None, uses current directory
        """
        self.repo_path = Path(repo_path) if repo_path else Path.cwd()
        self.worktrees_dir = self.repo_path / ".worktrees"
        self.active_worktrees: Dict[str, Dict[str, Any]] = {}
        self.worktree_config_file = self.repo_path / ".worktrees" / "config.json"
        
        # Ensure worktrees directory exists
        self.worktrees_dir.mkdir(exist_ok=True)
        
        # Load existing worktree configuration
        self._load_worktree_config()
        
        logger.info(f"WorktreeManager initialized for repository: {self.repo_path}")
    
    def _load_worktree_config(self) -> None:
        """Load existing worktree configuration from disk"""
        if self.worktree_config_file.exists():
            try:
                with open(self.worktree_config_file, 'r') as f:
                    config = json.load(f)
                    self.active_worktrees = config.get('active_worktrees', {})
                logger.info(f"Loaded {len(self.active_worktrees)} active worktrees")
            except Exception as e:
                logger.warning(f"Failed to load worktree config: {e}")
                self.active_worktrees = {}
        else:
            self.active_worktrees = {}
    
    def _save_worktree_config(self) -> None:
        """Save worktree configuration to disk"""
        try:
            config = {
                'active_worktrees': self.active_worktrees,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.worktree_config_file, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save worktree config: {e}")
    
    def _run_git_command(self, args: List[str], cwd: Path = None) -> Tuple[int, str, str]:
        """
        Run a Git command and return the result
        
        Args:
            args: Git command arguments
            cwd: Working directory for the command
            
        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        try:
            result = subprocess.run(
                ['git'] + args,
                cwd=cwd or self.repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            logger.error(f"Git command timed out: {' '.join(args)}")
            return -1, "", "Command timed out"
        except Exception as e:
            logger.error(f"Failed to run Git command: {e}")
            return -1, "", str(e)
    
    def create_worktree_for_workstream(self, workstream: Workstream, agent_id: str) -> Optional[str]:
        """
        Create a Git worktree for a specific workstream and agent
        
        Args:
            workstream: The workstream that needs a worktree
            agent_id: ID of the agent that will work on this workstream
            
        Returns:
            Path to the created worktree, or None if creation failed
        """
        try:
            # Generate unique branch name
            branch_name = f"workstream-{workstream.id}-{agent_id}-{uuid.uuid4().hex[:8]}"
            worktree_path = self.worktrees_dir / branch_name
            
            logger.info(f"Creating worktree for workstream {workstream.id} (agent {agent_id})")
            
            # Check if we're in a Git repository
            return_code, stdout, stderr = self._run_git_command(['rev-parse', '--git-dir'])
            if return_code != 0:
                logger.error(f"Not in a Git repository: {stderr}")
                return None
            
            # Ensure we're on main branch first
            return_code, stdout, stderr = self._run_git_command(['checkout', 'main'])
            if return_code != 0:
                logger.error(f"Failed to checkout main branch: {stderr}")
                return None
            
            # Create new branch from main
            return_code, stdout, stderr = self._run_git_command([
                'branch', branch_name
            ])
            if return_code != 0:
                logger.error(f"Failed to create branch {branch_name}: {stderr}")
                return None
            
            # Create worktree for the new branch
            return_code, stdout, stderr = self._run_git_command([
                'worktree', 'add', str(worktree_path), branch_name
            ])
            if return_code != 0:
                logger.error(f"Failed to create worktree: {stderr}")
                # Clean up the branch we created
                self._run_git_command(['branch', '-D', branch_name])
                return None
            
            # Record worktree information
            worktree_info = {
                'workstream_id': workstream.id,
                'agent_id': agent_id,
                'branch_name': branch_name,
                'worktree_path': str(worktree_path),
                'created_at': datetime.now().isoformat(),
                'status': 'active'
            }
            
            self.active_worktrees[workstream.id] = worktree_info
            self._save_worktree_config()
            
            logger.info(f"Successfully created worktree at {worktree_path}")
            return str(worktree_path)
            
        except Exception as e:
            logger.error(f"Failed to create worktree for workstream {workstream.id}: {e}")
            return None
    
    def get_worktree_path(self, workstream_id: str) -> Optional[str]:
        """
        Get the worktree path for a specific workstream
        
        Args:
            workstream_id: ID of the workstream
            
        Returns:
            Path to the worktree, or None if not found
        """
        worktree_info = self.active_worktrees.get(workstream_id)
        if worktree_info:
            return worktree_info.get('worktree_path')
        return None
    
    def list_active_worktrees(self) -> List[Dict[str, Any]]:
        """
        List all active worktrees
        
        Returns:
            List of worktree information dictionaries
        """
        return list(self.active_worktrees.values())
    
    def commit_worktree_changes(self, workstream_id: str, commit_message: str = None) -> bool:
        """
        Commit changes in a worktree
        
        Args:
            workstream_id: ID of the workstream
            commit_message: Custom commit message
            
        Returns:
            True if commit was successful, False otherwise
        """
        worktree_info = self.active_worktrees.get(workstream_id)
        if not worktree_info:
            logger.error(f"No worktree found for workstream {workstream_id}")
            return False
        
        worktree_path = Path(worktree_info['worktree_path'])
        
        try:
            # Check if there are any changes to commit
            return_code, stdout, stderr = self._run_git_command(
                ['status', '--porcelain'], cwd=worktree_path
            )
            if return_code != 0:
                logger.error(f"Failed to check worktree status: {stderr}")
                return False
            
            if not stdout.strip():
                logger.info(f"No changes to commit in worktree for workstream {workstream_id}")
                return True
            
            # Add all changes
            return_code, stdout, stderr = self._run_git_command(
                ['add', '.'], cwd=worktree_path
            )
            if return_code != 0:
                logger.error(f"Failed to add changes: {stderr}")
                return False
            
            # Create commit message
            if not commit_message:
                commit_message = f"Workstream {workstream_id} changes by agent {worktree_info['agent_id']}"
            
            # Commit changes
            return_code, stdout, stderr = self._run_git_command([
                'commit', '-m', commit_message
            ], cwd=worktree_path)
            
            if return_code != 0:
                logger.error(f"Failed to commit changes: {stderr}")
                return False
            
            logger.info(f"Successfully committed changes for workstream {workstream_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to commit worktree changes: {e}")
            return False
    
    def merge_worktree_to_main(self, workstream_id: str) -> bool:
        """
        Merge a worktree's changes back to the main branch
        
        Args:
            workstream_id: ID of the workstream to merge
            
        Returns:
            True if merge was successful, False otherwise
        """
        worktree_info = self.active_worktrees.get(workstream_id)
        if not worktree_info:
            logger.error(f"No worktree found for workstream {workstream_id}")
            return False
        
        try:
            branch_name = worktree_info['branch_name']
            
            # Switch to main branch
            return_code, stdout, stderr = self._run_git_command(['checkout', 'main'])
            if return_code != 0:
                logger.error(f"Failed to switch to main branch: {stderr}")
                return False
            
            # Merge the worktree branch
            return_code, stdout, stderr = self._run_git_command([
                'merge', branch_name, '--no-ff', '-m', f"Merge workstream {workstream_id}"
            ])
            
            if return_code != 0:
                logger.error(f"Failed to merge worktree {workstream_id}: {stderr}")
                return False
            
            logger.info(f"Successfully merged worktree {workstream_id} to main")
            return True
            
        except Exception as e:
            logger.error(f"Failed to merge worktree {workstream_id}: {e}")
            return False
    
    def cleanup_worktree(self, workstream_id: str) -> bool:
        """
        Clean up a worktree after completion
        
        Args:
            workstream_id: ID of the workstream to cleanup
            
        Returns:
            True if cleanup was successful, False otherwise
        """
        worktree_info = self.active_worktrees.get(workstream_id)
        if not worktree_info:
            logger.warning(f"No worktree found for workstream {workstream_id}")
            return True  # Consider this a successful cleanup
        
        try:
            branch_name = worktree_info['branch_name']
            worktree_path = Path(worktree_info['worktree_path'])
            
            # Remove the worktree
            return_code, stdout, stderr = self._run_git_command([
                'worktree', 'remove', str(worktree_path)
            ])
            
            if return_code != 0:
                logger.warning(f"Failed to remove worktree: {stderr}")
                # Try to force remove
                return_code, stdout, stderr = self._run_git_command([
                    'worktree', 'remove', str(worktree_path), '--force'
                ])
                if return_code != 0:
                    logger.error(f"Failed to force remove worktree: {stderr}")
                    return False
            
            # Delete the branch
            return_code, stdout, stderr = self._run_git_command([
                'branch', '-D', branch_name
            ])
            
            if return_code != 0:
                logger.warning(f"Failed to delete branch {branch_name}: {stderr}")
            
            # Remove from active worktrees
            del self.active_worktrees[workstream_id]
            self._save_worktree_config()
            
            logger.info(f"Successfully cleaned up worktree for workstream {workstream_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cleanup worktree {workstream_id}: {e}")
            return False
    
    def cleanup_all_worktrees(self) -> bool:
        """
        Clean up all active worktrees
        
        Returns:
            True if all cleanups were successful, False otherwise
        """
        workstream_ids = list(self.active_worktrees.keys())
        success = True
        
        for workstream_id in workstream_ids:
            if not self.cleanup_worktree(workstream_id):
                success = False
        
        return success
    
    def get_worktree_status(self, workstream_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed status of a worktree
        
        Args:
            workstream_id: ID of the workstream
            
        Returns:
            Dictionary with worktree status information
        """
        worktree_info = self.active_worktrees.get(workstream_id)
        if not worktree_info:
            return None
        
        try:
            worktree_path = Path(worktree_info['worktree_path'])
            
            # Check if worktree directory exists
            if not worktree_path.exists():
                return {
                    **worktree_info,
                    'status': 'orphaned',
                    'error': 'Worktree directory does not exist'
                }
            
            # Get Git status
            return_code, stdout, stderr = self._run_git_command(
                ['status', '--porcelain'], cwd=worktree_path
            )
            
            status_info = {
                **worktree_info,
                'has_changes': bool(stdout.strip()),
                'change_count': len(stdout.strip().split('\n')) if stdout.strip() else 0,
                'last_checked': datetime.now().isoformat()
            }
            
            return status_info
            
        except Exception as e:
            return {
                **worktree_info,
                'status': 'error',
                'error': str(e)
            }
