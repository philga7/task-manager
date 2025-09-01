# CCPM Command Reference

This document provides a complete reference for all CCPM CLI commands, including syntax, options, and examples.

## 📖 Command Overview

CCPM uses a command structure similar to Git: `ccpm <command> <subcommand> [options] [arguments]`

### Basic Syntax
```bash
ccpm <command> <subcommand> [--option value] [argument]
```

### Global Options
- `--help, -h`: Show help for the command
- `--version, -v`: Show CCPM version
- `--config <path>`: Use custom configuration file
- `--verbose`: Enable verbose output
- `--quiet`: Suppress non-essential output

## 🎯 PRD Commands

PRD (Product Requirements Document) commands help you create and manage project requirements.

### `ccpm prd-new`

Create a new Product Requirements Document.

```bash
ccpm prd-new "Project Title" [--description "Description"] [--priority high|medium|low]
```

**Options:**
- `--description, -d`: Set PRD description
- `--priority, -p`: Set priority level (high, medium, low)
- `--template, -t`: Use specific template
- `--output, -o`: Output file path

**Examples:**
```bash
# Basic PRD creation
ccpm prd-new "User Authentication System"

# With description and priority
ccpm prd-new "Payment Gateway Integration" --description "Integrate Stripe payment processing" --priority high

# Using custom template
ccpm prd-new "Mobile App" --template mobile-app
```

### `ccpm prd-list`

List all PRDs in the project.

```bash
ccpm prd-list [--status active|completed|archived] [--format table|json|yaml]
```

**Options:**
- `--status, -s`: Filter by status
- `--format, -f`: Output format
- `--sort, -S`: Sort by field (title, created, priority)
- `--limit, -l`: Limit number of results

**Examples:**
```bash
# List all PRDs
ccpm prd-list

# Filter by status
ccpm prd-list --status active

# JSON output
ccpm prd-list --format json
```

### `ccpm prd-show`

Display detailed information about a specific PRD.

```bash
ccpm prd-show <prd-id> [--format markdown|html|json]
```

**Options:**
- `--format, -f`: Output format
- `--include-issues`: Include linked issues
- `--include-epics`: Include linked epics

**Examples:**
```bash
# Show PRD details
ccpm prd-show auth-system

# Markdown format
ccpm prd-show auth-system --format markdown

# With linked items
ccpm prd-show auth-system --include-issues --include-epics
```

### `ccpm prd-update`

Update an existing PRD.

```bash
ccpm prd-update <prd-id> [--title "New Title"] [--description "New Description"] [--priority high|medium|low]
```

**Options:**
- `--title, -t`: Update title
- `--description, -d`: Update description
- `--priority, -p`: Update priority
- `--status, -s`: Update status

**Examples:**
```bash
# Update title
ccpm prd-update auth-system --title "Enhanced User Authentication System"

# Update multiple fields
ccpm prd-update auth-system --description "Updated description" --priority high
```

## 🚀 Epic Commands

Epic commands help you manage large initiatives broken down into manageable pieces.

### `ccpm epic-start`

Start a new epic within a PRD.

```bash
ccpm epic-start "Epic Title" [--prd <prd-id>] [--description "Description"] [--priority high|medium|low]
```

**Options:**
- `--prd, -p`: Associate with specific PRD
- `--description, -d`: Set epic description
- `--priority, -p`: Set priority level
- `--assignee, -a`: Assign to team member
- `--due-date, -D`: Set due date

**Examples:**
```bash
# Basic epic creation
ccpm epic-start "Implement OAuth2 Authentication"

# With PRD association
ccpm epic-start "Database Schema Design" --prd auth-system

# With full details
ccpm epic-start "API Development" --prd auth-system --description "Build REST API endpoints" --priority high --assignee "john.doe"
```

### `ccpm epic-list`

List all epics in the project.

```bash
ccpm epic-list [--prd <prd-id>] [--status active|completed|archived] [--assignee <user>]
```

**Options:**
- `--prd, -p`: Filter by PRD
- `--status, -s`: Filter by status
- `--assignee, -a`: Filter by assignee
- `--format, -f`: Output format

**Examples:**
```bash
# List all epics
ccpm epic-list

# Filter by PRD
ccpm epic-list --prd auth-system

# Filter by status and assignee
ccpm epic-list --status active --assignee "john.doe"
```

### `ccpm epic-show`

Display detailed information about a specific epic.

```bash
ccpm epic-show <epic-id> [--format markdown|html|json]
```

**Examples:**
```bash
# Show epic details
ccpm epic-show oauth2-implementation

# Markdown format
ccpm epic-show oauth2-implementation --format markdown
```

### `ccpm epic-update`

Update an existing epic.

```bash
ccpm epic-update <epic-id> [--title "New Title"] [--description "New Description"] [--status active|completed|archived]
```

**Examples:**
```bash
# Update epic status
ccpm epic-update oauth2-implementation --status completed

# Update multiple fields
ccpm epic-update oauth2-implementation --title "Enhanced OAuth2 Implementation" --description "Updated description"
```

### `ccpm epic-complete`

Mark an epic as completed.

```bash
ccpm epic-complete <epic-id> [--notes "Completion notes"]
```

**Examples:**
```bash
# Complete epic
ccpm epic-complete oauth2-implementation

# With completion notes
ccpm epic-complete oauth2-implementation --notes "Successfully implemented OAuth2 with Google and GitHub providers"
```

## 🐛 Issue Commands

Issue commands help you create and manage GitHub issues for specific tasks.

### `ccpm issue-start`

Create a new GitHub issue for a specific task.

```bash
ccpm issue-start "Issue Title" [--epic <epic-id>] [--description "Description"] [--assignee <user>] [--labels "label1,label2"]
```

**Options:**
- `--epic, -e`: Associate with specific epic
- `--description, -d`: Set issue description
- `--assignee, -a`: Assign to team member
- `--labels, -l`: Set issue labels
- `--priority, -p`: Set priority level
- `--due-date, -D`: Set due date
- `--template, -t`: Use issue template

**Examples:**
```bash
# Basic issue creation
ccpm issue-start "Add login form validation"

# With epic association
ccpm issue-start "Implement JWT tokens" --epic oauth2-implementation

# With full details
ccpm issue-start "Database migration script" --epic oauth2-implementation --description "Create migration for user table" --assignee "jane.smith" --labels "database,migration" --priority high
```

### `ccpm issue-list`

List all GitHub issues in the project.

```bash
ccpm issue-list [--epic <epic-id>] [--status open|closed] [--assignee <user>] [--labels "label1,label2"]
```

**Options:**
- `--epic, -e`: Filter by epic
- `--status, -s`: Filter by status
- `--assignee, -a`: Filter by assignee
- `--labels, -l`: Filter by labels
- `--format, -f`: Output format

**Examples:**
```bash
# List all issues
ccpm issue-list

# Filter by epic
ccpm issue-list --epic oauth2-implementation

# Filter by status and assignee
ccpm issue-list --status open --assignee "john.doe"
```

### `ccpm issue-show`

Display detailed information about a specific issue.

```bash
ccpm issue-show <issue-id> [--format markdown|html|json]
```

**Examples:**
```bash
# Show issue details
ccpm issue-show login-validation

# Markdown format
ccpm issue-show login-validation --format markdown
```

### `ccpm issue-update`

Update an existing GitHub issue.

```bash
ccpm issue-update <issue-id> [--title "New Title"] [--description "New Description"] [--status open|closed]
```

**Examples:**
```bash
# Update issue status
ccpm issue-update login-validation --status closed

# Update multiple fields
ccpm issue-update login-validation --title "Enhanced login form validation" --description "Updated validation requirements"
```

### `ccpm issue-complete`

Mark an issue as completed.

```bash
ccpm issue-complete <issue-id> [--notes "Completion notes"]
```

**Examples:**
```bash
# Complete issue
ccpm issue-complete login-validation

# With completion notes
ccpm issue-complete login-validation --notes "Added comprehensive form validation with error messages"
```

## 📊 Status and Monitoring Commands

### `ccpm status`

Show overall project status and progress.

```bash
ccpm status [--format table|json|yaml] [--include-details]
```

**Options:**
- `--format, -f`: Output format
- `--include-details, -d`: Include detailed information
- `--epic <epic-id>`: Show status for specific epic
- `--prd <prd-id>`: Show status for specific PRD

**Examples:**
```bash
# Basic status
ccpm status

# Detailed status
ccpm status --include-details

# Status for specific epic
ccpm status --epic oauth2-implementation
```

### `ccpm next`

Get AI-recommended next steps and tasks.

```bash
ccpm next [--epic <epic-id>] [--priority high|medium|low] [--limit <number>]
```

**Options:**
- `--epic, -e`: Focus on specific epic
- `--priority, -p`: Filter by priority
- `--limit, -l`: Limit number of recommendations
- `--format, -f`: Output format

**Examples:**
```bash
# Get next steps
ccpm next

# Focus on specific epic
ccpm next --epic oauth2-implementation

# High priority tasks only
ccpm next --priority high
```

## 🔧 Utility Commands

### `ccpm help`

Show help information.

```bash
ccpm help [command] [subcommand]
```

**Examples:**
```bash
# General help
ccpm help

# Help for specific command
ccpm help prd

# Help for specific subcommand
ccpm help prd-new
```

### `ccpm init`

Initialize CCPM in a new project.

```bash
ccpm init [--project-name "Name"] [--github-repo "URL"] [--template "template-name"]
```

**Options:**
- `--project-name, -n`: Set project name
- `--github-repo, -r`: Set GitHub repository URL
- `--template, -t`: Use specific template
- `--force, -f`: Force initialization (overwrite existing)

**Examples:**
```bash
# Basic initialization
ccpm init

# With project details
ccpm init --project-name "My Awesome Project" --github-repo "https://github.com/user/repo"

# Using template
ccpm init --template web-app
```

### `ccpm config`

Manage CCPM configuration.

```bash
ccpm config [get|set|list] [key] [value]
```

**Examples:**
```bash
# List all configuration
ccpm config list

# Get specific value
ccpm config get github_repo

# Set configuration value
ccpm config set max_parallel_agents 10
```

### `ccpm update`

Check for and install CCPM updates.

```bash
ccpm update [--check-only] [--force]
```

**Options:**
- `--check-only, -c`: Only check for updates
- `--force, -f`: Force update even if no new version

**Examples:**
```bash
# Check for updates
ccpm update --check-only

# Install updates
ccpm update

# Force update
ccpm update --force
```

## 🎨 Output Formats

CCPM supports multiple output formats for different use cases:

### Table Format (Default)
```bash
ccpm prd-list --format table
```
Produces human-readable tabular output.

### JSON Format
```bash
ccpm prd-list --format json
```
Produces machine-readable JSON output for scripting and automation.

### YAML Format
```bash
ccpm prd-list --format yaml
```
Produces YAML output for configuration files and documentation.

### Markdown Format
```bash
ccpm prd-show auth-system --format markdown
```
Produces Markdown output for documentation and reports.

## 🔗 Command Chaining

CCPM commands can be chained together for complex workflows:

```bash
# Create PRD, epic, and issue in sequence
ccpm prd-new "Project" && \
ccpm epic-start "Epic" --prd project && \
ccpm issue-start "Issue" --epic epic
```

## 📝 Command Aliases

CCPM provides convenient aliases for common commands:

- `ccpm prd` → `ccpm prd-list`
- `ccpm epic` → `ccpm epic-list`
- `ccpm issue` → `ccpm issue-list`
- `ccpm s` → `ccpm status`
- `ccpm n` → `ccpm next`
- `ccpm h` → `ccpm help`

## 🚨 Error Handling

When commands fail, CCPM provides helpful error messages:

```bash
$ ccpm prd-show invalid-id
Error: PRD 'invalid-id' not found
Available PRDs: auth-system, payment-gateway
```

Common error scenarios and solutions:
- **Authentication errors**: Run `gh auth login`
- **Network errors**: Check internet connection and GitHub access
- **Permission errors**: Verify repository access and file permissions
- **Configuration errors**: Run `ccpm config list` to verify settings

## 📚 Next Steps

After learning the commands:
1. **Practice**: Try creating a simple PRD and epic
2. **Explore**: Use `ccpm help` to discover more options
3. **Automate**: Use JSON output for scripting
4. **Customize**: Configure CCPM for your workflow

---

For more information, see the [Workflow Guide](workflow.md) and [Integration Guide](integration.md).
