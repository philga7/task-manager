"""
Test suite for workstreams API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from app.api.main import api_router
from app.api.endpoints.workstreams import workstreams_db

# Create test client
client = TestClient(api_router)

class TestWorkstreamsAPI:
    """Test class for workstreams API endpoints"""
    
    def setup_method(self):
        """Setup method to clear test data before each test"""
        workstreams_db.clear()
    
    def test_create_workstream(self):
        """Test creating a new workstream"""
        workstream_data = {
            "name": "Test Workstream",
            "description": "Test workstream description",
            "priority": "high",
            "estimatedDuration": 120,
            "assignedAgents": ["agent-1", "agent-2"],
            "dependencies": [],
            "metadata": {"tags": ["test"], "customFields": {}}
        }
        
        response = client.post("/workstreams/", json=workstream_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == workstream_data["name"]
        assert data["description"] == workstream_data["description"]
        assert data["priority"] == workstream_data["priority"]
        assert data["status"] == "pending"
        assert data["estimatedDuration"] == workstream_data["estimatedDuration"]
        assert "id" in data
        assert "createdAt" in data
        assert "updatedAt" in data
    
    def test_get_workstreams(self):
        """Test getting all workstreams"""
        # Create test workstreams
        workstream1 = {
            "name": "Workstream 1",
            "description": "Description 1",
            "priority": "high",
            "estimatedDuration": 60
        }
        workstream2 = {
            "name": "Workstream 2",
            "description": "Description 2",
            "priority": "medium",
            "estimatedDuration": 90
        }
        
        client.post("/workstreams/", json=workstream1)
        client.post("/workstreams/", json=workstream2)
        
        response = client.get("/workstreams/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert any(ws["name"] == "Workstream 1" for ws in data)
        assert any(ws["name"] == "Workstream 2" for ws in data)
    
    def test_get_workstream_by_id(self):
        """Test getting a specific workstream by ID"""
        # Create a workstream
        workstream_data = {
            "name": "Test Workstream",
            "description": "Test description",
            "priority": "medium",
            "estimatedDuration": 60
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Get the workstream by ID
        response = client.get(f"/workstreams/{workstream_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == workstream_id
        assert data["name"] == workstream_data["name"]
    
    def test_get_nonexistent_workstream(self):
        """Test getting a workstream that doesn't exist"""
        response = client.get("/workstreams/nonexistent-id")
        
        assert response.status_code == 404
        assert "Workstream not found" in response.json()["detail"]
    
    def test_update_workstream(self):
        """Test updating an existing workstream"""
        # Create a workstream
        workstream_data = {
            "name": "Original Name",
            "description": "Original description",
            "priority": "low",
            "estimatedDuration": 30
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Update the workstream
        update_data = {
            "name": "Updated Name",
            "priority": "high",
            "estimatedDuration": 60
        }
        
        response = client.put(f"/workstreams/{workstream_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["priority"] == "high"
        assert data["estimatedDuration"] == 60
        assert data["description"] == "Original description"  # Should remain unchanged
    
    def test_delete_workstream(self):
        """Test deleting a workstream"""
        # Create a workstream
        workstream_data = {
            "name": "To Delete",
            "description": "Will be deleted",
            "priority": "medium",
            "estimatedDuration": 45
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Delete the workstream
        response = client.delete(f"/workstreams/{workstream_id}")
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify it's gone
        get_response = client.get(f"/workstreams/{workstream_id}")
        assert get_response.status_code == 404
    
    def test_start_workstream(self):
        """Test starting a workstream"""
        # Create a workstream
        workstream_data = {
            "name": "To Start",
            "description": "Will be started",
            "priority": "high",
            "estimatedDuration": 60
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Start the workstream
        response = client.post(f"/workstreams/{workstream_id}/start")
        
        assert response.status_code == 200
        assert "started successfully" in response.json()["message"]
        
        # Verify status changed
        get_response = client.get(f"/workstreams/{workstream_id}")
        data = get_response.json()
        assert data["status"] == "running"
        assert data["startTime"] is not None
    
    def test_complete_workstream(self):
        """Test completing a workstream"""
        # Create and start a workstream
        workstream_data = {
            "name": "To Complete",
            "description": "Will be completed",
            "priority": "medium",
            "estimatedDuration": 45
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Start the workstream
        client.post(f"/workstreams/{workstream_id}/start")
        
        # Complete the workstream
        response = client.post(f"/workstreams/{workstream_id}/complete")
        
        assert response.status_code == 200
        assert "completed successfully" in response.json()["message"]
        
        # Verify status changed
        get_response = client.get(f"/workstreams/{workstream_id}")
        data = get_response.json()
        assert data["status"] == "completed"
        assert data["completionTime"] is not None
        assert data["actualDuration"] is not None
    
    def test_block_workstream(self):
        """Test blocking a workstream"""
        # Create a workstream
        workstream_data = {
            "name": "To Block",
            "description": "Will be blocked",
            "priority": "low",
            "estimatedDuration": 30
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Block the workstream
        response = client.post(f"/workstreams/{workstream_id}/block?reason=Test blocking")
        
        assert response.status_code == 200
        assert "blocked successfully" in response.json()["message"]
        
        # Verify status changed
        get_response = client.get(f"/workstreams/{workstream_id}")
        data = get_response.json()
        assert data["status"] == "blocked"
        assert data["metadata"]["blockReason"] == "Test blocking"
    
    def test_workstream_summary(self):
        """Test getting workstream summary statistics"""
        # Create workstreams in different states
        workstreams = [
            {"name": "Pending 1", "description": "Pending", "priority": "medium", "estimatedDuration": 60},
            {"name": "Pending 2", "description": "Pending", "priority": "high", "estimatedDuration": 90},
            {"name": "Running 1", "description": "Running", "priority": "low", "estimatedDuration": 45}
        ]
        
        workstream_ids = []
        for ws in workstreams:
            response = client.post("/workstreams/", json=ws)
            workstream_ids.append(response.json()["id"])
        
        # Start one workstream
        client.post(f"/workstreams/{workstream_ids[2]}/start")
        
        # Get summary
        response = client.get("/workstreams/status/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_workstreams"] == 3
        assert data["pending_workstreams"] == 2
        assert data["running_workstreams"] == 1
        assert data["completed_workstreams"] == 0
        assert data["blocked_workstreams"] == 0
    
    def test_workstream_dependencies(self):
        """Test workstream dependency management"""
        # Create two workstreams
        ws1_data = {
            "name": "Dependency Workstream",
            "description": "Will have dependencies",
            "priority": "high",
            "estimatedDuration": 60
        }
        ws2_data = {
            "name": "Dependent Workstream",
            "description": "Depends on first",
            "priority": "medium",
            "estimatedDuration": 45
        }
        
        ws1_response = client.post("/workstreams/", json=ws1_data)
        ws2_response = client.post("/workstreams/", json=ws2_data)
        
        ws1_id = ws1_response.json()["id"]
        ws2_id = ws2_response.json()["id"]
        
        # Add dependency
        response = client.post(f"/workstreams/{ws2_id}/dependencies?dependency_id={ws1_id}")
        
        assert response.status_code == 200
        assert "added" in response.json()["message"]
        
        # Get dependencies
        deps_response = client.get(f"/workstreams/{ws2_id}/dependencies")
        
        assert deps_response.status_code == 200
        data = deps_response.json()
        assert data["total_dependencies"] == 1
        assert data["dependencies"][0]["id"] == ws1_id
    
    def test_remove_workstream_dependency(self):
        """Test removing workstream dependencies"""
        # Create two workstreams
        ws1_data = {
            "name": "Dependency Workstream",
            "description": "Will be a dependency",
            "priority": "low",
            "estimatedDuration": 30
        }
        ws2_data = {
            "name": "Dependent Workstream",
            "description": "Has dependency",
            "priority": "medium",
            "estimatedDuration": 45
        }
        
        ws1_response = client.post("/workstreams/", json=ws1_data)
        ws2_response = client.post("/workstreams/", json=ws2_data)
        
        ws1_id = ws1_response.json()["id"]
        ws2_id = ws2_response.json()["id"]
        
        # Add dependency
        client.post(f"/workstreams/{ws2_id}/dependencies?dependency_id={ws1_id}")
        
        # Remove dependency
        response = client.delete(f"/workstreams/{ws2_id}/dependencies/{ws1_id}")
        
        assert response.status_code == 200
        assert "removed" in response.json()["message"]
        
        # Verify dependency is gone
        deps_response = client.get(f"/workstreams/{ws2_id}/dependencies")
        data = deps_response.json()
        assert data["total_dependencies"] == 0
    
    def test_invalid_workstream_operations(self):
        """Test invalid workstream operations"""
        # Create a workstream
        workstream_data = {
            "name": "Test Workstream",
            "description": "Test description",
            "priority": "medium",
            "estimatedDuration": 60
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Try to start an already started workstream
        client.post(f"/workstreams/{workstream_id}/start")
        response = client.post(f"/workstreams/{workstream_id}/start")
        
        assert response.status_code == 400
        assert "not in pending status" in response.json()["detail"]
        
        # Try to complete a non-running workstream
        response = client.post(f"/workstreams/{workstream_id}/complete")
        
        assert response.status_code == 400
        assert "not running" in response.json()["detail"]
    
    def test_workstream_validation(self):
        """Test workstream data validation"""
        # Test missing required fields
        invalid_workstream = {
            "description": "Missing name",
            "priority": "high"
        }
        
        response = client.post("/workstreams/", json=invalid_workstream)
        
        assert response.status_code == 422  # Validation error
        
        # Test invalid priority
        invalid_priority = {
            "name": "Test",
            "description": "Test",
            "priority": "invalid",
            "estimatedDuration": 60
        }
        
        response = client.post("/workstreams/", json=invalid_priority)
        
        assert response.status_code == 422  # Validation error
    
    def test_concurrent_workstream_operations(self):
        """Test concurrent workstream operations"""
        # Create a workstream
        workstream_data = {
            "name": "Concurrent Test",
            "description": "Testing concurrent operations",
            "priority": "high",
            "estimatedDuration": 60
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Start multiple operations concurrently
        import threading
        import time
        
        results = []
        
        def start_workstream():
            response = client.post(f"/workstreams/{workstream_id}/start")
            results.append(response.status_code)
        
        def complete_workstream():
            time.sleep(0.1)  # Small delay to ensure start happens first
            response = client.post(f"/workstreams/{workstream_id}/complete")
            results.append(response.status_code)
        
        # Start threads
        start_thread = threading.Thread(target=start_workstream)
        complete_thread = threading.Thread(target=complete_workstream)
        
        start_thread.start()
        complete_thread.start()
        
        # Wait for both to complete
        start_thread.join()
        complete_thread.join()
        
        # Verify operations completed
        assert len(results) == 2
        assert 200 in results  # At least one should succeed
    
    def test_workstream_metadata(self):
        """Test workstream metadata handling"""
        # Create workstream with metadata
        workstream_data = {
            "name": "Metadata Test",
            "description": "Testing metadata",
            "priority": "medium",
            "estimatedDuration": 45,
            "metadata": {
                "tags": ["test", "metadata"],
                "customFields": {
                    "project": "Test Project",
                    "owner": "Test User"
                }
            }
        }
        
        response = client.post("/workstreams/", json=workstream_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["metadata"]["tags"] == ["test", "metadata"]
        assert data["metadata"]["customFields"]["project"] == "Test Project"
        assert data["metadata"]["customFields"]["owner"] == "Test User"
    
    def test_workstream_priority_handling(self):
        """Test workstream priority handling"""
        priorities = ["low", "medium", "high"]
        
        for priority in priorities:
            workstream_data = {
                "name": f"Priority {priority}",
                "description": f"Testing {priority} priority",
                "priority": priority,
                "estimatedDuration": 60
            }
            
            response = client.post("/workstreams/", json=workstream_data)
            assert response.status_code == 200
            
            data = response.json()
            assert data["priority"] == priority
    
    def test_workstream_duration_calculation(self):
        """Test workstream duration calculation"""
        # Create and start a workstream
        workstream_data = {
            "name": "Duration Test",
            "description": "Testing duration calculation",
            "priority": "medium",
            "estimatedDuration": 30
        }
        
        create_response = client.post("/workstreams/", json=workstream_data)
        workstream_id = create_response.json()["id"]
        
        # Start the workstream
        client.post(f"/workstreams/{workstream_id}/start")
        
        # Wait a moment
        import time
        time.sleep(0.1)
        
        # Complete the workstream
        client.post(f"/workstreams/{workstream_id}/complete")
        
        # Verify duration calculation
        get_response = client.get(f"/workstreams/{workstream_id}")
        data = get_response.json()
        
        assert data["actualDuration"] is not None
        assert data["actualDuration"] > 0
        assert data["estimatedDuration"] == 30
