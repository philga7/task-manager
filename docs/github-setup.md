# GitHub CLI Setup for Claude Code PM

## Overview

This document outlines the setup and configuration of GitHub CLI for Claude Code PM integration, enabling GitHub Issues management and parallel agent coordination.

## Prerequisites

- macOS with Homebrew installed
- GitHub account with repository access
- Personal Access Token with required scopes

## Installation Steps

### 1. Install GitHub CLI

```bash
brew install gh
```

### 2. Authenticate with GitHub

```bash
gh auth login
```

**Required Token Scopes:**
- `repo` - Full control of private repositories
- `read:org` - Read organization data
- `workflow` - Update GitHub Action workflows

**Token Generation:**
1. Visit https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Set expiration (90 days recommended)
4. Select required scopes
5. Generate and copy token

### 3. Install Required Extensions

```bash
# Install sub-issue extension for parent-child relationships
gh extension install agbiotech/gh-sub-issue
```

### 4. Verify Installation

```bash
# Check GitHub CLI version
gh --version

# Verify authentication
gh auth status

# Test repository access
gh repo view

# Test issue creation
gh issue create --title "Test Issue" --body "Test body"
```

## Configuration Files

### GitHub Configuration (`.claude/config/github.json`)

```json
{
  "repository": "philga7/task-manager",
  "defaultBranch": "main",
  "issueLabels": {
    "feature": "enhancement",
    "bug": "bug",
    "documentation": "documentation",
    "test": "test"
  },
  "subIssueEnabled": true,
  "autoLabeling": true
}
```

## Usage Examples

### Creating Issues

```bash
# Create a feature request
gh issue create --title "Add new feature" --body "Description" --label "enhancement"

# Create a bug report
gh issue create --title "Fix bug" --body "Bug description" --label "bug"
```

### Managing Sub-Issues

```bash
# List sub-issues for a parent
gh sub-issue list 10

# Add an issue as a sub-issue
gh sub-issue add 10 --sub-issue-number 100

# Remove sub-issue relationship
gh sub-issue remove 10 --sub-issue-number 100
```

### Repository Operations

```bash
# View repository information
gh repo view

# List issues
gh issue list

# View specific issue
gh issue view 10
```

## Troubleshooting

### Common Issues

1. **Token Scope Errors**
   - Ensure token has all required scopes
   - Regenerate token if needed

2. **Repository Access Denied**
   - Verify repository permissions
   - Check authentication status

3. **Extension Not Found**
   - Use correct extension name
   - Check extension compatibility

### Verification Commands

```bash
# Check all installed extensions
gh extension list

# Test GitHub API access
gh api user

# Verify repository permissions
gh repo view --json permissions
```

## Security Considerations

- Store tokens securely
- Use token expiration
- Regularly rotate tokens
- Monitor token usage

## CI/CD Workflows

### GitHub Actions Setup
The project includes optimized GitHub Actions workflows:

#### Deploy Workflow (`.github/workflows/deploy.yml`)
- **Test Job**: Runs ESLint for code quality checks
- **Build Job**: Builds the project and deploys to Vercel
- **Dependencies**: Build job depends on successful test completion
- **Triggers**: Pull requests to main and published releases

#### Release Workflow (`.github/workflows/release.yml`)
- **Test Job**: Runs ESLint for code quality checks
- **Build Job**: Builds the project and runs semantic-release
- **Dependencies**: Build job depends on successful test completion
- **Triggers**: Push to main (excluding changelog and package-lock changes)

### Workflow Benefits
- **Faster Feedback**: Test failures stop the pipeline immediately
- **Parallel Execution**: Jobs run independently where possible
- **Resource Efficiency**: Better utilization of GitHub Actions runners
- **Clear Separation**: Testing and deployment concerns are separated
- **Dependency Management**: Build jobs only run after successful tests

### Required Secrets
For the workflows to function properly, ensure these secrets are configured in GitHub:

```bash
# Vercel deployment secrets
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# GitHub token (automatically provided)
GITHUB_TOKEN=automatically_provided
```

## Integration with Claude Code PM

The GitHub CLI setup enables:
- Automated issue creation from task management
- Parent-child issue relationships
- Parallel agent coordination
- Repository state synchronization
- CI/CD workflow management and monitoring

## Next Steps

1. Configure Claude Code PM to use GitHub CLI
2. Set up automated issue workflows
3. Test parallel agent coordination
4. Monitor and optimize CI/CD performance
5. Extend workflows with additional testing (unit tests, E2E tests)
