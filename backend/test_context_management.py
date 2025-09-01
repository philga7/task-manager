#!/usr/bin/env python3
"""
Test suite for context management and persistence system
"""
import unittest
import tempfile
import shutil
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add the backend directory to the Python path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models.Context import (
    ContextEntry, ContextSession, ContextCollection, ContextType,
    ContextStatus, ContextAccessLevel, ContextMetadata, ContextQuery
)
from app.services.ContextManager import ContextManager
from app.services.ContextIntegration import ContextIntegrationService
from app.services.AgentCommunication import AgentCommunicationService
from app.models.Messages import AgentInfo, AgentStatus


class TestContextManagement(unittest.TestCase):
    """Test cases for context management system"""
    
    def setUp(self):
        """Set up test environment"""
        # Create temporary directory for testing
        self.test_dir = tempfile.mkdtemp()
        self.context_manager = ContextManager(base_path=self.test_dir)
        
        # Initialize agent communication service
        self.agent_communication = AgentCommunicationService()
        self.agent_communication.start()
        
        # Initialize context integration service
        self.context_integration = ContextIntegrationService(
            self.context_manager, 
            self.agent_communication
        )
    
    def tearDown(self):
        """Clean up test environment"""
        # Stop services
        self.agent_communication.stop()
        
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_context_entry_creation(self):
        """Test creating context entries"""
        # Create a test context entry
        entry = self.context_manager.create_context_entry(
            context_type=ContextType.PROJECT_CONTEXT,
            key="test_project",
            value={"name": "Test Project", "description": "A test project"},
            created_by="test_user",
            description="Test project context",
            tags=["test", "project"],
            access_level=ContextAccessLevel.SHARED
        )
        
        self.assertIsNotNone(entry)
        self.assertEqual(entry.context_type, ContextType.PROJECT_CONTEXT)
        self.assertEqual(entry.key, "test_project")
        self.assertEqual(entry.value["name"], "Test Project")
        self.assertEqual(entry.metadata.created_by, "test_user")
        self.assertEqual(entry.status, ContextStatus.ACTIVE)
    
    def test_context_entry_retrieval(self):
        """Test retrieving context entries"""
        # Create an entry
        entry = self.context_manager.create_context_entry(
            context_type=ContextType.SESSION_CONTEXT,
            key="test_session",
            value={"session_data": "test"},
            created_by="test_user"
        )
        
        # Retrieve the entry
        retrieved_entry = self.context_manager.get_context_entry(entry.context_id)
        
        self.assertIsNotNone(retrieved_entry)
        self.assertEqual(retrieved_entry.context_id, entry.context_id)
        self.assertEqual(retrieved_entry.value["session_data"], "test")
    
    def test_context_entry_update(self):
        """Test updating context entries"""
        # Create an entry
        entry = self.context_manager.create_context_entry(
            context_type=ContextType.AGENT_CONTEXT,
            key="test_agent",
            value={"agent_name": "Test Agent"},
            created_by="test_user"
        )
        
        # Update the entry
        success = self.context_manager.update_context_entry(
            context_id=entry.context_id,
            value={"agent_name": "Updated Test Agent", "status": "active"},
            modified_by="test_user",
            description="Updated description"
        )
        
        self.assertTrue(success)
        
        # Verify the update
        updated_entry = self.context_manager.get_context_entry(entry.context_id)
        self.assertEqual(updated_entry.value["agent_name"], "Updated Test Agent")
        self.assertEqual(updated_entry.value["status"], "active")
        self.assertEqual(updated_entry.metadata.description, "Updated description")
        self.assertEqual(updated_entry.metadata.version, 2)
    
    def test_context_entry_deletion(self):
        """Test deleting context entries"""
        # Create an entry
        entry = self.context_manager.create_context_entry(
            context_type=ContextType.WORKSTREAM_CONTEXT,
            key="test_workstream",
            value={"workstream_data": "test"},
            created_by="test_user"
        )
        
        # Delete the entry
        success = self.context_manager.delete_context_entry(entry.context_id)
        
        self.assertTrue(success)
        
        # Verify deletion
        deleted_entry = self.context_manager.get_context_entry(entry.context_id)
        self.assertIsNone(deleted_entry)
    
    def test_context_query(self):
        """Test querying context entries"""
        # Create multiple entries
        self.context_manager.create_context_entry(
            context_type=ContextType.PROJECT_CONTEXT,
            key="project_1",
            value={"name": "Project 1"},
            created_by="user1",
            tags=["project", "active"]
        )
        
        self.context_manager.create_context_entry(
            context_type=ContextType.PROJECT_CONTEXT,
            key="project_2",
            value={"name": "Project 2"},
            created_by="user2",
            tags=["project", "inactive"]
        )
        
        self.context_manager.create_context_entry(
            context_type=ContextType.AGENT_CONTEXT,
            key="agent_1",
            value={"name": "Agent 1"},
            created_by="user1",
            tags=["agent"]
        )
        
        # Query by context type
        query = ContextQuery(context_type=ContextType.PROJECT_CONTEXT)
        results = self.context_manager.query_context_entries(query)
        
        self.assertEqual(len(results), 2)
        self.assertTrue(all(entry.context_type == ContextType.PROJECT_CONTEXT for entry in results))
        
        # Query by created_by
        query = ContextQuery(created_by="user1")
        results = self.context_manager.query_context_entries(query)
        
        self.assertEqual(len(results), 2)
        self.assertTrue(all(entry.metadata.created_by == "user1" for entry in results))
        
        # Query by tags
        query = ContextQuery(tags=["active"])
        results = self.context_manager.query_context_entries(query)
        
        self.assertEqual(len(results), 1)
        self.assertIn("active", results[0].metadata.tags)
    
    def test_session_management(self):
        """Test session management"""
        # Create a session
        session = self.context_manager.create_session(
            user_id="test_user",
            agent_id="test_agent",
            workstream_id="test_workstream",
            project_id="test_project"
        )
        
        self.assertIsNotNone(session)
        self.assertEqual(session.user_id, "test_user")
        self.assertEqual(session.agent_id, "test_agent")
        self.assertTrue(session.is_active)
        
        # Get the session
        retrieved_session = self.context_manager.get_session(session.session_id)
        
        self.assertIsNotNone(retrieved_session)
        self.assertEqual(retrieved_session.session_id, session.session_id)
        
        # Update session activity
        success = self.context_manager.update_session_activity(session.session_id)
        self.assertTrue(success)
        
        # Close the session
        success = self.context_manager.close_session(session.session_id)
        self.assertTrue(success)
        
        # Verify session is closed
        closed_session = self.context_manager.get_session(session.session_id)
        self.assertFalse(closed_session.is_active)
    
    def test_context_integration_with_agents(self):
        """Test context integration with agent communication"""
        # Create agent info
        agent_info = AgentInfo(
            agent_id="test_agent_1",
            agent_name="Test Agent 1",
            agent_type="test_agent",
            current_status=AgentStatus.AVAILABLE
        )
        
        # Register agent for context management
        success = self.context_integration.register_agent_context("test_agent_1", agent_info)
        self.assertTrue(success)
        
        # Set context for the agent
        success = self.context_integration.set_agent_context(
            agent_id="test_agent_1",
            context_type=ContextType.PROJECT_CONTEXT,
            key="current_project",
            value={"project_id": "proj_123", "name": "Test Project"},
            description="Current project context",
            tags=["current", "project"]
        )
        self.assertTrue(success)
        
        # Get context for the agent
        context_data = self.context_integration.get_agent_context("test_agent_1")
        
        self.assertIn("project_context", context_data)
        self.assertIn("current_project", context_data["project_context"])
        self.assertEqual(context_data["project_context"]["current_project"]["project_id"], "proj_123")
        
        # Subscribe to context updates
        success = self.context_integration.subscribe_to_context("test_agent_1", ContextType.PROJECT_CONTEXT)
        self.assertTrue(success)
        
        # Share context with agents
        success = self.context_integration.share_context_with_agents(
            context_type=ContextType.PROJECT_CONTEXT,
            key="shared_project",
            value={"project_id": "proj_456", "name": "Shared Project"},
            target_agents=["test_agent_1"],
            description="Shared project context"
        )
        self.assertTrue(success)
        
        # Unregister agent
        success = self.context_integration.unregister_agent_context("test_agent_1")
        self.assertTrue(success)
    
    def test_context_persistence(self):
        """Test that context persists across service restarts"""
        # Create a context entry
        entry = self.context_manager.create_context_entry(
            context_type=ContextType.SYSTEM_CONTEXT,
            key="system_config",
            value={"config": "test_config"},
            created_by="system"
        )
        
        # Create a new context manager instance (simulating restart)
        new_context_manager = ContextManager(base_path=self.test_dir)
        
        # Verify the entry still exists
        retrieved_entry = new_context_manager.get_context_entry(entry.context_id)
        
        self.assertIsNotNone(retrieved_entry)
        self.assertEqual(retrieved_entry.key, "system_config")
        self.assertEqual(retrieved_entry.value["config"], "test_config")
    
    def test_context_backup_and_restore(self):
        """Test backup and restore functionality"""
        # Create some test data
        self.context_manager.create_context_entry(
            context_type=ContextType.PROJECT_CONTEXT,
            key="backup_test_1",
            value={"name": "Backup Test 1"},
            created_by="test_user"
        )
        
        self.context_manager.create_context_entry(
            context_type=ContextType.AGENT_CONTEXT,
            key="backup_test_2",
            value={"name": "Backup Test 2"},
            created_by="test_user"
        )
        
        # Create a backup
        backup = self.context_manager.create_backup(
            name="Test Backup",
            created_by="test_user",
            description="Test backup for context management"
        )
        
        self.assertIsNotNone(backup)
        self.assertEqual(backup.name, "Test Backup")
        
        # Clear current data (simulate data loss)
        self.context_manager._entries_cache.clear()
        self.context_manager._sessions_cache.clear()
        self.context_manager._collections_cache.clear()
        
        # Restore from backup
        success = self.context_manager.restore_backup(backup.backup_id)
        self.assertTrue(success)
        
        # Verify data was restored
        query = ContextQuery()
        entries = self.context_manager.query_context_entries(query)
        
        self.assertGreaterEqual(len(entries), 2)
        
        # Check for specific entries
        backup_test_entries = [e for e in entries if "backup_test" in e.key]
        self.assertEqual(len(backup_test_entries), 2)
    
    def test_context_statistics(self):
        """Test context statistics"""
        # Create some test data
        self.context_manager.create_context_entry(
            context_type=ContextType.PROJECT_CONTEXT,
            key="stats_test_1",
            value={"name": "Stats Test 1"},
            created_by="user1"
        )
        
        self.context_manager.create_context_entry(
            context_type=ContextType.AGENT_CONTEXT,
            key="stats_test_2",
            value={"name": "Stats Test 2"},
            created_by="user2"
        )
        
        # Get statistics
        stats = self.context_manager.get_stats()
        
        self.assertGreaterEqual(stats.total_entries, 2)
        self.assertIn(ContextType.PROJECT_CONTEXT, stats.entries_by_type)
        self.assertIn(ContextType.AGENT_CONTEXT, stats.entries_by_type)
        self.assertGreater(stats.total_size_bytes, 0)
    
    def test_context_cleanup(self):
        """Test context cleanup functionality"""
        # Create an entry with expiration
        future_time = datetime.now(timezone.utc) + timedelta(seconds=1)
        entry = self.context_manager.create_context_entry(
            context_type=ContextType.SESSION_CONTEXT,
            key="expiring_entry",
            value={"data": "will expire"},
            created_by="test_user",
            expires_at=future_time
        )
        
        # Wait for expiration
        import time
        time.sleep(2)
        
        # Run cleanup
        expired_count = self.context_manager.cleanup_expired_entries()
        
        self.assertGreaterEqual(expired_count, 1)
        
        # Verify entry is marked as expired
        expired_entry = self.context_manager.get_context_entry(entry.context_id)
        self.assertEqual(expired_entry.status, ContextStatus.EXPIRED)


if __name__ == "__main__":
    # Run the tests
    unittest.main(verbosity=2)
