#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.cli.commands import CCPMCommandHandler

async def debug_subtask():
    handler = CCPMCommandHandler()
    
    # Test arguments
    arguments = {
        "title": "CLI-Test-Subtask",
        "description": "Testing-subtask-creation-through-CCPM-CLI",
        "epic_issue": "41"
    }
    
    print("Testing subtask creation with arguments:", arguments)
    
    try:
        result = await handler._create_github_subtask(arguments)
        print("Result:", result)
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(debug_subtask())
