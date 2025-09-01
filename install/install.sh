#!/bin/bash

# Universal CCPM Installation Script
# This script detects the OS and runs the appropriate installation method

set -e

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

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*)    echo "windows";;
        MINGW*)     echo "windows";;
        MSYS*)      echo "windows";;
        *)          echo "unknown";;
    esac
}

# Function to detect if we're in WSL
is_wsl() {
    if [[ -n "$WSL_DISTRO_NAME" ]] || grep -q Microsoft /proc/version 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to get script directory
get_script_dir() {
    cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
}

# Main installation function
main() {
    local os=$(detect_os)
    local script_dir=$(get_script_dir)
    
    echo ""
    print_status "Universal CCPM Installation Script"
    print_status "Detected OS: $os"
    echo ""
    
    case $os in
        "macos"|"linux")
            print_status "Running Unix/Linux/macOS installation..."
            if [ -f "$script_dir/ccpm.sh" ]; then
                bash "$script_dir/ccpm.sh"
            else
                print_error "Installation script not found: $script_dir/ccpm.sh"
                exit 1
            fi
            ;;
        "windows")
            if is_wsl; then
                print_warning "Detected WSL (Windows Subsystem for Linux)"
                print_status "Running Unix installation in WSL..."
                if [ -f "$script_dir/ccpm.sh" ]; then
                    bash "$script_dir/ccpm.sh"
                else
                    print_error "Installation script not found: $script_dir/ccpm.sh"
                    exit 1
                fi
            else
                print_status "Running Windows installation..."
                if [ -f "$script_dir/ccpm.bat" ]; then
                    # Try to run the batch file
                    if command -v cmd.exe >/dev/null 2>&1; then
                        cmd.exe /c "$script_dir/ccpm.bat"
                    else
                        print_error "cmd.exe not found. Please run ccpm.bat manually."
                        exit 1
                    fi
                else
                    print_error "Installation script not found: $script_dir/ccpm.bat"
                    exit 1
                fi
            fi
            ;;
        *)
            print_error "Unsupported operating system: $os"
            print_warning "Please run the appropriate installation script manually:"
            echo "  - Unix/Linux/macOS: bash install/ccpm.sh"
            echo "  - Windows: ccpm.bat"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
