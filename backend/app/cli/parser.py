"""
Command parser for CCPM-style CLI commands
"""
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ParsedCommand:
    """Represents a parsed CLI command"""
    command: str
    subcommand: str
    arguments: Dict[str, str]
    flags: List[str]
    raw_input: str


class CCPMCommandParser:
    """Parser for CCPM-style commands"""
    
    def __init__(self):
        # Supported CCPM commands
        self.supported_commands = {
            "prd": ["new", "list", "show", "update"],
            "epic": ["start", "list", "show", "update", "complete"],
            "issue": ["start", "list", "show", "update", "complete"],
            "github": ["test", "create-epic", "create-subtask", "list-epics", "list-subtasks", "update-issue"],
            "template": ["list", "show", "create-epic"],
            "next": [],  # No subcommands for next
            "status": [],  # No subcommands for status
            "help": []  # No subcommands for help
        }
    
    def parse(self, command_input: str) -> ParsedCommand:
        """
        Parse a CCPM command string
        
        Args:
            command_input: Raw command string (e.g., "/pm:prd-new --title='My PRD'")
            
        Returns:
            ParsedCommand object with parsed components
        """
        # Remove leading/trailing whitespace
        command_input = command_input.strip()
        
        # Extract the main command part (after /pm:)
        if not command_input.startswith("/pm:"):
            raise ValueError("Command must start with '/pm:'")
        
        # Remove /pm: prefix
        command_part = command_input[4:]
        
        # Split into command and arguments
        parts = command_part.split(" ", 1)
        command_subcommand = parts[0]
        arguments_part = parts[1] if len(parts) > 1 else ""
        
        # Parse command and subcommand
        command, subcommand = self._parse_command_subcommand(command_subcommand)
        
        # Parse arguments and flags
        arguments, flags = self._parse_arguments(arguments_part)
        
        return ParsedCommand(
            command=command,
            subcommand=subcommand,
            arguments=arguments,
            flags=flags,
            raw_input=command_input
        )
    
    def _parse_command_subcommand(self, command_part: str) -> Tuple[str, str]:
        """Parse command and subcommand from command part"""
        if "-" in command_part:
            command, subcommand = command_part.split("-", 1)
        else:
            command = command_part
            subcommand = ""
        
        return command, subcommand
    
    def _parse_arguments(self, arguments_part: str) -> Tuple[Dict[str, str], List[str]]:
        """Parse arguments and flags from arguments part"""
        arguments = {}
        flags = []
        
        if not arguments_part:
            return arguments, flags
        
        # Split by spaces, but respect quoted strings
        parts = self._split_respecting_quotes(arguments_part)
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            if part.startswith("--"):
                # Check if it's a key-value argument
                if "=" in part:
                    # Key-value argument: --key=value
                    key_value = part[2:]  # Remove -- prefix
                    key, value = key_value.split("=", 1)
                    # Remove quotes from value
                    value = value.strip("'\"")
                    arguments[key] = value
                else:
                    # Flag: --flag
                    flag = part[2:]
                    flags.append(flag)
            elif part.startswith("-"):
                # Short flag
                flag = part[1:]
                flags.append(flag)
            elif "=" in part:
                # Key-value argument without -- prefix
                key, value = part.split("=", 1)
                # Remove quotes from value
                value = value.strip("'\"")
                arguments[key] = value
            else:
                # Positional argument (use as title if no title specified)
                if "title" not in arguments:
                    arguments["title"] = part
        
        return arguments, flags
    
    def _split_respecting_quotes(self, text: str) -> List[str]:
        """Split text by spaces while respecting quoted strings"""
        parts = []
        current_part = ""
        in_quotes = False
        quote_char = None
        
        for char in text:
            if char in ['"', "'"] and not in_quotes:
                in_quotes = True
                quote_char = char
                current_part += char
            elif char == quote_char and in_quotes:
                in_quotes = False
                quote_char = None
                current_part += char
            elif char == " " and not in_quotes:
                if current_part:
                    parts.append(current_part)
                    current_part = ""
            else:
                current_part += char
        
        if current_part:
            parts.append(current_part)
        
        return parts
    
    def validate_command(self, parsed: ParsedCommand) -> bool:
        """Validate if the parsed command is supported"""
        if parsed.command not in self.supported_commands:
            return False
        
        if parsed.subcommand and parsed.subcommand not in self.supported_commands[parsed.command]:
            return False
        
        return True
    
    def get_help_text(self) -> str:
        """Get help text for supported commands"""
        help_text = "Supported CCPM Commands:\n\n"
        
        for command, subcommands in self.supported_commands.items():
            help_text += f"/pm:{command}"
            if subcommands:
                help_text += f"-<subcommand>\n"
                for subcommand in subcommands:
                    help_text += f"  - {subcommand}\n"
            else:
                help_text += "\n"
            help_text += "\n"
        
        help_text += "Examples:\n"
        help_text += "  /pm:prd-new --title='My Product Requirements'\n"
        help_text += "  /pm:epic-start --title='User Authentication Epic'\n"
        help_text += "  /pm:issue-start --title='Implement Login Form'\n"
        help_text += "  /pm:next\n"
        help_text += "  /pm:status\n"
        
        return help_text
