"""
Git utility functions for CCPM system
"""
import os
import logging
import subprocess
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)


class GitUtils:
    """
    Utility class for Git operations used by the CCPM system
    """
    
    @staticmethod
    def run_git_command(args: List[str], cwd: Path = None, timeout: int = 30) -> Tuple[int, str, str]:
        """
        Run a Git command and return the result
        
        Args:
            args: Git command arguments
            cwd: Working directory for the command
            timeout: Command timeout in seconds
            
        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        try:
            result = subprocess.run(
                ['git'] + args,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            logger.error(f"Git command timed out: {' '.join(args)}")
            return -1, "", "Command timed out"
        except Exception as e:
            logger.error(f"Failed to run Git command: {e}")
            return -1, "", str(e)
    
    @staticmethod
    def is_git_repository(path: Path = None) -> bool:
        """
        Check if a directory is a Git repository
        
        Args:
            path: Path to check. If None, uses current directory
            
        Returns:
            True if it's a Git repository, False otherwise
        """
        cwd = path or Path.cwd()
        return_code, _, _ = GitUtils.run_git_command(['rev-parse', '--git-dir'], cwd=cwd)
        return return_code == 0
    
    @staticmethod
    def get_current_branch(path: Path = None) -> Optional[str]:
        """
        Get the current branch name
        
        Args:
            path: Repository path. If None, uses current directory
            
        Returns:
            Current branch name, or None if failed
        """
        cwd = path or Path.cwd()
        return_code, stdout, stderr = GitUtils.run_git_command(['branch', '--show-current'], cwd=cwd)
        
        if return_code == 0:
            return stdout.strip()
        else:
            logger.error(f"Failed to get current branch: {stderr}")
            return None
    
    @staticmethod
    def get_repository_status(path: Path = None) -> Dict[str, Any]:
        """
        Get comprehensive repository status
        
        Args:
            path: Repository path. If None, uses current directory
            
        Returns:
            Dictionary with repository status information
        """
        cwd = path or Path.cwd()
        status = {
            'is_git_repo': False,
            'current_branch': None,
            'has_changes': False,
            'staged_files': [],
            'unstaged_files': [],
            'untracked_files': [],
            'last_commit': None,
            'remote_branches': []
        }
        
        # Check if it's a Git repository
        if not GitUtils.is_git_repository(cwd):
            return status
        
        status['is_git_repo'] = True
        
        # Get current branch
        status['current_branch'] = GitUtils.get_current_branch(cwd)
        
        # Get repository status
        return_code, stdout, stderr = GitUtils.run_git_command(['status', '--porcelain'], cwd=cwd)
        if return_code == 0:
            status['has_changes'] = bool(stdout.strip())
            
            # Parse status output
            for line in stdout.strip().split('\n'):
                if line:
                    status_code = line[:2]
                    filename = line[3:]
                    
                    if status_code.startswith('M') or status_code.startswith('A'):
                        status['staged_files'].append(filename)
                    elif status_code.startswith(' M') or status_code.startswith(' A'):
                        status['unstaged_files'].append(filename)
                    elif status_code.startswith('??'):
                        status['untracked_files'].append(filename)
        
        # Get last commit information
        return_code, stdout, stderr = GitUtils.run_git_command([
            'log', '-1', '--format=%H|%an|%ae|%ad|%s', '--date=iso'
        ], cwd=cwd)
        
        if return_code == 0 and stdout.strip():
            parts = stdout.strip().split('|')
            if len(parts) >= 5:
                status['last_commit'] = {
                    'hash': parts[0],
                    'author_name': parts[1],
                    'author_email': parts[2],
                    'date': parts[3],
                    'message': parts[4]
                }
        
        # Get remote branches
        return_code, stdout, stderr = GitUtils.run_git_command(['branch', '-r'], cwd=cwd)
        if return_code == 0:
            status['remote_branches'] = [
                branch.strip() for branch in stdout.strip().split('\n') if branch.strip()
            ]
        
        return status
    
    @staticmethod
    def create_branch(branch_name: str, base_branch: str = 'main', path: Path = None) -> bool:
        """
        Create a new branch from a base branch
        
        Args:
            branch_name: Name of the new branch
            base_branch: Base branch to create from
            path: Repository path. If None, uses current directory
            
        Returns:
            True if branch creation was successful, False otherwise
        """
        cwd = path or Path.cwd()
        
        # Switch to base branch first
        return_code, stdout, stderr = GitUtils.run_git_command(['checkout', base_branch], cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to checkout base branch {base_branch}: {stderr}")
            return False
        
        # Create and checkout new branch
        return_code, stdout, stderr = GitUtils.run_git_command(['checkout', '-b', branch_name], cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to create branch {branch_name}: {stderr}")
            return False
        
        logger.info(f"Successfully created branch {branch_name} from {base_branch}")
        return True
    
    @staticmethod
    def delete_branch(branch_name: str, force: bool = False, path: Path = None) -> bool:
        """
        Delete a branch
        
        Args:
            branch_name: Name of the branch to delete
            force: Whether to force delete
            path: Repository path. If None, uses current directory
            
        Returns:
            True if branch deletion was successful, False otherwise
        """
        cwd = path or Path.cwd()
        
        args = ['branch']
        if force:
            args.append('-D')
        else:
            args.append('-d')
        args.append(branch_name)
        
        return_code, stdout, stderr = GitUtils.run_git_command(args, cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to delete branch {branch_name}: {stderr}")
            return False
        
        logger.info(f"Successfully deleted branch {branch_name}")
        return True
    
    @staticmethod
    def list_worktrees(path: Path = None) -> List[Dict[str, Any]]:
        """
        List all Git worktrees
        
        Args:
            path: Repository path. If None, uses current directory
            
        Returns:
            List of worktree information dictionaries
        """
        cwd = path or Path.cwd()
        worktrees = []
        
        return_code, stdout, stderr = GitUtils.run_git_command(['worktree', 'list', '--porcelain'], cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to list worktrees: {stderr}")
            return worktrees
        
        current_worktree = {}
        for line in stdout.strip().split('\n'):
            if line.startswith('worktree '):
                if current_worktree:
                    worktrees.append(current_worktree)
                current_worktree = {'path': line[9:]}
            elif line.startswith('branch '):
                current_worktree['branch'] = line[8:]
            elif line.startswith('bare'):
                current_worktree['bare'] = True
            elif line.startswith('detached'):
                current_worktree['detached'] = True
            elif line.startswith('locked'):
                current_worktree['locked'] = True
            elif line.startswith('prunable'):
                current_worktree['prunable'] = True
        
        if current_worktree:
            worktrees.append(current_worktree)
        
        return worktrees
    
    @staticmethod
    def add_worktree(worktree_path: Path, branch_name: str, repo_path: Path = None) -> bool:
        """
        Add a new worktree
        
        Args:
            worktree_path: Path where the worktree should be created
            branch_name: Branch name for the worktree
            repo_path: Repository path. If None, uses current directory
            
        Returns:
            True if worktree creation was successful, False otherwise
        """
        cwd = repo_path or Path.cwd()
        
        return_code, stdout, stderr = GitUtils.run_git_command([
            'worktree', 'add', str(worktree_path), branch_name
        ], cwd=cwd)
        
        if return_code != 0:
            logger.error(f"Failed to add worktree: {stderr}")
            return False
        
        logger.info(f"Successfully added worktree at {worktree_path}")
        return True
    
    @staticmethod
    def remove_worktree(worktree_path: Path, force: bool = False, repo_path: Path = None) -> bool:
        """
        Remove a worktree
        
        Args:
            worktree_path: Path of the worktree to remove
            force: Whether to force remove
            repo_path: Repository path. If None, uses current directory
            
        Returns:
            True if worktree removal was successful, False otherwise
        """
        cwd = repo_path or Path.cwd()
        
        args = ['worktree', 'remove']
        if force:
            args.append('--force')
        args.append(str(worktree_path))
        
        return_code, stdout, stderr = GitUtils.run_git_command(args, cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to remove worktree: {stderr}")
            return False
        
        logger.info(f"Successfully removed worktree at {worktree_path}")
        return True
    
    @staticmethod
    def commit_changes(commit_message: str, path: Path = None, add_all: bool = True) -> bool:
        """
        Commit changes in the repository
        
        Args:
            commit_message: Commit message
            path: Repository path. If None, uses current directory
            add_all: Whether to add all changes before committing
            
        Returns:
            True if commit was successful, False otherwise
        """
        cwd = path or Path.cwd()
        
        if add_all:
            # Add all changes
            return_code, stdout, stderr = GitUtils.run_git_command(['add', '.'], cwd=cwd)
            if return_code != 0:
                logger.error(f"Failed to add changes: {stderr}")
                return False
        
        # Commit changes
        return_code, stdout, stderr = GitUtils.run_git_command([
            'commit', '-m', commit_message
        ], cwd=cwd)
        
        if return_code != 0:
            logger.error(f"Failed to commit changes: {stderr}")
            return False
        
        logger.info(f"Successfully committed changes: {commit_message}")
        return True
    
    @staticmethod
    def merge_branch(branch_name: str, target_branch: str = 'main', path: Path = None, no_ff: bool = True) -> bool:
        """
        Merge a branch into the target branch
        
        Args:
            branch_name: Branch to merge
            target_branch: Target branch to merge into
            path: Repository path. If None, uses current directory
            no_ff: Whether to use --no-ff flag for merge commit
            
        Returns:
            True if merge was successful, False otherwise
        """
        cwd = path or Path.cwd()
        
        # Switch to target branch
        return_code, stdout, stderr = GitUtils.run_git_command(['checkout', target_branch], cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to checkout target branch {target_branch}: {stderr}")
            return False
        
        # Merge the branch
        args = ['merge']
        if no_ff:
            args.append('--no-ff')
        args.extend(['-m', f"Merge branch '{branch_name}' into {target_branch}"])
        args.append(branch_name)
        
        return_code, stdout, stderr = GitUtils.run_git_command(args, cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to merge branch {branch_name}: {stderr}")
            return False
        
        logger.info(f"Successfully merged branch {branch_name} into {target_branch}")
        return True
    
    @staticmethod
    def get_file_diff(file_path: str, path: Path = None) -> Optional[str]:
        """
        Get the diff for a specific file
        
        Args:
            file_path: Path to the file
            path: Repository path. If None, uses current directory
            
        Returns:
            Diff output, or None if failed
        """
        cwd = path or Path.cwd()
        
        return_code, stdout, stderr = GitUtils.run_git_command(['diff', file_path], cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to get diff for {file_path}: {stderr}")
            return None
        
        return stdout
    
    @staticmethod
    def stash_changes(stash_name: str = None, path: Path = None) -> bool:
        """
        Stash changes in the repository
        
        Args:
            stash_name: Optional name for the stash
            path: Repository path. If None, uses current directory
            
        Returns:
            True if stash was successful, False otherwise
        """
        cwd = path or Path.cwd()
        
        args = ['stash', 'push']
        if stash_name:
            args.extend(['-m', stash_name])
        
        return_code, stdout, stderr = GitUtils.run_git_command(args, cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to stash changes: {stderr}")
            return False
        
        logger.info(f"Successfully stashed changes: {stash_name or 'unnamed'}")
        return True
    
    @staticmethod
    def pop_stash(stash_index: int = 0, path: Path = None) -> bool:
        """
        Pop a stash from the stash list
        
        Args:
            stash_index: Index of the stash to pop (0 is the most recent)
            path: Repository path. If None, uses current directory
            
        Returns:
            True if stash pop was successful, False otherwise
        """
        cwd = path or Path.cwd()
        
        return_code, stdout, stderr = GitUtils.run_git_command(['stash', 'pop', f'stash@{{{stash_index}}}'], cwd=cwd)
        if return_code != 0:
            logger.error(f"Failed to pop stash: {stderr}")
            return False
        
        logger.info(f"Successfully popped stash {stash_index}")
        return True
