# CCPM Workflow Guide

This guide provides comprehensive workflows, best practices, and patterns for using CCPM effectively in your projects.

## 🎯 Workflow Overview

CCPM follows a hierarchical project management approach:

```
PRD (Product Requirements Document)
├── Epic 1
│   ├── Issue 1.1
│   ├── Issue 1.2
│   └── Issue 1.3
├── Epic 2
│   ├── Issue 2.1
│   └── Issue 2.2
└── Epic 3
    └── Issue 3.1
```

## 🚀 Getting Started Workflow

### 1. Project Initialization

Start every new project with proper CCPM setup:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize CCPM
ccpm init --project-name "My Awesome Project" --github-repo "https://github.com/user/repo"

# Verify setup
ls -la .claude/
ccpm status
```

### 2. First PRD Creation

Create your initial project requirements:

```bash
# Create main project PRD
ccpm prd-new "E-commerce Platform" \
  --description "Build a modern e-commerce platform with user authentication, product management, and payment processing" \
  --priority high

# List to verify
ccpm prd-list
```

### 3. Epic Planning

Break down your PRD into manageable epics:

```bash
# Create core epics
ccpm epic-start "User Authentication System" \
  --prd e-commerce-platform \
  --description "Implement secure user registration, login, and profile management" \
  --priority high

ccpm epic-start "Product Management" \
  --prd e-commerce-platform \
  --description "Create product catalog, categories, and inventory management" \
  --priority high

ccpm epic-start "Payment Processing" \
  --prd e-commerce-platform \
  --description "Integrate payment gateways and order processing" \
  --priority medium
```

### 4. Issue Creation

Create specific tasks for each epic:

```bash
# Authentication epic issues
ccpm issue-start "User Registration Form" \
  --epic user-authentication-system \
  --description "Create user registration form with validation" \
  --labels "frontend,form,validation" \
  --priority high

ccpm issue-start "Login System" \
  --epic user-authentication-system \
  --description "Implement secure login with JWT tokens" \
  --labels "backend,security,auth" \
  --priority high

ccpm issue-start "Password Reset" \
  --epic user-authentication-system \
  --description "Add password reset functionality" \
  --labels "backend,email,security" \
  --priority medium
```

## 🔄 Daily Workflow

### Morning Routine

```bash
# Check project status
ccpm status

# Get next recommended tasks
ccpm next --priority high

# Review open issues
ccpm issue-list --status open --assignee "your-username"
```

### During Development

```bash
# Start working on an issue
ccpm issue-start "Implement user registration API" \
  --epic user-authentication-system \
  --description "Create REST API endpoint for user registration" \
  --labels "backend,api,user-management"

# Update issue status as you work
ccpm issue-update "implement-user-registration-api" --status in-progress

# Complete the issue when done
ccpm issue-complete "implement-user-registration-api" \
  --notes "Successfully implemented user registration API with validation and error handling"
```

### End of Day

```bash
# Update epic progress
ccpm epic-update "user-authentication-system" --status in-progress

# Check overall progress
ccpm status --include-details

# Plan tomorrow's work
ccpm next --epic user-authentication-system --limit 3
```

## 🎯 Project Management Workflows

### Feature Development Workflow

#### 1. Feature Planning
```bash
# Create feature PRD
ccpm prd-new "Advanced Search" \
  --description "Implement advanced search with filters, sorting, and pagination" \
  --priority medium

# Create feature epic
ccpm epic-start "Search Implementation" \
  --prd advanced-search \
  --description "Build comprehensive search functionality" \
  --priority medium
```

#### 2. Task Breakdown
```bash
# Break down into specific tasks
ccpm issue-start "Search API Design" \
  --epic search-implementation \
  --description "Design REST API for search functionality" \
  --labels "backend,api,design" \
  --priority high

ccpm issue-start "Search Frontend" \
  --epic search-implementation \
  --description "Create search interface with filters" \
  --labels "frontend,ui,search" \
  --priority high

ccpm issue-start "Search Indexing" \
  --epic search-implementation \
  --description "Implement search index for products" \
  --labels "backend,search,performance" \
  --priority medium
```

#### 3. Development and Testing
```bash
# Work on tasks sequentially or in parallel
ccpm issue-update "search-api-design" --status in-progress

# When API design is complete
ccpm issue-complete "search-api-design" \
  --notes "API design completed with OpenAPI specification"

# Start next task
ccpm issue-update "search-frontend" --status in-progress
```

### Bug Fix Workflow

#### 1. Bug Identification
```bash
# Create bug issue
ccpm issue-start "Fix user login timeout" \
  --epic user-authentication-system \
  --description "Users are being logged out after 5 minutes instead of 30 minutes" \
  --labels "bug,authentication,frontend" \
  --priority high
```

#### 2. Bug Investigation
```bash
# Update status
ccpm issue-update "fix-user-login-timeout" --status investigating

# Add investigation notes
ccpm issue-update "fix-user-login-timeout" \
  --description "Users are being logged out after 5 minutes instead of 30 minutes. Investigating JWT token expiration settings."
```

#### 3. Bug Fix
```bash
# Start fixing
ccpm issue-update "fix-user-login-timeout" --status in-progress

# Complete fix
ccpm issue-complete "fix-user-login-timeout" \
  --notes "Fixed JWT token expiration from 5 minutes to 30 minutes. Updated both frontend and backend configurations."
```

### Release Management Workflow

#### 1. Release Planning
```bash
# Create release PRD
ccpm prd-new "v2.0.0 Release" \
  --description "Major release with new features and improvements" \
  --priority high

# Create release epic
ccpm epic-start "Release Preparation" \
  --prd v2-0-0-release \
  --description "Prepare and test release v2.0.0" \
  --priority high
```

#### 2. Release Tasks
```bash
# Create release checklist
ccpm issue-start "Update version numbers" \
  --epic release-preparation \
  --description "Update version numbers in package.json and other config files" \
  --labels "release,versioning" \
  --priority high

ccpm issue-start "Update changelog" \
  --epic release-preparation \
  --description "Update CHANGELOG.md with new features and fixes" \
  --labels "release,documentation" \
  --priority high

ccpm issue-start "Run full test suite" \
  --epic release-preparation \
  --description "Execute complete test suite and fix any failures" \
  --labels "release,testing" \
  --priority high
```

#### 3. Release Execution
```bash
# Complete preparation tasks
ccpm issue-complete "update-version-numbers" \
  --notes "Updated version to 2.0.0 in all configuration files"

ccpm issue-complete "update-changelog" \
  --notes "Added all new features and bug fixes to changelog"

ccpm issue-complete "run-full-test-suite" \
  --notes "All tests passing, ready for release"

# Complete release epic
ccpm epic-complete "release-preparation" \
  --notes "Release v2.0.0 preparation completed successfully"
```

## 🔄 Agile Workflow Integration

### Sprint Planning

#### 1. Sprint Setup
```bash
# Create sprint epic
ccpm epic-start "Sprint 1 - User Authentication" \
  --prd e-commerce-platform \
  --description "Sprint 1: Complete user authentication system" \
  --due-date "2024-02-15"
```

#### 2. Sprint Backlog
```bash
# Add sprint issues
ccpm issue-start "User registration form" \
  --epic sprint-1-user-authentication \
  --description "Create user registration form with validation" \
  --labels "sprint-1,frontend" \
  --priority high

ccpm issue-start "Login API" \
  --epic sprint-1-user-authentication \
  --description "Implement login API endpoint" \
  --labels "sprint-1,backend" \
  --priority high
```

#### 3. Sprint Execution
```bash
# Daily standup status
ccpm status --epic sprint-1-user-authentication

# Move issues through workflow
ccpm issue-update "user-registration-form" --status in-progress
ccpm issue-update "login-api" --status in-progress

# Complete completed work
ccpm issue-complete "user-registration-form" \
  --notes "Form completed with validation and error handling"
```

### Sprint Review and Retrospective

```bash
# Sprint completion
ccpm epic-complete "sprint-1-user-authentication" \
  --notes "Sprint 1 completed successfully. All planned features delivered."

# Create next sprint
ccpm epic-start "Sprint 2 - Product Management" \
  --prd e-commerce-platform \
  --description "Sprint 2: Implement product catalog and management" \
  --due-date "2024-03-01"
```

## 🎯 Specialized Workflows

### Documentation Workflow

```bash
# Create documentation epic
ccpm epic-start "API Documentation" \
  --prd e-commerce-platform \
  --description "Create comprehensive API documentation" \
  --priority medium

# Documentation tasks
ccpm issue-start "OpenAPI specification" \
  --epic api-documentation \
  --description "Create OpenAPI 3.0 specification for all endpoints" \
  --labels "documentation,api" \
  --priority high

ccpm issue-start "API documentation website" \
  --epic api-documentation \
  --description "Build interactive API documentation website" \
  --labels "documentation,frontend" \
  --priority medium
```

### Testing Workflow

```bash
# Testing epic
ccpm epic-start "Test Coverage Improvement" \
  --prd e-commerce-platform \
  --description "Improve test coverage and quality" \
  --priority medium

# Testing tasks
ccpm issue-start "Unit test coverage" \
  --epic test-coverage-improvement \
  --description "Increase unit test coverage to 90%" \
  --labels "testing,coverage" \
  --priority high

ccpm issue-start "Integration tests" \
  --epic test-coverage-improvement \
  --description "Add integration tests for critical user flows" \
  --labels "testing,integration" \
  --priority high
```

### Performance Optimization Workflow

```bash
# Performance epic
ccpm epic-start "Performance Optimization" \
  --prd e-commerce-platform \
  --description "Optimize application performance" \
  --priority medium

# Performance tasks
ccpm issue-start "Database query optimization" \
  --epic performance-optimization \
  --description "Optimize slow database queries" \
  --labels "performance,database" \
  --priority high

ccpm issue-start "Frontend bundle optimization" \
  --epic performance-optimization \
  --description "Reduce JavaScript bundle size" \
  --labels "performance,frontend" \
  --priority medium
```

## 🔧 Automation Workflows

### CI/CD Integration

```bash
# Create CI/CD epic
ccpm epic-start "CI/CD Pipeline" \
  --prd e-commerce-platform \
  --description "Implement continuous integration and deployment" \
  --priority high

# CI/CD tasks
ccpm issue-start "GitHub Actions setup" \
  --epic ci-cd-pipeline \
  --description "Set up GitHub Actions for automated testing and deployment" \
  --labels "ci-cd,automation" \
  --priority high

ccpm issue-start "Automated testing" \
  --epic ci-cd-pipeline \
  --description "Configure automated testing in CI pipeline" \
  --labels "ci-cd,testing" \
  --priority high
```

### Automated Reporting

```bash
# Create reporting epic
ccpm epic-start "Automated Reporting" \
  --prd e-commerce-platform \
  --description "Implement automated project reporting" \
  --priority medium

# Reporting tasks
ccpm issue-start "Daily status reports" \
  --epic automated-reporting \
  --description "Generate and send daily project status reports" \
  --labels "automation,reporting" \
  --priority medium

ccpm issue-start "Sprint reports" \
  --epic automated-reporting \
  --description "Generate sprint completion reports" \
  --labels "automation,reporting" \
  --priority medium
```

## 📊 Monitoring and Metrics

### Progress Tracking

```bash
# Regular status checks
ccpm status --format json > status.json

# Epic progress
ccpm epic-list --format json > epics.json

# Issue status
ccpm issue-list --format json > issues.json
```

### Performance Metrics

```bash
# Velocity tracking
ccpm issue-list --status completed --format json | jq 'length'

# Burndown chart data
ccpm status --epic sprint-1-user-authentication --format json
```

## 🚨 Troubleshooting Workflows

### Issue Resolution

```bash
# Create troubleshooting issue
ccpm issue-start "Investigate login failures" \
  --epic user-authentication-system \
  --description "Users reporting login failures, need investigation" \
  --labels "bug,investigation" \
  --priority high

# Investigation workflow
ccpm issue-update "investigate-login-failures" --status investigating
# ... investigation work ...
ccpm issue-update "investigate-login-failures" --status in-progress
# ... fix implementation ...
ccpm issue-complete "investigate-login-failures" \
  --notes "Root cause identified and fixed: JWT token validation issue in middleware"
```

### System Recovery

```bash
# Create recovery epic
ccpm epic-start "System Recovery" \
  --prd e-commerce-platform \
  --description "Recover from system outage" \
  --priority critical

# Recovery tasks
ccpm issue-start "Database restoration" \
  --epic system-recovery \
  --description "Restore database from backup" \
  --labels "recovery,database" \
  --priority critical

ccpm issue-start "Service restart" \
  --epic system-recovery \
  --description "Restart all application services" \
  --labels "recovery,operations" \
  --priority critical
```

## 📚 Best Practices

### 1. Consistent Naming
- Use descriptive, consistent names for PRDs, epics, and issues
- Follow naming conventions: `feature-name`, `bug-description`, `epic-title`

### 2. Regular Updates
- Update issue status regularly as work progresses
- Use meaningful completion notes
- Keep epics updated with current status

### 3. Proper Labeling
- Use consistent labels across similar issues
- Include component, priority, and type labels
- Use labels for filtering and reporting

### 4. Dependency Management
- Create issues in dependency order
- Link related issues and epics
- Use blocking relationships when necessary

### 5. Progress Tracking
- Regular status checks and updates
- Use CCPM's progress tracking features
- Generate reports for stakeholders

## 🔄 Workflow Templates

### New Feature Template

```bash
# 1. Create feature PRD
ccpm prd-new "Feature Name" --description "Feature description" --priority high

# 2. Create feature epic
ccpm epic-start "Feature Implementation" --prd feature-name --description "Implement feature" --priority high

# 3. Create implementation tasks
ccpm issue-start "Backend implementation" --epic feature-implementation --labels "backend,feature" --priority high
ccpm issue-start "Frontend implementation" --epic feature-implementation --labels "frontend,feature" --priority high
ccpm issue-start "Testing" --epic feature-implementation --labels "testing,feature" --priority medium
ccpm issue-start "Documentation" --epic feature-implementation --labels "documentation,feature" --priority low
```

### Bug Fix Template

```bash
# 1. Create bug issue
ccpm issue-start "Fix bug description" --epic relevant-epic --labels "bug,component" --priority high

# 2. Investigation
ccpm issue-update "fix-bug-description" --status investigating

# 3. Fix implementation
ccpm issue-update "fix-bug-description" --status in-progress

# 4. Testing and completion
ccpm issue-complete "fix-bug-description" --notes "Bug fixed with detailed explanation"
```

## 📈 Scaling Workflows

### Team Coordination

```bash
# Create team epics
ccpm epic-start "Frontend Team Sprint" --prd project-name --assignee "frontend-team"
ccpm epic-start "Backend Team Sprint" --prd project-name --assignee "backend-team"

# Assign issues to teams
ccpm issue-start "UI component" --epic frontend-team-sprint --assignee "frontend-team"
ccpm issue-start "API endpoint" --epic backend-team-sprint --assignee "backend-team"
```

### Multi-Project Management

```bash
# Initialize multiple projects
cd /path/to/project1 && ccpm init --project-name "Project 1"
cd /path/to/project2 && ccpm init --project-name "Project 2"

# Manage from parent directory
ccpm status --project project1
ccpm status --project project2
```

## 🎯 Next Steps

After mastering these workflows:

1. **Customize**: Adapt workflows to your team's needs
2. **Automate**: Create scripts for common workflow patterns
3. **Integrate**: Connect CCPM with your existing tools
4. **Scale**: Apply workflows to larger teams and projects
5. **Optimize**: Continuously improve your workflow efficiency

---

For more information, see the [Command Reference](commands.md) and [Integration Guide](integration.md).
