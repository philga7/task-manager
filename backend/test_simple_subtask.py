#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.GitHubService import GitHubService

async def test_simple_subtask():
    """Test simple subtask creation"""
    print("Testing simple subtask creation...")
    
    try:
        service = GitHubService()
        
        # Test with hardcoded values
        title = "Test Subtask"
        description = "Test Description"
        epic_issue_number = 41
        labels = ["test"]
        assignees = []
        
        print(f"Creating subtask with:")
        print(f"  title: {title}")
        print(f"  description: {description}")
        print(f"  epic_issue_number: {epic_issue_number} (type: {type(epic_issue_number)})")
        print(f"  labels: {labels}")
        print(f"  assignees: {assignees}")
        
        result = await service.create_subtask_issue(
            title, description, epic_issue_number, labels, assignees
        )
        
        print(f"Success! Created subtask: {result}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_simple_subtask())
