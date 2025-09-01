#!/usr/bin/env python3
"""
Test script for GitHub integration with CCPM
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.GitHubService import GitHubService

async def test_github_integration():
    """Test GitHub service integration"""
    print("🧪 Testing GitHub Integration for CCPM...")
    
    try:
        # Initialize GitHub service
        service = GitHubService()
        print("✅ GitHub service initialized")
        
        # Test connection
        print("\n🔗 Testing GitHub API connection...")
        result = await service.test_connection()
        print(f"Connection result: {result}")
        
        if result.get("success"):
            print("✅ GitHub connection successful!")
            
            # Test creating a test epic
            print("\n📋 Testing epic creation...")
            epic = await service.create_epic_issue(
                title="CCPM Integration Test Epic",
                description="This is a test epic to verify GitHub integration with CCPM.",
                labels=["ccpm-integration", "test", "ccpm-epic"]
            )
            print(f"Epic created: {epic}")
            
            # Test creating a subtask - use 'id' instead of 'number'
            print("\n🐛 Testing subtask creation...")
            subtask = await service.create_subtask_issue(
                title="Test Subtask",
                description="This is a test subtask to verify the hierarchy.",
                epic_issue_number=epic["id"],  # Use 'id' key
                labels=["ccpm-subtask", "test"],
                assignees=[]
            )
            print(f"Subtask created: {subtask}")
            
            # Test listing epics
            print("\n📋 Testing epic listing...")
            epics = await service.get_epic_issues("open")
            print(f"Found {len(epics)} open epics")
            
            # Test listing subtasks
            print("\n🐛 Testing subtask listing...")
            subtasks = await service.get_epic_subtasks(epic["id"])  # Use 'id' key
            print(f"Found {len(subtasks)} subtasks for epic #{epic['id']}")
            
            print("\n🎉 All GitHub integration tests passed!")
            
        else:
            print(f"❌ GitHub connection failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Error testing GitHub integration: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_github_integration())
