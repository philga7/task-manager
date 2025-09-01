"""
Main CLI interface for CCPM commands
"""
import asyncio
import sys
import json
from typing import Optional
from .parser import CCPMCommandParser, ParsedCommand
from .commands import CCPMCommandHandler


class CCPMCLI:
    """Main CLI interface for CCPM commands"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.parser = CCPMCommandParser()
        self.handler = CCPMCommandHandler(base_url)
    
    async def execute(self, command_input: str, output_format: str = "text") -> str:
        """
        Execute a CCPM command
        
        Args:
            command_input: Raw command string
            output_format: Output format ("text" or "json")
            
        Returns:
            Formatted output string
        """
        try:
            # Parse the command
            parsed = self.parser.parse(command_input)
            
            # Validate the command
            if not self.parser.validate_command(parsed):
                return self._format_error(
                    f"Invalid command: {parsed.command}-{parsed.subcommand}",
                    output_format
                )
            
            # Execute the command
            result = await self.handler.execute_command(parsed)
            
            # Format the output
            return self._format_result(result, output_format)
            
        except ValueError as e:
            return self._format_error(str(e), output_format)
        except Exception as e:
            return self._format_error(f"Unexpected error: {str(e)}", output_format)
    
    def _format_result(self, result: dict, output_format: str) -> str:
        """Format command result for output"""
        if output_format == "json":
            return json.dumps(result, indent=2)
        else:
            return self._format_text_result(result)
    
    def _format_text_result(self, result: dict) -> str:
        """Format result as human-readable text"""
        if not result.get("success", False):
            return f"❌ Error: {result.get('error', 'Unknown error')}"
        
        # Handle different command types
        if "help_text" in result:
            return result["help_text"]
        
        if "message" in result:
            output = f"✅ {result['message']}"
            if "prd_id" in result:
                output += f"\n📄 PRD ID: {result['prd_id']}"
            elif "epic_id" in result:
                output += f"\n📋 Epic ID: {result['epic_id']}"
            elif "issue_id" in result:
                output += f"\n🐛 Issue ID: {result['issue_id']}"
            return output
        
        if "status" in result:
            status = result["status"]
            output = "📊 System Status:\n"
            output += f"  Status: {status.get('status', 'Unknown')}\n"
            output += f"  Claude PM Installed: {status.get('claude_pm_installed', False)}\n"
            if status.get('version'):
                output += f"  Version: {status['version']}\n"
            return output
        
        if "next_action" in result:
            action = result["next_action"]
            output = "🎯 Next Recommended Action:\n"
            output += f"  Action: {action.get('action', 'No action available')}\n"
            if action.get('description'):
                output += f"  Description: {action['description']}\n"
            return output
        
        if "prds" in result:
            prds = result["prds"]
            output = f"📄 PRDs ({result.get('count', 0)}):\n"
            for prd in prds:
                output += f"  • {prd.get('title', 'Untitled')} (ID: {prd.get('id', 'N/A')})\n"
            return output
        
        if "epics" in result:
            epics = result["epics"]
            output = f"📋 Epics ({result.get('count', 0)}):\n"
            for epic in epics:
                output += f"  • {epic.get('name', 'Untitled')} (ID: {epic.get('id', 'N/A')})\n"
            return output
        
        if "issues" in result:
            issues = result["issues"]
            output = f"🐛 Issues ({result.get('count', 0)}):\n"
            for issue in issues:
                output += f"  • {issue.get('title', 'Untitled')} (ID: {issue.get('id', 'N/A')})\n"
            return output
        
        if "prd" in result:
            prd = result["prd"]
            output = "📄 PRD Details:\n"
            output += f"  Title: {prd.get('title', 'Untitled')}\n"
            output += f"  ID: {prd.get('id', 'N/A')}\n"
            if prd.get('description'):
                output += f"  Description: {prd['description']}\n"
            return output
        
        if "epic" in result:
            epic = result["epic"]
            output = "📋 Epic Details:\n"
            output += f"  Name: {epic.get('name', 'Untitled')}\n"
            output += f"  ID: {epic.get('id', 'N/A')}\n"
            output += f"  Status: {epic.get('status', 'Unknown')}\n"
            return output
        
        if "issue" in result:
            issue = result["issue"]
            output = "🐛 Issue Details:\n"
            output += f"  Title: {issue.get('title', 'Untitled')}\n"
            output += f"  ID: {issue.get('id', 'N/A')}\n"
            if issue.get('description'):
                output += f"  Description: {issue['description']}\n"
            return output
        
        # Default fallback
        return f"✅ Command executed successfully\n{json.dumps(result, indent=2)}"
    
    def _format_error(self, error_message: str, output_format: str) -> str:
        """Format error message for output"""
        error_result = {
            "success": False,
            "error": error_message,
            "timestamp": "2025-08-30T17:03:18.000Z"
        }
        
        if output_format == "json":
            return json.dumps(error_result, indent=2)
        else:
            return f"❌ Error: {error_message}"
    
    async def close(self):
        """Close the CLI and cleanup resources"""
        await self.handler.close()


async def main():
    """Main CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="CCPM CLI Interface")
    parser.add_argument("command", nargs="?", help="CCPM command to execute")
    parser.add_argument("args", nargs="*", help="Additional arguments for the command")
    parser.add_argument("--url", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="Output format")
    parser.add_argument("--interactive", "-i", action="store_true", help="Run in interactive mode")
    
    args = parser.parse_args()
    
    cli = CCPMCLI(args.url)
    
    try:
        if args.interactive:
            await interactive_mode(cli, args.format)
        elif args.command:
            # Combine command with additional arguments
            full_command = args.command
            if args.args:
                full_command += " " + " ".join(args.args)
            result = await cli.execute(full_command, args.format)
            print(result)
        else:
            print("No command provided. Use --help for usage information.")
            print("Use --interactive for interactive mode.")
    finally:
        await cli.close()


async def interactive_mode(cli: CCPMCLI, output_format: str):
    """Run CLI in interactive mode"""
    print("🎯 CCPM CLI Interactive Mode")
    print("Type 'help' for available commands, 'quit' to exit")
    print("=" * 50)
    
    while True:
        try:
            command = input("ccpm> ").strip()
            
            if not command:
                continue
            
            if command.lower() in ["quit", "exit", "q"]:
                print("👋 Goodbye!")
                break
            
            if command.lower() == "help":
                result = await cli.execute("/pm:help", output_format)
                print(result)
                continue
            
            # Add /pm: prefix if not present
            if not command.startswith("/pm:"):
                command = f"/pm:{command}"
            
            result = await cli.execute(command, output_format)
            print(result)
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except EOFError:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())
