# CCPM Troubleshooting Guide

This guide helps you resolve common issues and problems when using CCPM. Each section includes symptoms, causes, and step-by-step solutions.

## 🚨 Quick Diagnosis

### Check CCPM Status

```bash
# Basic status check
ccpm status

# Check version
ccpm --version

# Check configuration
ccpm config list

# Check help
ccpm help
```

### Check System Requirements

```bash
# Check Python version
python --version

# Check GitHub CLI
gh --version

# Check Git
git --version

# Check network connectivity
ping github.com
```

## 🔐 Authentication Issues

### GitHub CLI Authentication Problems

#### Symptoms
- `Error: not logged in to any hosts`
- `Error: failed to read git config`
- `Error: could not determine GitHub host`

#### Solutions

**1. Re-authenticate with GitHub**
```bash
# Check current status
gh auth status

# Login again
gh auth login

# Follow the interactive prompts
# Choose your preferred protocol (HTTPS or SSH)
# Choose authentication method (browser or token)
```

**2. Verify Repository Access**
```bash
# Test repository access
gh repo view

# If you get permission errors, check:
# - Repository ownership
# - Organization membership
# - Repository visibility settings
```

**3. Check Token Permissions**
```bash
# List current tokens
gh auth token

# If using personal access token, ensure it has:
# - repo (full control of private repositories)
# - workflow (update GitHub Action workflows)
# - admin:org (full control of organizations and teams)
```

**4. Clear and Reset Authentication**
```bash
# Logout from all hosts
gh auth logout --all

# Clear stored credentials
gh auth logout

# Login again
gh auth login
```

### Repository Access Issues

#### Symptoms
- `Error: could not read from remote repository`
- `Error: authentication required`
- `Error: repository not found`

#### Solutions

**1. Check Repository URL**
```bash
# Verify remote URL
git remote -v

# Update remote if needed
git remote set-url origin https://github.com/username/repository.git
```

**2. Check SSH Keys (if using SSH)**
```bash
# List SSH keys
ssh-add -l

# Test SSH connection
ssh -T git@github.com

# Add SSH key if needed
ssh-add ~/.ssh/id_rsa
```

**3. Check HTTPS Credentials**
```bash
# Clear stored credentials
git config --global --unset credential.helper

# Or use credential manager
git config --global credential.helper manager-core
```

## 🐛 Command Execution Issues

### Command Not Found

#### Symptoms
- `ccpm: command not found`
- `bash: ccpm: No such file or directory`

#### Solutions

**1. Check Installation Path**
```bash
# Find CCPM installation
which ccpm

# If not found, check common locations
ls -la /usr/local/bin/ccpm
ls -la ~/.local/bin/ccpm
ls -la ./ccpm
```

**2. Add to PATH**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export PATH="$HOME/.local/bin:$PATH"
export PATH="/usr/local/bin:$PATH"

# Reload shell profile
source ~/.bashrc  # or source ~/.zshrc
```

**3. Reinstall CCPM**
```bash
# Download and run installer again
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/install.sh | bash
```

### Permission Denied

#### Symptoms
- `Permission denied (publickey)`
- `ccpm: Permission denied`
- `EACCES: permission denied`

#### Solutions

**1. Fix Script Permissions**
```bash
# Make script executable
chmod +x ccpm.sh

# Check file permissions
ls -la ccpm.sh
```

**2. Check Directory Permissions**
```bash
# Check current directory permissions
ls -la

# Fix directory permissions if needed
chmod 755 .
```

**3. Use Sudo (if necessary)**
```bash
# Install system-wide (not recommended for development)
sudo ./ccpm.sh
```

## 🔧 Configuration Issues

### Configuration File Problems

#### Symptoms
- `Error: configuration file not found`
- `Error: invalid configuration format`
- `Error: missing required configuration`

#### Solutions

**1. Check Configuration File**
```bash
# Look for configuration file
ls -la .claude/config.json

# If missing, reinitialize CCPM
ccpm init
```

**2. Validate Configuration Format**
```bash
# Check JSON syntax
cat .claude/config.json | python -m json.tool

# If invalid, recreate configuration
rm .claude/config.json
ccpm init
```

**3. Check Configuration Values**
```bash
# List current configuration
ccpm config list

# Set missing values
ccpm config set github_repo "https://github.com/username/repo"
ccpm config set project_name "My Project"
```

### Missing Dependencies

#### Symptoms
- `ModuleNotFoundError: No module named 'httpx'`
- `ImportError: cannot import name 'fastapi'`
- `Error: required package not found`

#### Solutions

**1. Install Python Dependencies**
```bash
# Install from requirements
pip install -r requirements.txt

# Or install manually
pip install httpx fastapi uvicorn
```

**2. Check Python Environment**
```bash
# Check Python path
which python

# Check pip path
which pip

# Use virtual environment if available
source venv/bin/activate  # or source .venv/bin/activate
```

**3. Update Dependencies**
```bash
# Update all packages
pip install --upgrade -r requirements.txt

# Or update specific packages
pip install --upgrade httpx fastapi
```

## 🌐 Network and Connectivity Issues

### GitHub API Connection Problems

#### Symptoms
- `Error: failed to connect to GitHub API`
- `Error: network timeout`
- `Error: rate limit exceeded`

#### Solutions

**1. Check Network Connectivity**
```bash
# Test basic connectivity
ping github.com

# Test HTTPS connectivity
curl -I https://api.github.com

# Check DNS resolution
nslookup github.com
```

**2. Check Firewall and Proxy**
```bash
# If behind corporate firewall
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Or configure Git to use proxy
git config --global http.proxy http://proxy.company.com:8080
```

**3. Handle Rate Limiting**
```bash
# Check rate limit status
gh api rate_limit

# If rate limited, wait or use authentication
gh auth login
```

### Slow Performance

#### Symptoms
- Commands take a long time to execute
- Timeout errors
- Slow response from GitHub API

#### Solutions

**1. Check Network Speed**
```bash
# Test download speed
curl -o /dev/null -s -w "%{speed_download}\n" https://github.com

# Use faster DNS servers
# Google: 8.8.8.8, 8.8.4.4
# Cloudflare: 1.1.1.1, 1.0.0.1
```

**2. Optimize GitHub CLI**
```bash
# Use SSH instead of HTTPS if faster
git remote set-url origin git@github.com:username/repo.git

# Configure Git for better performance
git config --global core.compression 9
git config --global http.postBuffer 524288000
```

**3. Use Local Caching**
```bash
# Enable local caching in CCPM
ccpm config set enable_cache true
ccpm config set cache_ttl 3600
```

## 📁 File and Directory Issues

### Missing .claude Directory

#### Symptoms
- `Error: .claude directory not found`
- `Error: project not initialized`
- `Error: missing project structure`

#### Solutions

**1. Check Current Directory**
```bash
# Verify you're in the right project
pwd
ls -la

# Look for .claude directory
ls -la .claude/
```

**2. Initialize Project**
```bash
# Initialize CCPM in current directory
ccpm init

# Or specify project details
ccpm init --project-name "My Project" --github-repo "https://github.com/username/repo"
```

**3. Check Git Repository**
```bash
# Ensure this is a Git repository
git status

# If not, initialize Git first
git init
git remote add origin https://github.com/username/repo.git
```

### Corrupted Configuration Files

#### Symptoms
- `Error: invalid JSON in configuration`
- `Error: configuration file corrupted`
- Unexpected behavior

#### Solutions

**1. Backup and Restore**
```bash
# Backup current configuration
cp .claude/config.json .claude/config.json.backup

# Try to fix JSON syntax
cat .claude/config.json | python -m json.tool > .claude/config.json.fixed

# If successful, replace original
mv .claude/config.json.fixed .claude/config.json
```

**2. Recreate Configuration**
```bash
# Remove corrupted files
rm -rf .claude/

# Reinitialize project
ccpm init
```

**3. Restore from Backup**
```bash
# If you have a working backup
cp .claude/config.json.backup .claude/config.json
```

## 🔄 Synchronization Issues

### GitHub Issues Not Syncing

#### Symptoms
- Local issues don't appear on GitHub
- GitHub issues don't appear locally
- Status updates not reflected

#### Solutions

**1. Check GitHub CLI Authentication**
```bash
# Verify authentication
gh auth status

# Test GitHub access
gh issue list
```

**2. Force Synchronization**
```bash
# Sync all issues
ccpm sync

# Or sync specific items
ccpm sync --issues
ccpm sync --epics
```

**3. Check Issue Mapping**
```bash
# List local issues
ccpm issue-list --format json

# List GitHub issues
gh issue list --json number,title,state

# Compare and identify mismatches
```

### Worktree Issues

#### Symptoms
- `Error: worktree already exists`
- `Error: cannot create worktree`
- `Error: worktree corrupted`

#### Solutions

**1. List Worktrees**
```bash
# List all worktrees
git worktree list

# Check worktree status
git worktree list --porcelain
```

**2. Clean Up Worktrees**
```bash
# Remove specific worktree
git worktree remove .claude/worktrees/worktree-name

# Or remove all CCPM worktrees
rm -rf .claude/worktrees/*
```

**3. Recreate Worktrees**
```bash
# CCPM will recreate worktrees as needed
ccpm epic-start "Test Epic" --prd test-project
```

## 🐍 Python and Environment Issues

### Python Version Problems

#### Symptoms
- `SyntaxError: invalid syntax`
- `AttributeError: module has no attribute`
- `TypeError: unsupported operand type`

#### Solutions

**1. Check Python Version**
```bash
# Check current version
python --version
python3 --version

# CCPM requires Python 3.8+
# If using older version, upgrade Python
```

**2. Use Correct Python Version**
```bash
# Use specific Python version
python3.9 ccpm status

# Or create virtual environment
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**3. Check PATH Order**
```bash
# Check which Python is being used
which python
which python3

# Ensure correct version is first in PATH
export PATH="/usr/local/bin/python3.9:$PATH"
```

### Virtual Environment Issues

#### Symptoms
- `ModuleNotFoundError` even after pip install
- Wrong Python version being used
- Package conflicts

#### Solutions

**1. Activate Virtual Environment**
```bash
# Activate virtual environment
source venv/bin/activate  # or source .venv/bin/activate

# Verify activation
which python
pip list
```

**2. Recreate Virtual Environment**
```bash
# Remove old environment
rm -rf venv/

# Create new environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**3. Check Environment Variables**
```bash
# Check if virtual environment is active
echo $VIRTUAL_ENV

# Check Python path
echo $PATH

# Ensure virtual environment is in PATH
export PATH="$VIRTUAL_ENV/bin:$PATH"
```

## 🚀 Performance and Resource Issues

### Memory Problems

#### Symptoms
- `MemoryError: unable to allocate array`
- Slow performance with large projects
- System becomes unresponsive

#### Solutions

**1. Check Memory Usage**
```bash
# Check system memory
free -h

# Check Python memory usage
python -c "import psutil; print(psutil.virtual_memory())"
```

**2. Optimize CCPM Usage**
```bash
# Use pagination for large lists
ccpm issue-list --limit 50

# Use specific filters
ccpm issue-list --epic specific-epic

# Export to file instead of displaying
ccpm status --format json > status.json
```

**3. Increase System Resources**
```bash
# If using virtual machine, increase memory allocation
# If using cloud, upgrade instance type
# Close unnecessary applications
```

### Slow Command Execution

#### Symptoms
- Commands take several seconds to complete
- Hanging on specific operations
- Timeout errors

#### Solutions

**1. Profile Command Performance**
```bash
# Use time command
time ccpm status

# Use Python profiler
python -m cProfile -o profile.stats ccpm status
```

**2. Optimize Configuration**
```bash
# Enable caching
ccpm config set enable_cache true

# Increase timeout values
ccpm config set api_timeout 60

# Use local storage instead of API calls
ccpm config set use_local_storage true
```

**3. Check Network Latency**
```bash
# Test GitHub API response time
curl -w "@curl-format.txt" -o /dev/null -s "https://api.github.com"

# Use closer GitHub regions if available
# Consider using GitHub Enterprise if available
```

## 🔍 Debugging and Logging

### Enable Debug Mode

```bash
# Enable verbose output
ccpm --verbose status

# Enable debug logging
export CCPM_DEBUG=true
ccpm status

# Check CCPM logs
tail -f ~/.ccpm/logs/ccpm.log
```

### Common Debug Commands

```bash
# Check system information
ccpm debug system

# Check configuration
ccpm debug config

# Check GitHub connectivity
ccpm debug github

# Check worktree status
ccpm debug worktrees
```

### Log Analysis

```bash
# View recent logs
tail -n 100 ~/.ccpm/logs/ccpm.log

# Search for errors
grep -i error ~/.ccpm/logs/ccpm.log

# Search for specific commands
grep "ccpm status" ~/.ccpm/logs/ccpm.log
```

## 🆘 Getting Help

### Self-Service Resources

1. **Check this troubleshooting guide** for common issues
2. **Review the [Command Reference](commands.md)** for correct syntax
3. **Check the [Workflow Guide](workflow.md)** for best practices
4. **Review the [Integration Guide](integration.md)** for tool connections

### Community Support

1. **GitHub Issues**: Report bugs and request features
2. **GitHub Discussions**: Ask questions and share solutions
3. **Documentation**: Check for updates and examples

### Professional Support

1. **Email Support**: Contact the development team
2. **Enterprise Support**: Available for enterprise customers
3. **Consulting Services**: Custom implementation and training

## 📋 Troubleshooting Checklist

### Before Reporting an Issue

- [ ] Check CCPM version: `ccpm --version`
- [ ] Verify Python version: `python --version`
- [ ] Check GitHub CLI: `gh --version`
- [ ] Test basic connectivity: `ping github.com`
- [ ] Check configuration: `ccpm config list`
- [ ] Enable debug mode: `export CCPM_DEBUG=true`
- [ ] Check logs: `tail -f ~/.ccpm/logs/ccpm.log`
- [ ] Try in clean environment
- [ ] Check for known issues in GitHub

### When Reporting an Issue

Include the following information:

1. **CCPM Version**: `ccpm --version`
2. **Operating System**: `uname -a` or `systeminfo`
3. **Python Version**: `python --version`
4. **GitHub CLI Version**: `gh --version`
5. **Error Message**: Complete error output
6. **Steps to Reproduce**: Exact commands and sequence
7. **Expected vs Actual Behavior**: What you expected vs what happened
8. **Environment Details**: Virtual environment, proxy settings, etc.
9. **Logs**: Relevant log entries with debug mode enabled

## 🎯 Prevention Tips

### Regular Maintenance

1. **Keep CCPM Updated**: Run `ccpm update` regularly
2. **Monitor Logs**: Check logs for warnings and errors
3. **Backup Configuration**: Keep backups of `.claude/` directory
4. **Test Integrations**: Verify GitHub and other integrations work
5. **Clean Up**: Remove old worktrees and temporary files

### Best Practices

1. **Use Virtual Environments**: Isolate Python dependencies
2. **Regular Authentication**: Re-authenticate with GitHub if issues arise
3. **Monitor Rate Limits**: Be aware of GitHub API limits
4. **Use Caching**: Enable local caching for better performance
5. **Regular Syncs**: Sync with GitHub regularly to avoid conflicts

---

For more help, see the [Command Reference](commands.md), [Workflow Guide](workflow.md), and [Integration Guide](integration.md).
