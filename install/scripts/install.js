#!/usr/bin/env node

/**
 * CCPM NPM Install Script
 * Runs during npm install to set up the CLI
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('[CCPM] Installing CCPM CLI...'));

// Copy installation scripts to a global location
const installDir = path.join(__dirname, '..');
const globalDir = path.join(process.env.HOME || process.env.USERPROFILE, '.ccpm');

try {
    // Create global directory
    fs.ensureDirSync(globalDir);
    
    // Copy installation scripts
    const scripts = ['ccpm.sh', 'ccpm.bat', 'install.sh'];
    scripts.forEach(script => {
        const source = path.join(installDir, script);
        const dest = path.join(globalDir, script);
        
        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            fs.chmodSync(dest, '755');
            console.log(chalk.green(`[CCPM] Copied ${script} to global directory`));
        }
    });
    
    // Copy README
    const readmeSource = path.join(installDir, 'README.md');
    const readmeDest = path.join(globalDir, 'README.md');
    if (fs.existsSync(readmeSource)) {
        fs.copyFileSync(readmeSource, readmeDest);
    }
    
    console.log(chalk.green('[CCPM] Installation completed successfully!'));
    console.log(chalk.blue('[CCPM] Global installation directory:'), globalDir);
    
} catch (error) {
    console.error(chalk.red('[CCPM] Installation failed:'), error.message);
    process.exit(1);
}
