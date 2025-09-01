"""
Example GitHub Configuration for CCPM Integration
Copy this file and update with your actual values
"""

# GitHub Configuration Example
GITHUB_CONFIG = {
    # Your GitHub Personal Access Token
    # Generate at: https://github.com/settings/tokens
    # Required scopes: repo, issues
    "api_token": "your_github_personal_access_token_here",
    
    # Repository name in format: owner/repository-name
    # Example: "philga7/task-manager"
    "repo_name": "owner/repository-name",
    
    # Optional: Custom labels for CCPM
    "custom_labels": {
        "epic": {
            "name": "epic",
            "color": "6f42c1",  # Purple
            "description": "CCPM Epic - High-level feature or project"
        },
        "subtask": {
            "name": "subtask", 
            "color": "0366d6",  # Blue
            "description": "CCPM Subtask - Individual work item"
        }
    }
}

# Environment Variables to Set:
# export GITHUB_API_TOKEN="your_token_here"
# export GITHUB_REPO_NAME="owner/repo-name"

# Or create a .env file in the backend directory with:
# GITHUB_API_TOKEN=your_token_here
# GITHUB_REPO_NAME=owner/repo-name
