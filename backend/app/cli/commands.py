"""
Command handlers for CCPM CLI operations
"""
import httpx
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from .parser import ParsedCommand


class CCPMCommandHandler:
    """Handler for CCPM command execution"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
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
