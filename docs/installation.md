# CCPM Installation Guide

This guide will walk you through installing CCPM on your system and setting it up for your first project.

## 📋 Prerequisites

Before installing CCPM, ensure you have the following:

- **Git** (version 2.20 or higher)
- **Python** (version 3.8 or higher)
- **GitHub Account** with repository access
- **Terminal/Command Prompt** access

## 🚀 Quick Installation

### Universal Installer (Recommended)

The fastest way to get started:

```bash
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/install.sh | bash
```

This will automatically detect your platform and install everything needed.

### Platform-Specific Installation

#### macOS and Linux

```bash
# Download the installation script
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/ccpm.sh -o ccpm.sh

# Make it executable
chmod +x ccpm.sh

# Run the installer
./ccpm.sh
```

#### Windows

```cmd
# Download the installation script
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/ccpm.bat -o ccpm.bat

# Run the installer
ccpm.bat
```

#### Manual Installation

If you prefer to install manually or the automated installers don't work:

```bash
# Clone the repository
git clone https://github.com/claude-ai/ccpm.git
cd ccpm

# Install Python dependencies
pip install -r requirements.txt

# Set up the CLI wrapper
cp install/ccpm.sh /usr/local/bin/ccpm
chmod +x /usr/local/bin/ccpm
```

## 🔧 Post-Installation Setup

### 1. GitHub CLI Authentication

CCPM requires GitHub CLI for issue management. The installer will prompt you to authenticate:

```bash
gh auth login
```

Follow the interactive prompts to:
- Choose your preferred protocol (HTTPS or SSH)
- Authenticate with your GitHub account
- Set up authentication method (browser or token)

### 2. Install gh-sub-issue Extension

CCPM uses the `gh-sub-issue` extension for managing issue hierarchies:

```bash
gh extension install claude-ai/gh-sub-issue
```

### 3. Verify Installation

Test that everything is working:

```bash
ccpm --version
gh --version
gh extension list | grep sub-issue
```

## 🎯 Project Initialization

### 1. Navigate to Your Project

```bash
cd /path/to/your/project
```

### 2. Initialize CCPM

```bash
ccpm init
```

This will:
- Create `.claude/` directory structure
- Set up configuration files
- Initialize Git worktree management
- Create context management system

### 3. Verify Project Setup

```bash
ls -la .claude/
```

You should see:
```
.claude/
├── config.json
├── context/
├── agents/
├── worktrees/
└── .gitignore
```

## ⚙️ Configuration

### Configuration File

The main configuration is in `.claude/config.json`:

```json
{
  "project_name": "your-project-name",
  "ccpm_version": "1.0.0",
  "github_repo": "https://github.com/user/repo",
  "worktree_base": ".claude/worktrees",
  "context_dir": ".claude/context",
  "agents_dir": ".claude/agents",
  "max_parallel_agents": 5,
  "auto_cleanup_worktrees": true,
  "github_issue_template": "default",
  "context_persistence": true
}
```

### Environment Variables

You can also set configuration via environment variables:

```bash
export CCPM_GITHUB_REPO="https://github.com/user/repo"
export CCPM_MAX_AGENTS=10
export CCPM_AUTO_CLEANUP=false
```

## 🔍 Troubleshooting

### Common Issues

#### GitHub CLI Not Found
```bash
# Install GitHub CLI manually
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli
```

#### Python Dependencies Missing
```bash
# Install required packages
pip install httpx asyncio fastapi uvicorn

# Or use the requirements file
pip install -r requirements.txt
```

#### Permission Denied
```bash
# Fix script permissions
chmod +x ccpm.sh

# Or run with sudo (not recommended)
sudo ./ccpm.sh
```

#### Network Issues
If you're behind a corporate firewall or have network restrictions:

```bash
# Use a different DNS
export GITHUB_HOST=github.com

# Or configure proxy
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### Getting Help

If you encounter issues:

1. **Check the logs**: Look for error messages in the terminal output
2. **Verify prerequisites**: Ensure Git, Python, and GitHub CLI are properly installed
3. **Check network**: Ensure you can access GitHub and download packages
4. **Review configuration**: Verify your `.claude/config.json` is correct
5. **Create an issue**: Report bugs on the GitHub repository

## 🧪 Testing Your Installation

### 1. Create a Test PRD

```bash
ccpm prd-new "Test Project Requirements"
```

### 2. Start a Test Epic

```bash
ccpm epic-start "Test Epic"
```

### 3. Create a Test Issue

```bash
ccpm issue-start "Test Issue"
```

### 4. Check Status

```bash
ccpm status
```

## 🔄 Updating CCPM

### Automatic Updates

CCPM can check for updates automatically:

```bash
ccpm update
```

### Manual Updates

```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
pip install -r requirements.txt

# Update CLI wrapper
cp install/ccpm.sh /usr/local/bin/ccpm
```

## 🗑️ Uninstalling CCPM

### Remove CCPM Files

```bash
# Remove CLI wrapper
rm /usr/local/bin/ccpm

# Remove project files
rm -rf .claude/

# Remove from .gitignore
# Edit .gitignore and remove CCPM-related lines
```

### Clean Up Dependencies

```bash
# Remove Python packages (if not used elsewhere)
pip uninstall httpx fastapi uvicorn

# Remove GitHub CLI extension
gh extension remove claude-ai/gh-sub-issue
```

## 📚 Next Steps

After successful installation:

1. **Read the [Command Reference](commands.md)** to learn available commands
2. **Follow the [Workflow Guide](workflow.md)** for best practices
3. **Check [Integration Guide](integration.md)** for tool connections
4. **Review [Troubleshooting](troubleshooting.md)** for common issues

## 🆘 Support

- **Documentation**: Check other sections of this guide
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Join community discussions
- **Email**: Contact the development team

---

**Congratulations!** You've successfully installed CCPM. Now you're ready to start managing your projects with AI assistance.
