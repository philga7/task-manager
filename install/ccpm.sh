#!/bin/bash

# CCPM (Claude Code PM) Installation Script
# This script sets up CCPM in any project with GitHub CLI integration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CCPM]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[CCPM]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[CCPM]${NC} $1"
}

print_error() {
    echo -e "${RED}[CCPM]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*)    echo "windows";;
        MINGW*)     echo "windows";;
        *)          echo "unknown";;
    esac
}

# Function to install GitHub CLI
install_github_cli() {
    local os=$(detect_os)
    
    if command_exists gh; then
        print_success "GitHub CLI is already installed"
        return 0
    fi
    
    print_status "Installing GitHub CLI..."
    
    case $os in
        "macos")
            if command_exists brew; then
                brew install gh
            else
                print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
                return 1
            fi
            ;;
        "linux")
            # Try different package managers
            if command_exists apt-get; then
                curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
                sudo apt-get update
                sudo apt-get install gh
            elif command_exists yum; then
                sudo yum install gh
            elif command_exists dnf; then
                sudo dnf install gh
            else
                print_error "No supported package manager found. Please install GitHub CLI manually: https://cli.github.com/"
                return 1
            fi
            ;;
        *)
            print_error "Unsupported OS. Please install GitHub CLI manually: https://cli.github.com/"
            return 1
            ;;
    esac
    
    print_success "GitHub CLI installed successfully"
}

# Function to authenticate GitHub CLI
authenticate_github() {
    print_status "Setting up GitHub authentication..."
    
    if gh auth status >/dev/null 2>&1; then
        print_success "GitHub CLI is already authenticated"
        return 0
    fi
    
    print_warning "GitHub CLI authentication required. Please follow the prompts..."
    gh auth login
    
    if gh auth status >/dev/null 2>&1; then
        print_success "GitHub CLI authenticated successfully"
    else
        print_error "GitHub CLI authentication failed"
        return 1
    fi
}

# Function to install gh-sub-issue extension
install_gh_sub_issue() {
    print_status "Installing gh-sub-issue extension..."
    
    if gh extension list | grep -q "sub-issue"; then
        print_success "gh-sub-issue extension is already installed"
        return 0
    fi
    
    gh extension install claude-ai/gh-sub-issue
    
    if gh extension list | grep -q "sub-issue"; then
        print_success "gh-sub-issue extension installed successfully"
    else
        print_error "Failed to install gh-sub-issue extension"
        return 1
    fi
}

# Function to create CCPM project structure
create_ccpm_structure() {
    print_status "Creating CCPM project structure..."
    
    # Create .claude directory if it doesn't exist
    if [ ! -d ".claude" ]; then
        mkdir -p .claude
        print_success "Created .claude directory"
    fi
    
    # Create .claude/context directory
    if [ ! -d ".claude/context" ]; then
        mkdir -p .claude/context
        print_success "Created .claude/context directory"
    fi
    
    # Create .claude/agents directory
    if [ ! -d ".claude/agents" ]; then
        mkdir -p .claude/agents
        print_success "Created .claude/agents directory"
    fi
    
    # Create .claude/worktrees directory
    if [ ! -d ".claude/worktrees" ]; then
        mkdir -p .claude/worktrees
        print_success "Created .claude/worktrees directory"
    fi
}

# Function to create CCPM configuration files
create_ccpm_config() {
    print_status "Creating CCPM configuration files..."
    
    # Create .claude/config.json if it doesn't exist
    if [ ! -f ".claude/config.json" ]; then
        cat > .claude/config.json << EOF
{
  "project_name": "$(basename $(pwd))",
  "ccpm_version": "1.0.0",
  "github_repo": "$(git remote get-url origin 2>/dev/null || echo '')",
  "worktree_base": ".claude/worktrees",
  "context_dir": ".claude/context",
  "agents_dir": ".claude/agents",
  "max_parallel_agents": 5,
  "auto_cleanup_worktrees": true
}
EOF
        print_success "Created .claude/config.json"
    fi
    
    # Create .claude/.gitignore if it doesn't exist
    if [ ! -f ".claude/.gitignore" ]; then
        cat > .claude/.gitignore << EOF
# CCPM generated files
worktrees/
context/sessions/
agents/temp/
*.log
*.tmp
EOF
        print_success "Created .claude/.gitignore"
    fi
}

# Function to update main .gitignore
update_gitignore() {
    print_status "Updating .gitignore..."
    
    if [ ! -f ".gitignore" ]; then
        touch .gitignore
    fi
    
    # Check if .claude is already in .gitignore
    if ! grep -q "^\.claude/$" .gitignore; then
        echo "" >> .gitignore
        echo "# CCPM files" >> .gitignore
        echo ".claude/" >> .gitignore
        print_success "Added .claude/ to .gitignore"
    else
        print_success ".claude/ already in .gitignore"
    fi
}

# Function to create CCPM CLI wrapper
create_ccpm_cli() {
    print_status "Creating CCPM CLI wrapper..."
    
    # Create ccpm script in project root
    cat > ccpm << 'EOF'
#!/bin/bash

# CCPM CLI Wrapper
# This script provides CCPM commands for the current project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$SCRIPT_DIR/.claude"

# Check if .claude directory exists
if [ ! -d "$CLAUDE_DIR" ]; then
    echo "Error: CCPM not initialized in this project. Run 'ccpm init' first."
    exit 1
fi

# Function to show help
show_help() {
    echo "CCPM (Claude Code PM) - Project Management Commands"
    echo ""
    echo "Usage: ./ccpm <command> [options]"
    echo ""
    echo "Commands:"
    echo "  init          Initialize CCPM in current project"
    echo "  prd-new       Create new PRD (Product Requirements Document)"
    echo "  epic-start    Start new epic"
    echo "  issue-start   Start new issue"
    echo "  next          Show next available task"
    echo "  status        Show current project status"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./ccpm prd-new 'User Authentication System'"
    echo "  ./ccpm epic-start 'Implement OAuth2'"
    echo "  ./ccpm issue-start 'Add login form validation'"
}

# Function to run CCPM commands
run_ccpm_command() {
    local command="$1"
    shift
    
    case "$command" in
        "prd-new")
            echo "Creating new PRD: $*"
            # TODO: Implement PRD creation
            ;;
        "epic-start")
            echo "Starting new epic: $*"
            # TODO: Implement epic creation
            ;;
        "issue-start")
            echo "Starting new issue: $*"
            # TODO: Implement issue creation
            ;;
        "next")
            echo "Next available task:"
            # TODO: Implement next task display
            ;;
        "status")
            echo "CCPM Project Status:"
            echo "  Project: $(basename "$SCRIPT_DIR")"
            echo "  Worktrees: $(find "$CLAUDE_DIR/worktrees" -maxdepth 1 -type d 2>/dev/null | wc -l)"
            echo "  Context files: $(find "$CLAUDE_DIR/context" -name "*.json" 2>/dev/null | wc -l)"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Main execution
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

run_ccpm_command "$@"
EOF

    chmod +x ccpm
    print_success "Created CCPM CLI wrapper (./ccpm)"
}

# Function to display completion message
show_completion() {
    echo ""
    print_success "🎉 CCPM installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Run './ccpm help' to see available commands"
    echo "  2. Run './ccpm prd-new <title>' to create your first PRD"
    echo "  3. Run './ccpm epic-start <title>' to start an epic"
    echo "  4. Run './ccpm issue-start <title>' to create an issue"
    echo ""
    echo "For more information, visit: https://github.com/claude-ai/ccpm"
    echo ""
}

# Main installation function
main() {
    echo ""
    print_status "Starting CCPM installation..."
    echo ""
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_warning "Not in a git repository. Initializing git..."
        git init
    fi
    
    # Install GitHub CLI
    install_github_cli
    
    # Authenticate GitHub CLI
    authenticate_github
    
    # Install gh-sub-issue extension
    install_gh_sub_issue
    
    # Create CCPM project structure
    create_ccpm_structure
    
    # Create CCPM configuration files
    create_ccpm_config
    
    # Update .gitignore
    update_gitignore
    
    # Create CCPM CLI wrapper
    create_ccpm_cli
    
    # Show completion message
    show_completion
}

# Run main function
main "$@"
