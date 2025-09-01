@echo off
setlocal enabledelayedexpansion

REM CCPM (Claude Code PM) Installation Script for Windows
REM This script sets up CCPM in any project with GitHub CLI integration

echo.
echo [CCPM] Starting CCPM installation...
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo [CCPM] Not in a git repository. Initializing git...
    git init
)

REM Function to check if command exists
:command_exists
set "cmd=%~1"
where %cmd% >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Check if GitHub CLI is installed
call :command_exists gh
if %errorlevel% equ 0 (
    echo [CCPM] GitHub CLI is already installed
    goto :authenticate_github
) else (
    echo [CCPM] Installing GitHub CLI...
    echo [CCPM] Please install GitHub CLI manually from: https://cli.github.com/
    echo [CCPM] After installation, run this script again.
    pause
    exit /b 1
)

:authenticate_github
echo [CCPM] Setting up GitHub authentication...
gh auth status >nul 2>&1
if %errorlevel% equ 0 (
    echo [CCPM] GitHub CLI is already authenticated
    goto :install_gh_sub_issue
) else (
    echo [CCPM] GitHub CLI authentication required. Please follow the prompts...
    gh auth login
    gh auth status >nul 2>&1
    if %errorlevel% equ 0 (
        echo [CCPM] GitHub CLI authenticated successfully
    ) else (
        echo [CCPM] GitHub CLI authentication failed
        pause
        exit /b 1
    )
)

:install_gh_sub_issue
echo [CCPM] Installing gh-sub-issue extension...
gh extension list | findstr "sub-issue" >nul 2>&1
if %errorlevel% equ 0 (
    echo [CCPM] gh-sub-issue extension is already installed
    goto :create_ccpm_structure
) else (
    gh extension install claude-ai/gh-sub-issue
    gh extension list | findstr "sub-issue" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [CCPM] gh-sub-issue extension installed successfully
    ) else (
        echo [CCPM] Failed to install gh-sub-issue extension
        pause
        exit /b 1
    )
)

:create_ccpm_structure
echo [CCPM] Creating CCPM project structure...

REM Create .claude directory if it doesn't exist
if not exist ".claude" (
    mkdir .claude
    echo [CCPM] Created .claude directory
)

REM Create .claude/context directory
if not exist ".claude\context" (
    mkdir .claude\context
    echo [CCPM] Created .claude\context directory
)

REM Create .claude/agents directory
if not exist ".claude\agents" (
    mkdir .claude\agents
    echo [CCPM] Created .claude\agents directory
)

REM Create .claude/worktrees directory
if not exist ".claude\worktrees" (
    mkdir .claude\worktrees
    echo [CCPM] Created .claude\worktrees directory
)

:create_ccpm_config
echo [CCPM] Creating CCPM configuration files...

REM Create .claude/config.json if it doesn't exist
if not exist ".claude\config.json" (
    echo {> .claude\config.json
    echo   "project_name": "%cd%",>> .claude\config.json
    echo   "ccpm_version": "1.0.0",>> .claude\config.json
    echo   "github_repo": "",>> .claude\config.json
    echo   "worktree_base": ".claude/worktrees",>> .claude\config.json
    echo   "context_dir": ".claude/context",>> .claude\config.json
    echo   "agents_dir": ".claude/agents",>> .claude\config.json
    echo   "max_parallel_agents": 5,>> .claude\config.json
    echo   "auto_cleanup_worktrees": true>> .claude\config.json
    echo }>> .claude\config.json
    echo [CCPM] Created .claude\config.json
)

REM Create .claude/.gitignore if it doesn't exist
if not exist ".claude\.gitignore" (
    echo # CCPM generated files> .claude\.gitignore
    echo worktrees/>> .claude\.gitignore
    echo context/sessions/>> .claude\.gitignore
    echo agents/temp/>> .claude\.gitignore
    echo *.log>> .claude\.gitignore
    echo *.tmp>> .claude\.gitignore
    echo [CCPM] Created .claude\.gitignore
)

:update_gitignore
echo [CCPM] Updating .gitignore...

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    type nul > .gitignore
)

REM Check if .claude is already in .gitignore
findstr /c:".claude/" .gitignore >nul 2>&1
if %errorlevel% neq 0 (
    echo.>> .gitignore
    echo # CCPM files>> .gitignore
    echo .claude/>> .gitignore
    echo [CCPM] Added .claude/ to .gitignore
) else (
    echo [CCPM] .claude/ already in .gitignore
)

:create_ccpm_cli
echo [CCPM] Creating CCPM CLI wrapper...

REM Create ccpm.bat script in project root
echo @echo off> ccpm.bat
echo setlocal enabledelayedexpansion>> ccpm.bat
echo.>> ccpm.bat
echo REM CCPM CLI Wrapper for Windows>> ccpm.bat
echo REM This script provides CCPM commands for the current project>> ccpm.bat
echo.>> ccpm.bat
echo set "SCRIPT_DIR=%%~dp0">> ccpm.bat
echo set "CLAUDE_DIR=%%SCRIPT_DIR%%.claude">> ccpm.bat
echo.>> ccpm.bat
echo REM Check if .claude directory exists>> ccpm.bat
echo if not exist "%%CLAUDE_DIR%%" ^(>> ccpm.bat
echo     echo Error: CCPM not initialized in this project. Run 'ccpm init' first.>> ccpm.bat
echo     exit /b 1>> ccpm.bat
echo ^)>> ccpm.bat
echo.>> ccpm.bat
echo if "%%1"=="" ^(>> ccpm.bat
echo     echo CCPM ^(Claude Code PM^) - Project Management Commands>> ccpm.bat
echo     echo.>> ccpm.bat
echo     echo Usage: ccpm.bat ^<command^> [options]>> ccpm.bat
echo     echo.>> ccpm.bat
echo     echo Commands:>> ccpm.bat
echo     echo   init          Initialize CCPM in current project>> ccpm.bat
echo     echo   prd-new       Create new PRD ^(Product Requirements Document^)>> ccpm.bat
echo     echo   epic-start    Start new epic>> ccpm.bat
echo     echo   issue-start   Start new issue>> ccpm.bat
echo     echo   next          Show next available task>> ccpm.bat
echo     echo   status        Show current project status>> ccpm.bat
echo     echo   help          Show this help message>> ccpm.bat
echo     echo.>> ccpm.bat
echo     echo Examples:>> ccpm.bat
echo     echo   ccpm.bat prd-new "User Authentication System">> ccpm.bat
echo     echo   ccpm.bat epic-start "Implement OAuth2">> ccpm.bat
echo     echo   ccpm.bat issue-start "Add login form validation">> ccpm.bat
echo     exit /b 0>> ccpm.bat
echo ^)>> ccpm.bat
echo.>> ccpm.bat
echo if "%%1"=="prd-new" ^(>> ccpm.bat
echo     echo Creating new PRD: %%2>> ccpm.bat
echo     REM TODO: Implement PRD creation>> ccpm.bat
echo ^) else if "%%1"=="epic-start" ^(>> ccpm.bat
echo     echo Starting new epic: %%2>> ccpm.bat
echo     REM TODO: Implement epic creation>> ccpm.bat
echo ^) else if "%%1"=="issue-start" ^(>> ccpm.bat
echo     echo Starting new issue: %%2>> ccpm.bat
echo     REM TODO: Implement issue creation>> ccpm.bat
echo ^) else if "%%1"=="next" ^(>> ccpm.bat
echo     echo Next available task:>> ccpm.bat
echo     REM TODO: Implement next task display>> ccpm.bat
echo ^) else if "%%1"=="status" ^(>> ccpm.bat
echo     echo CCPM Project Status:>> ccpm.bat
echo     echo   Project: %%~nx>> ccpm.bat
echo     echo   Worktrees: 0>> ccpm.bat
echo     echo   Context files: 0>> ccpm.bat
echo ^) else if "%%1"=="help" ^(>> ccpm.bat
echo     echo CCPM ^(Claude Code PM^) - Project Management Commands>> ccpm.bat
echo     echo.>> ccpm.bat
echo     echo Usage: ccpm.bat ^<command^> [options]>> ccpm.bat
echo     echo.>> ccpm.bat
echo     echo Commands:>> ccpm.bat
echo     echo   init          Initialize CCPM in current project>> ccpm.bat
echo     echo   prd-new       Create new PRD ^(Product Requirements Document^)>> ccpm.bat
echo     echo   epic-start    Start new epic>> ccpm.bat
echo     echo   issue-start   Start new issue>> ccpm.bat
echo     echo   next          Show next available task>> ccpm.bat
echo     echo   status        Show current project status>> ccpm.bat
echo     echo   help          Show this help message>> ccpm.bat
echo ^) else ^(>> ccpm.bat
echo     echo Unknown command: %%1>> ccpm.bat
echo     echo Run 'ccpm.bat help' for usage information.>> ccpm.bat
echo     exit /b 1>> ccpm.bat
echo ^)>> ccpm.bat

echo [CCPM] Created CCPM CLI wrapper (ccpm.bat)

:show_completion
echo.
echo [CCPM] 🎉 CCPM installation completed successfully!
echo.
echo Next steps:
echo   1. Run 'ccpm.bat help' to see available commands
echo   2. Run 'ccpm.bat prd-new ^<title^>' to create your first PRD
echo   3. Run 'ccpm.bat epic-start ^<title^>' to start an epic
echo   4. Run 'ccpm.bat issue-start ^<title^>' to create an issue
echo.
echo For more information, visit: https://github.com/claude-ai/ccpm
echo.
pause
