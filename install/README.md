# CCPM Installation Guide

CCPM (Claude Code PM) is a powerful project management system that integrates with GitHub CLI and provides parallel agent execution capabilities.

## Quick Start

### Universal Installation (Recommended)

```bash
# Download and run the universal installer
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/install.sh | bash
```

### Manual Installation

#### Unix/Linux/macOS
```bash
# Download the installation script
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/ccpm.sh -o ccpm.sh

# Make it executable and run
chmod +x ccpm.sh
./ccpm.sh
```

#### Windows
```cmd
# Download the installation script
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/ccpm.bat -o ccpm.bat

# Run the installer
ccpm.bat
```

## Prerequisites

Before installing CCPM, ensure you have:

1. **Git** - Version control system
2. **GitHub CLI** - Will be installed automatically if not present
3. **GitHub Account** - For authentication and issue management

## What Gets Installed

The CCPM installation process will:

1. **Install GitHub CLI** (if not already installed)
2. **Authenticate with GitHub** (interactive process)
3. **Install gh-sub-issue extension** for GitHub CLI
4. **Create project structure**:
   - `.claude/` - Main CCPM directory
   - `.claude/context/` - Context management
   - `.claude/agents/` - Agent configurations
   - `.claude/worktrees/` - Git worktrees for parallel execution
5. **Create configuration files**:
   - `.claude/config.json` - Project configuration
   - `.claude/.gitignore` - CCPM-specific gitignore
6. **Update project .gitignore** to exclude CCPM files
7. **Create CLI wrapper** (`./ccpm` or `ccpm.bat`) for easy command access

## Post-Installation

After successful installation, you can use CCPM commands:

```bash
# Show available commands
./ccpm help

# Create a new PRD (Product Requirements Document)
./ccpm prd-new "User Authentication System"

# Start a new epic
./ccpm epic-start "Implement OAuth2"

# Create a new issue
./ccpm issue-start "Add login form validation"

# Show project status
./ccpm status

# Show next available task
./ccpm next
```

## Configuration

The CCPM configuration is stored in `.claude/config.json`:

```json
{
  "project_name": "your-project",
  "ccpm_version": "1.0.0",
  "github_repo": "https://github.com/user/repo",
  "worktree_base": ".claude/worktrees",
  "context_dir": ".claude/context",
  "agents_dir": ".claude/agents",
  "max_parallel_agents": 5,
  "auto_cleanup_worktrees": true
}
```

### Configuration Options

- `project_name`: Name of your project
- `ccpm_version`: CCPM version (auto-managed)
- `github_repo`: GitHub repository URL (auto-detected)
- `worktree_base`: Directory for Git worktrees
- `context_dir`: Directory for context management
- `agents_dir`: Directory for agent configurations
- `max_parallel_agents`: Maximum number of parallel agents
- `auto_cleanup_worktrees`: Automatically clean up worktrees

## Troubleshooting

### GitHub CLI Installation Issues

**macOS:**
```bash
# Install Homebrew first
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install GitHub CLI
brew install gh
```

**Linux (Ubuntu/Debian):**
```bash
# Add GitHub CLI repository
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

# Install GitHub CLI
sudo apt-get update
sudo apt-get install gh
```

**Windows:**
Download from: https://cli.github.com/

### Authentication Issues

If GitHub CLI authentication fails:

1. Run `gh auth login` manually
2. Choose your preferred authentication method
3. Follow the prompts to complete authentication
4. Verify with `gh auth status`

### Permission Issues

If you encounter permission issues:

```bash
# Make scripts executable
chmod +x ccpm.sh
chmod +x install.sh

# Run with proper permissions
sudo ./ccpm.sh  # Only if necessary
```

### WSL (Windows Subsystem for Linux)

If you're using WSL:

1. The universal installer will automatically detect WSL
2. Use the Unix installation method
3. GitHub CLI will work normally in WSL

## Uninstalling CCPM

To remove CCPM from a project:

```bash
# Remove CCPM files
rm -rf .claude/
rm -f ccpm
rm -f ccpm.bat

# Remove from .gitignore (manually edit)
# Remove the lines:
# # CCPM files
# .claude/
```

## Support

For issues and questions:

- **GitHub Issues**: https://github.com/claude-ai/ccpm/issues
- **Documentation**: https://github.com/claude-ai/ccpm/docs
- **Discussions**: https://github.com/claude-ai/ccpm/discussions

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

CCPM is licensed under the MIT License. See [LICENSE](LICENSE) for details.
