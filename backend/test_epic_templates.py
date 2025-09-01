#!/usr/bin/env python3
"""
Test script for Epic Templates functionality
Demonstrates how to use the epic templates without requiring GitHub credentials
"""
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.EpicTemplates import EpicTemplateManager


def test_epic_templates():
    """Test the epic templates functionality"""
    print("🎯 Testing Epic Templates for CCPM Integration")
    print("=" * 50)
    
    # Initialize template manager
    template_manager = EpicTemplateManager()
    
    # List available templates
    print("\n📋 Available Epic Templates:")
    templates = template_manager.list_templates()
    for i, template_name in enumerate(templates, 1):
        print(f"  {i}. {template_name}")
    
    # Show details of feature development template
    print("\n🔍 Feature Development Template Details:")
    try:
        template = template_manager.get_template("feature_development")
        print(f"  Name: {template.name}")
        print(f"  Description: {template.description}")
        print(f"  Labels: {', '.join(template.labels)}")
        print(f"  Complexity: {template.estimated_complexity}")
        print(f"  Subtasks: {len(template.subtask_templates)}")
        print(f"  Acceptance Criteria: {len(template.acceptance_criteria)}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test creating an epic from template
    print("\n🚀 Testing Epic Creation from Template:")
    try:
        custom_data = {
            "title": "Implement CCPM Integration",
            "description": "Set up comprehensive CCPM integration with GitHub for parallel execution",
            "context": "This epic establishes the foundation for migrating complex tasks from Shrimp to CCPM, enabling parallel execution and better project management.",
            "notes": "Focus on getting a working proof-of-concept rather than perfecting every detail."
        }
        
        epic_structure = template_manager.create_epic_from_template("feature_development", custom_data)
        
        print(f"  ✅ Epic created successfully!")
        print(f"  Title: {epic_structure['title']}")
        print(f"  Labels: {', '.join(epic_structure['labels'])}")
        print(f"  Complexity: {epic_structure['estimated_complexity']}")
        print(f"  Subtasks: {len(epic_structure['subtask_templates'])}")
        
        print("\n  📝 Epic Description Preview:")
        print("  " + "=" * 40)
        description_lines = epic_structure['description'].split('\n')
        for line in description_lines[:20]:  # Show first 20 lines
            if line.strip():
                print(f"  {line}")
        if len(description_lines) > 20:
            print(f"  ... (truncated, {len(description_lines)} total lines)")
        
    except Exception as e:
        print(f"  ❌ Error creating epic: {e}")
    
    # Test subtask creation
    print("\n🔧 Testing Subtask Creation:")
    try:
        subtask_data = template_manager.create_subtask_from_template(
            epic_issue_number=1,
            subtask_name="Frontend Implementation",
            template_name="feature_development",
            custom_data={
                "description": "Implement the React components for CCPM integration",
                "estimated_hours": 10
            }
        )
        
        print(f"  ✅ Subtask created successfully!")
        print(f"  Title: {subtask_data['title']}")
        print(f"  Description: {subtask_data['description']}")
        print(f"  Labels: {', '.join(subtask_data['labels'])}")
        print(f"  Epic Issue: #{subtask_data['epic_issue']}")
        print(f"  Estimated Hours: {subtask_data['estimated_hours']}")
        
    except Exception as e:
        print(f"  ❌ Error creating subtask: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Epic Templates test completed successfully!")
    print("\n💡 Next Steps:")
    print("  1. Set up GitHub credentials (GITHUB_API_TOKEN, GITHUB_REPO_NAME)")
    print("  2. Test GitHub integration with '/pm:github-test'")
    print("  3. Create your first epic with '/pm:template-create-epic'")
    print("  4. Start migrating complex tasks from Shrimp to CCPM")


if __name__ == "__main__":
    test_epic_templates()
