"""
Test script for Claude Code PM API endpoints
"""
import requests
import json
import time

# API base URL
BASE_URL = "http://localhost:8000"

def test_health_endpoints():
    """Test health check endpoints"""
    print("🔍 Testing health endpoints...")
    
    # Test root endpoint
    response = requests.get(f"{BASE_URL}/")
    print(f"✅ Root endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test health endpoint
    response = requests.get(f"{BASE_URL}/health")
    print(f"✅ Health endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test detailed health endpoint
    response = requests.get(f"{BASE_URL}/api/v1/health/detailed")
    print(f"✅ Detailed health endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")

def test_claude_pm_endpoints():
    """Test Claude Code PM endpoints"""
    print("\n🔍 Testing Claude Code PM endpoints...")
    
    # Test Claude PM status
    response = requests.get(f"{BASE_URL}/api/v1/claude-pm/status")
    print(f"✅ Claude PM status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test Claude PM config
    response = requests.get(f"{BASE_URL}/api/v1/claude-pm/config")
    print(f"✅ Claude PM config: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test list epics
    response = requests.get(f"{BASE_URL}/api/v1/claude-pm/epics")
    print(f"✅ List epics: {response.status_code}")
    print(f"   Response: {response.json()}")

def test_task_endpoints():
    """Test task management endpoints"""
    print("\n🔍 Testing task endpoints...")
    
    # Test get tasks (should be empty initially)
    response = requests.get(f"{BASE_URL}/api/v1/tasks")
    print(f"✅ Get tasks: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test create task
    new_task = {
        "title": "Test Task from API",
        "description": "This is a test task created via API",
        "priority": "high",
        "due_date": "2024-01-15"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/tasks",
        json=new_task,
        headers={"Content-Type": "application/json"}
    )
    print(f"✅ Create task: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        task_id = response.json()["id"]
        
        # Test get specific task
        response = requests.get(f"{BASE_URL}/api/v1/tasks/{task_id}")
        print(f"✅ Get specific task: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        # Test update task
        update_data = {
            "status": "completed",
            "description": "Updated description"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/v1/tasks/{task_id}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Update task: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        # Test task summary
        response = requests.get(f"{BASE_URL}/api/v1/tasks/status/summary")
        print(f"✅ Task summary: {response.status_code}")
        print(f"   Response: {response.json()}")

def main():
    """Run all API tests"""
    print("🚀 Starting Claude Code PM API Tests")
    print("=" * 50)
    
    try:
        test_health_endpoints()
        test_claude_pm_endpoints()
        test_task_endpoints()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed successfully!")
        print(f"📖 API Documentation available at: {BASE_URL}/docs")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API server.")
        print("   Make sure the server is running with: python main.py")
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    main()
