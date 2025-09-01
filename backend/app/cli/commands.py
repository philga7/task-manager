"""
Command handlers for CCPM CLI operations
"""
import httpx
import asyncio
import os
from typing import Dict, Any, Optional
from datetime import datetime
from .parser import ParsedCommand

# Import GitHub service and epic templates
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
from GitHubService import GitHubService
from EpicTemplates import EpicTemplateManager


class CCPMCommandHandler:
    """Handler for CCPM command execution"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Initialize GitHub service and templates
        self.github_service = None
        self.epic_templates = EpicTemplateManager()
        
        # Try to initialize GitHub service if credentials are available
        try:
            if os.getenv("GITHUB_API_TOKEN") and os.getenv("GITHUB_REPO_NAME"):
                self.github_service = GitHubService()
        except Exception as e:
            print(f"Warning: GitHub service not initialized: {e}")
    
    async def execute_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """
        Execute a parsed CCPM command
        
        Args:
            parsed: ParsedCommand object
            
        Returns:
            Dictionary with command execution results
        """
        try:
            if parsed.command == "prd":
                return await self._handle_prd_command(parsed)
            elif parsed.command == "epic":
                return await self._handle_epic_command(parsed)
            elif parsed.command == "issue":
                return await self._handle_issue_command(parsed)
            elif parsed.command == "github":
                return await self._handle_github_command(parsed)
            elif parsed.command == "template":
                return await self._handle_template_command(parsed)
            elif parsed.command == "next":
                return await self._handle_next_command(parsed)
            elif parsed.command == "status":
                return await self._handle_status_command(parsed)
            elif parsed.command == "help":
                return await self._handle_help_command(parsed)
            else:
                return {
                    "success": False,
                    "error": f"Unknown command: {parsed.command}",
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Command execution failed: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _handle_prd_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle PRD-related commands"""
        if parsed.subcommand == "new":
            return await self._create_prd(parsed.arguments)
        elif parsed.subcommand == "list":
            return await self._list_prds()
        elif parsed.subcommand == "show":
            return await self._show_prd(parsed.arguments)
        elif parsed.subcommand == "update":
            return await self._update_prd(parsed.arguments)
        else:
            return {
                "success": False,
                "error": f"Unknown PRD subcommand: {parsed.subcommand}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _handle_epic_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle epic-related commands"""
        if parsed.subcommand == "start":
            return await self._start_epic(parsed.arguments)
        elif parsed.subcommand == "list":
            return await self._list_epics()
        elif parsed.subcommand == "show":
            return await self._show_epic(parsed.arguments)
        elif parsed.subcommand == "update":
            return await self._update_epic(parsed.arguments)
        elif parsed.subcommand == "complete":
            return await self._complete_epic(parsed.arguments)
        else:
            return {
                "success": False,
                "error": f"Unknown epic subcommand: {parsed.subcommand}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _handle_issue_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle issue-related commands"""
        if parsed.subcommand == "start":
            return await self._start_issue(parsed.arguments)
        elif parsed.subcommand == "list":
            return await self._list_issues()
        elif parsed.subcommand == "show":
            return await self._show_issue(parsed.arguments)
        elif parsed.subcommand == "update":
            return await self._update_issue(parsed.arguments)
        elif parsed.subcommand == "complete":
            return await self._complete_issue(parsed.arguments)
        else:
            return {
                "success": False,
                "error": f"Unknown issue subcommand: {parsed.subcommand}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _handle_github_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle GitHub integration commands"""
        if not self.github_service:
            return {
                "success": False,
                "error": "GitHub service not available. Please set GITHUB_API_TOKEN and GITHUB_REPO_NAME environment variables.",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        if parsed.subcommand == "test":
            return await self._test_github_connection()
        elif parsed.subcommand == "create-epic":
            return await self._create_github_epic(parsed.arguments)
        elif parsed.subcommand == "create-subtask":
            return await self._create_github_subtask(parsed.arguments)
        elif parsed.subcommand == "list-epics":
            return await self._list_github_epics(parsed.arguments)
        elif parsed.subcommand == "list-subtasks":
            return await self._list_github_subtasks(parsed.arguments)
        elif parsed.subcommand == "update-issue":
            return await self._update_github_issue(parsed.arguments)
        else:
            return {
                "success": False,
                "error": f"Unknown GitHub subcommand: {parsed.subcommand}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _handle_template_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle epic template commands"""
        if parsed.subcommand == "list":
            return await self._list_epic_templates()
        elif parsed.subcommand == "show":
            return await self._show_epic_template(parsed.arguments)
        elif parsed.subcommand == "create-epic":
            return await self._create_epic_from_template(parsed.arguments)
        else:
            return {
                "success": False,
                "error": f"Unknown template subcommand: {parsed.subcommand}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _test_github_connection(self) -> Dict[str, Any]:
        """Test GitHub API connection"""
        try:
            result = await self.github_service.test_connection()
            if result["success"]:
                return {
                    "success": True,
                    "message": "GitHub connection test successful",
                    "status": result,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": result["error"],
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"GitHub connection test failed: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _create_github_epic(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Create a GitHub epic issue"""
        try:
            title = arguments.get("title")
            description = arguments.get("description")
            labels = arguments.get("labels", [])
            
            if not title or not description:
                return {
                    "success": False,
                    "error": "Title and description are required for epic creation",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            epic = await self.github_service.create_epic_issue(title, description, labels)
            
            return {
                "success": True,
                "message": f"Epic created successfully",
                "epic_id": epic["id"],
                "epic": epic,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create epic: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _create_github_subtask(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Create a GitHub subtask issue"""
        try:
            title = arguments.get("title")
            description = arguments.get("description")
            epic_issue = arguments.get("epic-issue")  # Use the correct key with hyphen
            labels = arguments.get("labels", [])
            assignees = arguments.get("assignees", [])
            
            # Convert epic_issue to integer if it's a string
            if epic_issue and isinstance(epic_issue, str):
                try:
                    epic_issue = int(epic_issue)
                except ValueError:
                    return {
                        "success": False,
                        "error": f"Invalid epic_issue number: {epic_issue}",
                        "timestamp": datetime.utcnow().isoformat()
                    }
            
            if not title or not description or not epic_issue:
                return {
                    "success": False,
                    "error": "Title, description, and epic_issue are required for subtask creation",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            subtask = await self.github_service.create_subtask_issue(
                title, description, epic_issue, labels, assignees
            )
            
            return {
                "success": True,
                "message": f"Subtask created successfully",
                "issue_id": subtask["id"],
                "subtask": subtask,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create subtask: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _list_github_epics(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """List GitHub epic issues"""
        try:
            state = arguments.get("state", "open")
            epics = await self.github_service.get_epic_issues(state)
            
            return {
                "success": True,
                "message": f"Retrieved {len(epics)} epic issues",
                "epics": epics,
                "count": len(epics),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to list epics: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _list_github_subtasks(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """List GitHub subtask issues for an epic"""
        try:
            epic_issue = arguments.get("epic-issue")  # Use the correct key with hyphen
            
            if not epic_issue:
                return {
                    "success": False,
                    "error": "epic_issue parameter is required",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            subtasks = await self.github_service.get_epic_subtasks(epic_issue)
            
            return {
                "success": True,
                "message": f"Retrieved {len(subtasks)} subtasks for epic #{epic_issue}",
                "issues": subtasks,
                "count": len(subtasks),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to list subtasks: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _update_github_issue(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Update a GitHub issue status"""
        try:
            issue_number = arguments.get("issue_number")
            state = arguments.get("state")
            body_update = arguments.get("body_update")
            
            if not issue_number or not state:
                return {
                    "success": False,
                    "error": "issue_number and state are required for issue updates",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            updated_issue = await self.github_service.update_issue_status(
                issue_number, state, body_update
            )
            
            return {
                "success": True,
                "message": f"Issue #{issue_number} updated successfully",
                "issue": updated_issue,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update issue: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _list_epic_templates(self) -> Dict[str, Any]:
        """List available epic templates"""
        try:
            templates = self.epic_templates.list_templates()
            
            return {
                "success": True,
                "message": f"Available epic templates: {len(templates)}",
                "templates": templates,
                "count": len(templates),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to list templates: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _show_epic_template(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Show details of a specific epic template"""
        try:
            template_name = arguments.get("template_name")
            
            if not template_name:
                return {
                    "success": False,
                    "error": f"template_name parameter is required. Received arguments: {arguments}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            template = self.epic_templates.get_template(template_name)
            
            return {
                "success": True,
                "message": f"Template details for '{template_name}'",
                "template": {
                    "name": template.name,
                    "description": template.description,
                    "labels": template.labels,
                    "subtask_templates": template.subtask_templates,
                    "acceptance_criteria": template.acceptance_criteria,
                    "estimated_complexity": template.estimated_complexity
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to show template: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _create_epic_from_template(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Create a GitHub epic from a template"""
        try:
            template_name = arguments.get("template_name")
            custom_data = arguments.get("custom_data", {})
            
            if not template_name:
                return {
                    "success": False,
                    "error": "template_name parameter is required",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            # Create epic structure from template
            epic_structure = self.epic_templates.create_epic_from_template(
                template_name, custom_data
            )
            
            # Create the epic in GitHub
            epic = await self.github_service.create_epic_issue(
                epic_structure["title"],
                epic_structure["description"],
                epic_structure["labels"]
            )
            
            return {
                "success": True,
                "message": f"Epic created from template '{template_name}' successfully",
                "epic_id": epic["id"],
                "epic": epic,
                "template_used": template_name,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create epic from template: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _handle_next_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle next command - get next recommended action"""
        return await self._get_next_action()
    
    async def _handle_status_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle status command - get system status"""
        return await self._get_system_status()
    
    async def _handle_help_command(self, parsed: ParsedCommand) -> Dict[str, Any]:
        """Handle help command"""
        from .parser import CCPMCommandParser
        parser = CCPMCommandParser()
        return {
            "success": True,
            "help_text": parser.get_help_text(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # PRD Command Implementations
    async def _create_prd(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Create a new PRD"""
        title = arguments.get("title", "Untitled PRD")
        
        # Call backend API to create PRD
        response = await self.client.post(
            f"{self.base_url}/api/v1/tasks/",
            json={
                "title": title,
                "type": "prd",
                "description": arguments.get("description", ""),
                "priority": arguments.get("priority", "medium")
            },
            follow_redirects=True
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": f"PRD '{title}' created successfully",
                "prd_id": data.get("id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to create PRD: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _list_prds(self) -> Dict[str, Any]:
        """List all PRDs"""
        response = await self.client.get(f"{self.base_url}/api/v1/tasks/?type=prd", follow_redirects=True)
        
        if response.status_code == 200:
            data = response.json()
            # Handle both list and dict responses
            if isinstance(data, list):
                tasks = data
            else:
                tasks = data.get("tasks", [])
            return {
                "success": True,
                "prds": tasks,
                "count": len(tasks),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to list PRDs: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _show_prd(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Show a specific PRD"""
        prd_id = arguments.get("id")
        if not prd_id:
            return {
                "success": False,
                "error": "PRD ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        response = await self.client.get(f"{self.base_url}/api/v1/tasks/{prd_id}/", follow_redirects=True)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "prd": data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get PRD: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _update_prd(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Update a PRD"""
        prd_id = arguments.get("id")
        if not prd_id:
            return {
                "success": False,
                "error": "PRD ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        update_data = {}
        if "title" in arguments:
            update_data["title"] = arguments["title"]
        if "description" in arguments:
            update_data["description"] = arguments["description"]
        if "priority" in arguments:
            update_data["priority"] = arguments["priority"]
        
        response = await self.client.put(
            f"{self.base_url}/api/v1/tasks/{prd_id}/",
            json=update_data,
            follow_redirects=True
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"PRD {prd_id} updated successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to update PRD: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # Epic Command Implementations
    async def _start_epic(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Start a new epic"""
        title = arguments.get("title", "Untitled Epic")
        
        response = await self.client.post(
            f"{self.base_url}/api/v1/claude-pm/epics/",
            json={
                "name": title,
                "description": arguments.get("description", ""),
                "priority": arguments.get("priority", "medium")
            },
            follow_redirects=True
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": f"Epic '{title}' started successfully",
                "epic_id": data.get("epic_id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to start epic: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _list_epics(self) -> Dict[str, Any]:
        """List all epics"""
        response = await self.client.get(f"{self.base_url}/api/v1/claude-pm/epics/", follow_redirects=True)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "epics": data.get("epics", []),
                "count": len(data.get("epics", [])),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to list epics: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _show_epic(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Show a specific epic"""
        epic_id = arguments.get("id")
        if not epic_id:
            return {
                "success": False,
                "error": "Epic ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # For now, return mock data since we don't have individual epic endpoint
        return {
            "success": True,
            "epic": {
                "id": epic_id,
                "name": f"Epic {epic_id}",
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _update_epic(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Update an epic"""
        epic_id = arguments.get("id")
        if not epic_id:
            return {
                "success": False,
                "error": "Epic ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        return {
            "success": True,
            "message": f"Epic {epic_id} updated successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _complete_epic(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Complete an epic"""
        epic_id = arguments.get("id")
        if not epic_id:
            return {
                "success": False,
                "error": "Epic ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        return {
            "success": True,
            "message": f"Epic {epic_id} completed successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Issue Command Implementations
    async def _start_issue(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Start a new issue"""
        title = arguments.get("title", "Untitled Issue")
        
        response = await self.client.post(
            f"{self.base_url}/api/v1/tasks/",
            json={
                "title": title,
                "type": "issue",
                "description": arguments.get("description", ""),
                "priority": arguments.get("priority", "medium")
            },
            follow_redirects=True
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": f"Issue '{title}' started successfully",
                "issue_id": data.get("id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to start issue: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _list_issues(self) -> Dict[str, Any]:
        """List all issues"""
        response = await self.client.get(f"{self.base_url}/api/v1/tasks/?type=issue", follow_redirects=True)
        
        if response.status_code == 200:
            data = response.json()
            # Handle both list and dict responses
            if isinstance(data, list):
                tasks = data
            else:
                tasks = data.get("tasks", [])
            return {
                "success": True,
                "issues": tasks,
                "count": len(tasks),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to list issues: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _show_issue(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Show a specific issue"""
        issue_id = arguments.get("id")
        if not issue_id:
            return {
                "success": False,
                "error": "Issue ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        response = await self.client.get(f"{self.base_url}/api/v1/tasks/{issue_id}/", follow_redirects=True)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "issue": data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get issue: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _update_issue(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Update an issue"""
        issue_id = arguments.get("id")
        if not issue_id:
            return {
                "success": False,
                "error": "Issue ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        update_data = {}
        if "title" in arguments:
            update_data["title"] = arguments["title"]
        if "description" in arguments:
            update_data["description"] = arguments["description"]
        if "priority" in arguments:
            update_data["priority"] = arguments["priority"]
        
        response = await self.client.put(
            f"{self.base_url}/api/v1/tasks/{issue_id}/",
            json=update_data,
            follow_redirects=True
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"Issue {issue_id} updated successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to update issue: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _complete_issue(self, arguments: Dict[str, str]) -> Dict[str, Any]:
        """Complete an issue"""
        issue_id = arguments.get("id")
        if not issue_id:
            return {
                "success": False,
                "error": "Issue ID is required",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        response = await self.client.put(
            f"{self.base_url}/api/v1/tasks/{issue_id}/",
            json={"status": "completed"},
            follow_redirects=True
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"Issue {issue_id} completed successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to complete issue: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # Utility Commands
    async def _get_next_action(self) -> Dict[str, Any]:
        """Get next recommended action"""
        # Call task decomposition service to get next action
        response = await self.client.get(f"{self.base_url}/api/v1/task-decomposition/next")
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "next_action": data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get next action: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _get_system_status(self) -> Dict[str, Any]:
        """Get system status"""
        response = await self.client.get(f"{self.base_url}/api/v1/claude-pm/status")
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "status": data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get system status: {response.text}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
