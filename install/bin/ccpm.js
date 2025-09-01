#!/usr/bin/env node

/**
 * CCPM CLI - Claude Code PM Command Line Interface
 * Main entry point for the npm package
 */

const { Command } = require('commander');
const program = new Command();
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Colors
const colors = {
    blue: chalk.blue,
    green: chalk.green,
    yellow: chalk.yellow,
    red: chalk.red,
    white: chalk.white
};

// Utility functions
function log(message, color = 'white') {
    console.log(colors[color](`[CCPM] ${message}`));
}

function logSuccess(message) {
    log(message, 'green');
}

function logWarning(message) {
    log(message, 'yellow');
}

function logError(message) {
    log(message, 'red');
}

function logInfo(message) {
    log(message, 'blue');
}

// Check if we're in a CCPM project
function isCCPMProject() {
    return fs.existsSync('.claude/config.json');
}

// Initialize CCPM in current project
function initCCPM() {
    logInfo('Initializing CCPM in current project...');
    
    try {
        // Check if already initialized
        if (isCCPMProject()) {
            logWarning('CCPM is already initialized in this project.');
            return;
        }
        
        // Get the installation script path
        const scriptPath = path.join(__dirname, '../install.sh');
        
        if (fs.existsSync(scriptPath)) {
            // Make executable and run
            fs.chmodSync(scriptPath, '755');
            execSync(`bash "${scriptPath}"`, { stdio: 'inherit' });
            logSuccess('CCPM initialized successfully!');
        } else {
            logError('Installation script not found. Please install CCPM manually.');
            process.exit(1);
        }
    } catch (error) {
        logError(`Failed to initialize CCPM: ${error.message}`);
        process.exit(1);
    }
}

// Show project status
function showStatus() {
    if (!isCCPMProject()) {
        logError('CCPM not initialized in this project. Run "ccpm init" first.');
        process.exit(1);
    }
    
    try {
        const config = fs.readJsonSync('.claude/config.json');
        const projectName = path.basename(process.cwd());
        
        console.log('\nCCPM Project Status:');
        console.log(`  Project: ${projectName}`);
        console.log(`  Version: ${config.ccpm_version}`);
        console.log(`  GitHub Repo: ${config.github_repo || 'Not set'}`);
        
        // Count worktrees
        const worktreePath = '.claude/worktrees';
        let worktreeCount = 0;
        if (fs.existsSync(worktreePath)) {
            worktreeCount = fs.readdirSync(worktreePath).filter(file => 
                fs.statSync(path.join(worktreePath, file)).isDirectory()
            ).length;
        }
        
        // Count context files
        const contextPath = '.claude/context';
        let contextCount = 0;
        if (fs.existsSync(contextPath)) {
            contextCount = fs.readdirSync(contextPath).filter(file => 
                file.endsWith('.json')
            ).length;
        }
        
        console.log(`  Worktrees: ${worktreeCount}`);
        console.log(`  Context files: ${contextCount}`);
        console.log('');
        
    } catch (error) {
        logError(`Failed to read project status: ${error.message}`);
        process.exit(1);
    }
}

// Create new PRD
function createPRD(title) {
    if (!title) {
        logError('PRD title is required. Usage: ccpm prd-new "Title"');
        process.exit(1);
    }
    
    logInfo(`Creating new PRD: ${title}`);
    // TODO: Implement PRD creation logic
    logWarning('PRD creation not yet implemented.');
}

// Start new epic
function startEpic(title) {
    if (!title) {
        logError('Epic title is required. Usage: ccpm epic-start "Title"');
        process.exit(1);
    }
    
    logInfo(`Starting new epic: ${title}`);
    // TODO: Implement epic creation logic
    logWarning('Epic creation not yet implemented.');
}

// Start new issue
function startIssue(title) {
    if (!title) {
        logError('Issue title is required. Usage: ccpm issue-start "Title"');
        process.exit(1);
    }
    
    logInfo(`Starting new issue: ${title}`);
    // TODO: Implement issue creation logic
    logWarning('Issue creation not yet implemented.');
}

// Show next task
function showNext() {
    logInfo('Next available task:');
    // TODO: Implement next task logic
    logWarning('Next task display not yet implemented.');
}

// Main CLI setup
program
    .name('ccpm')
    .description('Claude Code PM - Project Management CLI with GitHub integration')
    .version(version);

program
    .command('init')
    .description('Initialize CCPM in current project')
    .action(initCCPM);

program
    .command('status')
    .description('Show current project status')
    .action(showStatus);

program
    .command('prd-new <title>')
    .description('Create new PRD (Product Requirements Document)')
    .action(createPRD);

program
    .command('epic-start <title>')
    .description('Start new epic')
    .action(startEpic);

program
    .command('issue-start <title>')
    .description('Start new issue')
    .action(startIssue);

program
    .command('next')
    .description('Show next available task')
    .action(showNext);

// Default action
program.action(() => {
    console.log('\nCCPM (Claude Code PM) - Project Management Commands\n');
    console.log('Usage: ccpm <command> [options]\n');
    console.log('Commands:');
    console.log('  init          Initialize CCPM in current project');
    console.log('  prd-new       Create new PRD (Product Requirements Document)');
    console.log('  epic-start    Start new epic');
    console.log('  issue-start   Start new issue');
    console.log('  next          Show next available task');
    console.log('  status        Show current project status');
    console.log('  help          Show this help message\n');
    console.log('Examples:');
    console.log('  ccpm init');
    console.log('  ccpm prd-new "User Authentication System"');
    console.log('  ccpm epic-start "Implement OAuth2"');
    console.log('  ccpm issue-start "Add login form validation"');
    console.log('  ccpm status\n');
    console.log('For more information, visit: https://github.com/claude-ai/ccpm\n');
});

// Parse arguments
program.parse(process.argv);
