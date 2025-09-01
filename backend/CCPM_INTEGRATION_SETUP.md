# CCPM GitHub Integration Setup Guide

This guide walks you through setting up the CCPM (Claude Code PM) integration with GitHub for epic and subtask management.

## Prerequisites

- Python 3.8+ with virtual environment
- GitHub account with repository access
- GitHub Personal Access Token

## Step 1: Install Dependencies

Activate your virtual environment and install the required packages:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 2: GitHub Token Setup

### 2.1 Generate Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "CCPM Integration")
4. Select the following scopes:
   - `repo` - Full control of private repositories
   - `issues` - Read and write issues
5. Click "Generate token"
6. **Copy the token immediately** - you won't see it again!

### 2.2 Configure Environment Variables

Set the following environment variables:

```bash
# On macOS/Linux
export GITHUB_API_TOKEN="your_token_here"
export GITHUB_REPO_NAME="owner/repository-name"

# On Windows (PowerShell)
$env:GITHUB_API_TOKEN="your_token_here"
$env:GITHUB_REPO_NAME="owner/repository-name"

# On Windows (Command Prompt)
set GITHUB_API_TOKEN=your_token_here
set GITHUB_REPO_NAME=owner/repository-name
```

**Important**: Replace `owner/repository-name` with your actual repository (e.g., `philga7/task-manager`)

## Step 3: Test GitHub Connection

Test the GitHub integration using the CLI:

```bash
cd backend
python ccpm_cli.py "/pm:github-test"
```

Expected output:
```
✅ GitHub connection test successful
📊 System Status:
  Status: GitHub connection successful
  Claude PM Installed: True
  Version: 1.0.0
```

## Step 4: Explore Epic Templates

List available epic templates:

```bash
python ccpm_cli.py "/pm:template-list"
```

View a specific template:

```bash
python ccpm_cli.py "/pm:template-show --template_name=feature_development"
```

## Step 5: Create Your First Epic

### 5.1 Create Epic from Template

```bash
python ccpm_cli.py "/pm:template-create-epic --template_name=feature_development --custom_data='{\"title\":\"Implement CCPM Integration\",\"description\":\"Set up comprehensive CCPM integration with GitHub\",\"context\":\"This epic establishes the foundation for migrating complex tasks from Shrimp to CCPM for parallel execution.\"}'"
```

### 5.2 Create Epic Manually

```bash
python ccpm_cli.py "/pm:github-create-epic --title='Manual Epic Example' --description='This is a manually created epic for testing purposes' --labels='manual,test'"
```

## Step 6: Create Subtasks

Create subtasks for your epic:

```bash
python ccpm_cli.py "/pm:github-create-subtask --title='Setup GitHub Service' --description='Implement the GitHub service for API integration' --epic_issue=1 --labels='backend,implementation'"
```

## Step 7: Manage Epics and Issues

### List Epics
```bash
python ccpm_cli.py "/pm:github-list-epics --state=open"
```

### List Subtasks for an Epic
```bash
python ccpm_cli.py "/pm:github-list-subtasks --epic_issue=1"
```

### Update Issue Status
```bash
python ccpm_cli.py "/pm:github-update-issue --issue_number=1 --state=closed"
```

## Available Epic Templates

### 1. Feature Development
- **Complexity**: Medium
- **Use Case**: New feature implementation
- **Subtasks**: Requirements, Design, Frontend, Backend, Testing, Documentation

### 2. Bug Fix
- **Complexity**: Low to Medium
- **Use Case**: Bug resolution and fixes
- **Subtasks**: Investigation, Root Cause, Fix, Testing, Review

### 3. Infrastructure
- **Complexity**: High
- **Use Case**: System improvements and DevOps
- **Subtasks**: Analysis, Design, Implementation, Testing, Deployment, Monitoring

### 4. Testing Suite
- **Complexity**: Medium to High
- **Use Case**: Comprehensive testing implementation
- **Subtasks**: Strategy, Unit Tests, Integration Tests, E2E Tests, Automation, Documentation

### 5. Performance Optimization
- **Complexity**: Medium to High
- **Use Case**: Performance improvements
- **Subtasks**: Profiling, Planning, Frontend/Backend Optimization, Testing, Monitoring

## CLI Command Reference

### GitHub Commands
- `/pm:github-test` - Test GitHub connection
- `/pm:github-create-epic --title="Title" --description="Description"` - Create epic
- `/pm:github-create-subtask --title="Title" --description="Description" --epic_issue=1` - Create subtask
- `/pm:github-list-epics --state=open` - List epics
- `/pm:github-list-subtasks --epic_issue=1` - List subtasks for epic
- `/pm:github-update-issue --issue_number=1 --state=closed` - Update issue

### Template Commands
- `/pm:template-list` - List available templates
- `/pm:template-show --template_name=name` - Show template details
- `/pm:template-create-epic --template_name=name --custom_data='{}'` - Create epic from template

## Troubleshooting

### Common Issues

#### 1. "GitHub service not available"
**Cause**: Missing environment variables
**Solution**: Set `GITHUB_API_TOKEN` and `GITHUB_REPO_NAME`

#### 2. "GitHub API error: 401 Unauthorized"
**Cause**: Invalid or expired token
**Solution**: Generate new token with correct scopes

#### 3. "Repository not found"
**Cause**: Incorrect repository name format
**Solution**: Use format `owner/repository-name`

#### 4. "Permission denied"
**Cause**: Token lacks required scopes
**Solution**: Ensure token has `repo` and `issues` scopes

### Debug Mode

Enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

## Next Steps

After successful setup:

1. **Create your first epic** using a template
2. **Break down complex tasks** into subtasks
3. **Test the workflow** with a simple feature
4. **Integrate with your team** for parallel execution
5. **Customize templates** for your specific needs

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GitHub API documentation
3. Check CCPM backend logs
4. Verify environment variable configuration

## Security Notes

- **Never commit your GitHub token** to version control
- **Use environment variables** or secure configuration management
- **Rotate tokens regularly** for production use
- **Limit token scopes** to minimum required permissions
