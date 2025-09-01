#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.cli.parser import CCPMCommandParser

def debug_parser():
    parser = CCPMCommandParser()
    
    test_commands = [
        "/pm:github-create-epic --title=CCPM-CLI-Test-Epic --description=Testing-epic-creation-through-CCPM-CLI",
        "/pm:github-create-epic --title='CCPM CLI Test Epic' --description='Testing epic creation through CCPM CLI'",
        "/pm:github-create-epic --title=Test --description=TestDesc",
        "/pm:github-create-subtask --title=CLI-Test-Subtask --description=Testing-subtask-creation-through-CCPM-CLI --epic-issue=41"
    ]
    
    for cmd in test_commands:
        print(f"\nTesting command: {cmd}")
        try:
            parsed = parser.parse(cmd)
            print(f"  Command: {parsed.command}")
            print(f"  Subcommand: {parsed.subcommand}")
            print(f"  Arguments: {parsed.arguments}")
            print(f"  Flags: {parsed.flags}")
            print(f"  Valid: {parser.validate_command(parsed)}")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    debug_parser()
