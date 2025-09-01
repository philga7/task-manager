#!/usr/bin/env node

/**
 * CCPM NPM Post-Install Script
 * Runs after npm install to provide user instructions
 */

const chalk = require('chalk');

console.log('\n' + chalk.blue('🎉 CCPM CLI installed successfully!'));
console.log('\n' + chalk.white('Next steps:'));
console.log(chalk.green('  1.') + ' Navigate to your project directory');
console.log(chalk.green('  2.') + ' Run ' + chalk.yellow('ccpm init') + ' to initialize CCPM in your project');
console.log(chalk.green('  3.') + ' Run ' + chalk.yellow('ccpm help') + ' to see available commands');
console.log('\n' + chalk.white('Examples:'));
console.log('  ' + chalk.yellow('ccpm init'));
console.log('  ' + chalk.yellow('ccpm prd-new "User Authentication System"'));
console.log('  ' + chalk.yellow('ccpm epic-start "Implement OAuth2"'));
console.log('  ' + chalk.yellow('ccpm issue-start "Add login form validation"'));
console.log('  ' + chalk.yellow('ccpm status'));
console.log('\n' + chalk.blue('For more information, visit: https://github.com/claude-ai/ccpm'));
console.log('\n' + chalk.green('Happy coding! 🚀\n'));
