"""
Epic Templates for CCPM Integration
Standardized templates for different types of tasks to ensure consistency
"""
from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class EpicTemplate:
    """Base epic template structure"""
    name: str
    description: str
    labels: List[str]
    subtask_templates: List[Dict[str, Any]]
    acceptance_criteria: List[str]
    estimated_complexity: str


class EpicTemplateManager:
    """Manager for epic templates and creation"""
    
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self) -> Dict[str, EpicTemplate]:
        """Initialize the standard epic templates"""
        return {
            "feature_development": EpicTemplate(
                name="Feature Development Epic",
                description="Standard template for new feature development",
                labels=["feature", "enhancement"],
                subtask_templates=[
                    {
                        "name": "Requirements Analysis",
                        "description": "Analyze and document feature requirements",
                        "labels": ["planning", "analysis"],
                        "estimated_hours": 2
                    },
                    {
                        "name": "UI/UX Design",
                        "description": "Create user interface designs and user experience flows",
                        "labels": ["design", "ui/ux"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Frontend Implementation",
                        "description": "Implement the frontend components and logic",
                        "labels": ["frontend", "implementation"],
                        "estimated_hours": 8
                    },
                    {
                        "name": "Backend Implementation",
                        "description": "Implement backend services and API endpoints",
                        "labels": ["backend", "implementation"],
                        "estimated_hours": 6
                    },
                    {
                        "name": "Testing",
                        "description": "Create and execute test cases",
                        "labels": ["testing", "qa"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Documentation",
                        "description": "Update documentation and create user guides",
                        "labels": ["documentation"],
                        "estimated_hours": 2
                    }
                ],
                acceptance_criteria=[
                    "Feature meets all documented requirements",
                    "UI/UX follows design specifications",
                    "Frontend and backend are properly integrated",
                    "All tests pass successfully",
                    "Documentation is complete and accurate"
                ],
                estimated_complexity="Medium"
            ),
            
            "bug_fix": EpicTemplate(
                name="Bug Fix Epic",
                description="Standard template for bug fixes and issue resolution",
                labels=["bug", "fix"],
                subtask_templates=[
                    {
                        "name": "Bug Investigation",
                        "description": "Investigate and reproduce the bug",
                        "labels": ["investigation", "debugging"],
                        "estimated_hours": 2
                    },
                    {
                        "name": "Root Cause Analysis",
                        "description": "Identify the root cause of the bug",
                        "labels": ["analysis", "debugging"],
                        "estimated_hours": 2
                    },
                    {
                        "name": "Fix Implementation",
                        "description": "Implement the bug fix",
                        "labels": ["fix", "implementation"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Testing",
                        "description": "Test the fix and ensure no regressions",
                        "labels": ["testing", "regression"],
                        "estimated_hours": 3
                    },
                    {
                        "name": "Code Review",
                        "description": "Review the fix for quality and security",
                        "labels": ["review", "quality"],
                        "estimated_hours": 1
                    }
                ],
                acceptance_criteria=[
                    "Bug is completely resolved",
                    "Fix doesn't introduce new issues",
                    "All related tests pass",
                    "Code review is completed",
                    "Fix is deployed to production"
                ],
                estimated_complexity="Low to Medium"
            ),
            
            "infrastructure": EpicTemplate(
                name="Infrastructure Improvement Epic",
                description="Standard template for infrastructure and system improvements",
                labels=["infrastructure", "improvement"],
                subtask_templates=[
                    {
                        "name": "Current State Analysis",
                        "description": "Analyze current infrastructure and identify areas for improvement",
                        "labels": ["analysis", "planning"],
                        "estimated_hours": 3
                    },
                    {
                        "name": "Solution Design",
                        "description": "Design the improved infrastructure solution",
                        "labels": ["design", "architecture"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Implementation",
                        "description": "Implement the infrastructure changes",
                        "labels": ["implementation", "devops"],
                        "estimated_hours": 8
                    },
                    {
                        "name": "Testing and Validation",
                        "description": "Test the infrastructure changes thoroughly",
                        "labels": ["testing", "validation"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Deployment",
                        "description": "Deploy the infrastructure changes safely",
                        "labels": ["deployment", "devops"],
                        "estimated_hours": 3
                    },
                    {
                        "name": "Monitoring Setup",
                        "description": "Set up monitoring and alerting for the new infrastructure",
                        "labels": ["monitoring", "observability"],
                        "estimated_hours": 2
                    }
                ],
                acceptance_criteria=[
                    "Infrastructure improvements are implemented",
                    "System performance is improved",
                    "All tests pass successfully",
                    "Deployment is completed without issues",
                    "Monitoring is properly configured"
                ],
                estimated_complexity="High"
            ),
            
            "testing_suite": EpicTemplate(
                name="Testing Suite Epic",
                description="Standard template for comprehensive testing implementation",
                labels=["testing", "quality"],
                subtask_templates=[
                    {
                        "name": "Test Strategy",
                        "description": "Define testing strategy and coverage requirements",
                        "labels": ["planning", "strategy"],
                        "estimated_hours": 3
                    },
                    {
                        "name": "Unit Test Implementation",
                        "description": "Implement comprehensive unit tests",
                        "labels": ["unit-testing", "implementation"],
                        "estimated_hours": 6
                    },
                    {
                        "name": "Integration Test Implementation",
                        "description": "Implement integration tests for system components",
                        "labels": ["integration-testing", "implementation"],
                        "estimated_hours": 6
                    },
                    {
                        "name": "End-to-End Test Implementation",
                        "description": "Implement end-to-end tests for user workflows",
                        "labels": ["e2e-testing", "implementation"],
                        "estimated_hours": 8
                    },
                    {
                        "name": "Test Automation",
                        "description": "Automate test execution and reporting",
                        "labels": ["automation", "ci/cd"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Test Documentation",
                        "description": "Document testing procedures and guidelines",
                        "labels": ["documentation", "testing"],
                        "estimated_hours": 2
                    }
                ],
                acceptance_criteria=[
                    "Comprehensive test coverage is achieved",
                    "All tests pass consistently",
                    "Test automation is implemented",
                    "Test documentation is complete",
                    "Testing integrates with CI/CD pipeline"
                ],
                estimated_complexity="Medium to High"
            ),
            
            "performance_optimization": EpicTemplate(
                name="Performance Optimization Epic",
                description="Standard template for performance improvements and optimization",
                labels=["performance", "optimization"],
                subtask_templates=[
                    {
                        "name": "Performance Profiling",
                        "description": "Profile current performance and identify bottlenecks",
                        "labels": ["profiling", "analysis"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Optimization Planning",
                        "description": "Plan specific optimizations based on profiling results",
                        "labels": ["planning", "optimization"],
                        "estimated_hours": 3
                    },
                    {
                        "name": "Frontend Optimization",
                        "description": "Optimize frontend performance (bundle size, rendering, etc.)",
                        "labels": ["frontend", "optimization"],
                        "estimated_hours": 6
                    },
                    {
                        "name": "Backend Optimization",
                        "description": "Optimize backend performance (database, API, etc.)",
                        "labels": ["backend", "optimization"],
                        "estimated_hours": 6
                    },
                    {
                        "name": "Performance Testing",
                        "description": "Test and validate performance improvements",
                        "labels": ["testing", "performance"],
                        "estimated_hours": 4
                    },
                    {
                        "name": "Monitoring and Metrics",
                        "description": "Set up performance monitoring and metrics",
                        "labels": ["monitoring", "metrics"],
                        "estimated_hours": 3
                    }
                ],
                acceptance_criteria=[
                    "Performance improvements are measurable",
                    "All performance tests pass",
                    "Optimizations don't break functionality",
                    "Performance monitoring is in place",
                    "Documentation of optimizations is complete"
                ],
                estimated_complexity="Medium to High"
            )
        }
    
    def get_template(self, template_name: str) -> EpicTemplate:
        """Get a specific epic template by name"""
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found. Available templates: {list(self.templates.keys())}")
        return self.templates[template_name]
    
    def list_templates(self) -> List[str]:
        """List all available template names"""
        return list(self.templates.keys())
    
    def create_epic_from_template(self, template_name: str, custom_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create an epic structure from a template with custom data
        
        Args:
            template_name: Name of the template to use
            custom_data: Custom data to override template defaults
            
        Returns:
            Epic structure ready for GitHub creation
        """
        template = self.get_template(template_name)
        
        # Create epic description
        epic_description = self._format_epic_description(template, custom_data)
        
        # Prepare labels
        labels = template.labels.copy()
        if custom_data.get("labels"):
            labels.extend(custom_data["labels"])
        
        return {
            "title": custom_data.get("title", template.name),
            "description": epic_description,
            "labels": labels,
            "subtask_templates": template.subtask_templates,
            "acceptance_criteria": template.acceptance_criteria,
            "estimated_complexity": template.estimated_complexity
        }
    
    def _format_epic_description(self, template: EpicTemplate, custom_data: Dict[str, Any]) -> str:
        """Format the epic description with template and custom data"""
        description = f"## Epic Overview\n\n"
        description += f"{custom_data.get('description', template.description)}\n\n"
        
        if custom_data.get("context"):
            description += f"## Context\n\n{custom_data['context']}\n\n"
        
        description += f"## Acceptance Criteria\n\n"
        for i, criterion in enumerate(template.acceptance_criteria, 1):
            description += f"{i}. {criterion}\n"
        
        description += f"\n## Estimated Complexity\n\n{template.estimated_complexity}\n\n"
        
        if custom_data.get("notes"):
            description += f"## Additional Notes\n\n{custom_data['notes']}\n\n"
        
        description += f"## Subtasks\n\n"
        description += f"This epic will be broken down into the following subtasks:\n\n"
        
        for i, subtask in enumerate(template.subtask_templates, 1):
            description += f"{i}. **{subtask['name']}** - {subtask['description']}\n"
            description += f"   - Labels: {', '.join(subtask['labels'])}\n"
            description += f"   - Estimated: {subtask['estimated_hours']} hours\n\n"
        
        return description
    
    def create_subtask_from_template(self, epic_issue_number: int, subtask_name: str, 
                                   template_name: str, custom_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a subtask structure from a template
        
        Args:
            epic_issue_number: Parent epic issue number
            subtask_name: Name of the subtask
            template_name: Name of the epic template
            custom_data: Custom data for the subtask
            
        Returns:
            Subtask structure ready for GitHub creation
        """
        template = self.get_template(template_name)
        
        # Find the matching subtask template
        subtask_template = None
        for st in template.subtask_templates:
            if st["name"] == subtask_name:
                subtask_template = st
                break
        
        if not subtask_template:
            raise ValueError(f"Subtask '{subtask_name}' not found in template '{template_name}'")
        
        custom_data = custom_data or {}
        
        return {
            "title": custom_data.get("title", subtask_name),
            "description": custom_data.get("description", subtask_template["description"]),
            "labels": custom_data.get("labels", subtask_template["labels"]),
            "epic_issue": epic_issue_number,
            "estimated_hours": custom_data.get("estimated_hours", subtask_template["estimated_hours"])
        }
