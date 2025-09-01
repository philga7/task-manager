"""
GitHub Service for CCPM Integration
Handles GitHub API operations for issue and epic management
"""
import os
import asyncio
from typing import List, Dict, Optional, Any
from github import Github, GithubException
from github.Issue import Issue
from github.Repository import Repository
from github.Label import Label
from github.Milestone import Milestone
import logging

logger = logging.getLogger(__name__)


class GitHubService:
    """Service for managing GitHub operations in CCPM"""
    
    def __init__(self, token: Optional[str] = None, repo_name: Optional[str] = None):
        """
        Initialize GitHub service
        
        Args:
            token: GitHub API token (defaults to GITHUB_API_TOKEN env var)
            repo_name: Repository name in format 'owner/repo' (defaults to env var)
        """
        self.token = token or os.getenv("GITHUB_API_TOKEN")
        self.repo_name = repo_name or os.getenv("GITHUB_REPO_NAME")
        
        if not self.token:
            raise ValueError("GitHub API token is required")
        
        if not self.repo_name:
            raise ValueError("GitHub repository name is required")
        
        self.github = Github(self.token)
        self.repo = self.github.get_repo(self.repo_name)
        logger.info(f"GitHub service initialized for repository: {self.repo_name}")
    
    async def create_epic_issue(self, title: str, description: str, labels: List[str] = None) -> Dict[str, Any]:
        """
        Create a GitHub issue that represents a CCPM epic
        
        Args:
            title: Issue title
            description: Issue description/body
            labels: List of labels to apply
            
        Returns:
            Dictionary with issue information
        """
        try:
            # Ensure epic label exists
            epic_label = await self._ensure_epic_label()
            
            # Prepare labels
            issue_labels = [epic_label.name]
            if labels:
                issue_labels.extend(labels)
            
            # Create the issue
            issue = self.repo.create_issue(
                title=title,
                body=description,
                labels=issue_labels
            )
            
            logger.info(f"Created epic issue: {issue.number} - {title}")
            
            return {
                "id": issue.number,
                "title": issue.title,
                "body": issue.body,
                "labels": [label.name for label in issue.labels],
                "state": issue.state,
                "html_url": issue.html_url,
                "created_at": issue.created_at.isoformat(),
                "updated_at": issue.updated_at.isoformat()
            }
            
        except GithubException as e:
            logger.error(f"Failed to create epic issue: {e}")
            raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error creating epic issue: {e}")
            raise
    
    async def create_subtask_issue(self, title: str, description: str, epic_issue_number: int, 
                                  labels: List[str] = None, assignees: List[str] = None) -> Dict[str, Any]:
        """
        Create a GitHub issue that represents a CCPM subtask
        
        Args:
            title: Issue title
            description: Issue description/body
            epic_issue_number: Parent epic issue number
            labels: List of labels to apply
            assignees: List of GitHub usernames to assign
            
        Returns:
            Dictionary with issue information
        """
        try:
            # Ensure subtask label exists
            subtask_label = await self._ensure_subtask_label()
            
            # Prepare labels
            issue_labels = [subtask_label.name]
            if labels:
                issue_labels.extend(labels)
            
            # Create the issue
            issue = self.repo.create_issue(
                title=title,
                body=description,
                labels=issue_labels,
                assignees=assignees or []
            )
            
            # Link to epic by referencing it in the body
            epic_reference = f"\n\n---\n**Epic**: #{epic_issue_number}"
            updated_body = issue.body + epic_reference
            issue.edit(body=updated_body)
            
            logger.info(f"Created subtask issue: {issue.number} - {title}")
            
            return {
                "id": issue.number,
                "title": issue.title,
                "body": issue.body,
                "labels": [label.name for label in issue.labels],
                "state": issue.state,
                "html_url": issue.html_url,
                "epic_issue": epic_issue_number,
                "created_at": issue.created_at.isoformat(),
                "updated_at": issue.updated_at.isoformat()
            }
            
        except GithubException as e:
            logger.error(f"Failed to create subtask issue: {e}")
            raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error creating subtask issue: {e}")
            raise
    
    async def get_epic_issues(self, state: str = "open") -> List[Dict[str, Any]]:
        """
        Get all epic issues from the repository
        
        Args:
            state: Issue state filter ('open', 'closed', 'all')
            
        Returns:
            List of epic issues
        """
        try:
            epic_label = await self._ensure_epic_label()
            
            issues = self.repo.get_issues(
                state=state,
                labels=[epic_label.name]
            )
            
            epic_issues = []
            for issue in issues:
                epic_issues.append({
                    "id": issue.number,
                    "title": issue.title,
                    "body": issue.body,
                    "labels": [label.name for label in issue.labels],
                    "state": issue.state,
                    "html_url": issue.html_url,
                    "created_at": issue.created_at.isoformat(),
                    "updated_at": issue.updated_at.isoformat()
                })
            
            logger.info(f"Retrieved {len(epic_issues)} epic issues")
            return epic_issues
            
        except GithubException as e:
            logger.error(f"Failed to get epic issues: {e}")
            raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error getting epic issues: {e}")
            raise
    
    async def get_epic_subtasks(self, epic_issue_number: int) -> List[Dict[str, Any]]:
        """
        Get all subtasks for a specific epic
        
        Args:
            epic_issue_number: Epic issue number
            
        Returns:
            List of subtask issues
        """
        try:
            subtask_label = await self._ensure_subtask_label()
            
            # Search for issues that reference the epic
            query = f'repo:{self.repo_name} label:"{subtask_label.name}" "{epic_issue_number}"'
            issues = self.github.search_issues(query)
            
            subtasks = []
            for issue in issues:
                subtasks.append({
                    "id": issue.number,
                    "title": issue.title,
                    "body": issue.body,
                    "labels": [label.name for label in issue.labels],
                    "state": issue.state,
                    "html_url": issue.html_url,
                    "epic_issue": epic_issue_number,
                    "created_at": issue.created_at.isoformat(),
                    "updated_at": issue.updated_at.isoformat()
                })
            
            logger.info(f"Retrieved {len(subtasks)} subtasks for epic #{epic_issue_number}")
            return subtasks
            
        except GithubException as e:
            logger.error(f"Failed to get epic subtasks: {e}")
            raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error getting epic subtasks: {e}")
            raise
    
    async def update_issue_status(self, issue_number: int, state: str, 
                                 body_update: Optional[str] = None) -> Dict[str, Any]:
        """
        Update an issue's status and optionally body
        
        Args:
            issue_number: Issue number to update
            state: New state ('open' or 'closed')
            body_update: Optional body update text
            
        Returns:
            Updated issue information
        """
        try:
            issue = self.repo.get_issue(issue_number)
            
            if state == "closed":
                issue.edit(state="closed")
            elif state == "open":
                issue.edit(state="open")
            
            if body_update:
                issue.edit(body=body_update)
            
            logger.info(f"Updated issue #{issue_number} status to {state}")
            
            return {
                "id": issue.number,
                "title": issue.title,
                "body": issue.body,
                "labels": [label.name for label in issue.labels],
                "state": issue.state,
                "html_url": issue.html_url,
                "updated_at": issue.updated_at.isoformat()
            }
            
        except GithubException as e:
            logger.error(f"Failed to update issue #{issue_number}: {e}")
            raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error updating issue #{issue_number}: {e}")
            raise
    
    async def _ensure_epic_label(self) -> Label:
        """Ensure the epic label exists, create if it doesn't"""
        try:
            epic_label = self.repo.get_label("epic")
            return epic_label
        except GithubException:
            # Label doesn't exist, create it
            epic_label = self.repo.create_label(
                name="epic",
                color="6f42c1",  # Purple
                description="CCPM Epic - High-level feature or project"
            )
            logger.info("Created epic label")
            return epic_label
    
    async def _ensure_subtask_label(self) -> Label:
        """Ensure the subtask label exists, create if it doesn't"""
        try:
            subtask_label = self.repo.get_label("subtask")
            return subtask_label
        except GithubException:
            # Label doesn't exist, create it
            subtask_label = self.repo.create_label(
                name="subtask",
                color="0366d6",  # Blue
                description="CCPM Subtask - Individual work item"
            )
            logger.info("Created subtask label")
            return subtask_label
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test GitHub API connection and repository access
        
        Returns:
            Connection test results
        """
        try:
            # Test authentication
            user = self.github.get_user()
            
            # Test repository access
            repo_info = {
                "name": self.repo.name,
                "full_name": self.repo.full_name,
                "description": self.repo.description,
                "private": self.repo.private,
                "html_url": self.repo.html_url
            }
            
            # Test label creation
            epic_label = await self._ensure_epic_label()
            subtask_label = await self._ensure_subtask_label()
            
            return {
                "success": True,
                "authenticated_user": user.login,
                "repository": repo_info,
                "labels": {
                    "epic": epic_label.name,
                    "subtask": subtask_label.name
                },
                "message": "GitHub connection successful"
            }
            
        except Exception as e:
            logger.error(f"GitHub connection test failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "GitHub connection test failed"
            }
    
    def close(self):
        """Close GitHub connection"""
        if hasattr(self, 'github'):
            self.github.close()
            logger.info("GitHub connection closed")
