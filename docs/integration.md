# CCPM Integration Guide

This guide covers integrating CCPM with various tools, systems, and workflows to enhance your project management capabilities.

## 🔗 Integration Overview

CCPM is designed to integrate seamlessly with your existing development ecosystem. This guide covers:

- **GitHub Integration**: Deep integration with GitHub Issues and CLI
- **CI/CD Systems**: Automated workflows and deployments
- **Development Tools**: IDE and editor integrations
- **Monitoring Systems**: Progress tracking and reporting
- **Communication Tools**: Team collaboration and notifications
- **Custom Integrations**: Building your own integrations

## 🐙 GitHub Integration

### GitHub CLI Integration

CCPM uses GitHub CLI (`gh`) for all GitHub operations. This provides:

- **Authentication**: Secure access to your repositories
- **Issue Management**: Create, update, and manage GitHub issues
- **Repository Access**: Full access to repository data and settings
- **Extension Support**: Access to GitHub CLI extensions

#### Setup GitHub CLI

```bash
# Install GitHub CLI
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli

# Authenticate
gh auth login
```

#### Verify Integration

```bash
# Check authentication
gh auth status

# Test repository access
gh repo view

# List available extensions
gh extension list
```

### GitHub Issues Integration

CCPM automatically creates and manages GitHub issues:

```bash
# Create issue with CCPM
ccpm issue-start "Implement user authentication" \
  --epic auth-system \
  --description "Add secure user login and registration" \
  --labels "feature,security,backend"

# CCPM automatically creates GitHub issue with:
# - Proper title and description
# - Associated labels
# - Epic linking
# - Priority and status tracking
```

#### Issue Templates

CCPM supports GitHub issue templates:

```bash
# Use specific template
ccpm issue-start "Bug report" \
  --template bug-report \
  --epic system-maintenance

# Available templates
ccpm issue-start --help
```

#### Issue Synchronization

CCPM keeps local and GitHub issues in sync:

```bash
# Update local issue
ccpm issue-update "implement-user-auth" --status in-progress

# CCPM automatically updates GitHub issue

# Update GitHub issue directly
gh issue edit 123 --body "Updated description"

# CCPM syncs changes on next status check
ccpm status
```

### GitHub Workflows Integration

Integrate CCPM with GitHub Actions for automated workflows:

#### Automated Issue Creation

```yaml
# .github/workflows/ccpm-sync.yml
name: CCPM Sync
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  sync-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          
      - name: Install CCPM
        run: |
          pip install -r requirements.txt
          
      - name: Sync Issues
        run: |
          ccpm sync --format json > sync-report.json
          
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: sync-report
          path: sync-report.json
```

#### Automated Status Updates

```yaml
# .github/workflows/ccpm-status.yml
name: CCPM Status Update
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Weekdays at 9 AM
  workflow_dispatch:

jobs:
  status-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate Status Report
        run: |
          ccpm status --format markdown > status-report.md
          
      - name: Create Status Issue
        run: |
          gh issue create \
            --title "Weekly Status Report $(date +%Y-%m-%d)" \
            --body-file status-report.md \
            --label "status-report"
```

## 🔄 CI/CD Integration

### GitHub Actions Integration

#### Automated Testing

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          
      - name: Run tests
        run: |
          ccpm test --format json > test-results.json
          
      - name: Update test status
        run: |
          ccpm issue-update "run-tests" --status completed \
            --notes "Tests completed successfully"
```

#### Automated Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Your deployment logic here
          echo "Deploying version ${{ github.ref_name }}"
          
      - name: Update deployment status
        run: |
          ccpm issue-update "deploy-version" --status completed \
            --notes "Successfully deployed version ${{ github.ref_name }}"
```

### Jenkins Integration

#### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup CCPM') {
            steps {
                sh 'pip install -r requirements.txt'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'ccpm test --format json > test-results.json'
            }
        }
        
        stage('Update Status') {
            steps {
                sh 'ccpm issue-update "jenkins-test-run" --status completed'
            }
        }
    }
}
```

### GitLab CI Integration

```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

test:
  stage: test
  script:
    - pip install -r requirements.txt
    - ccpm test --format json > test-results.json
    - ccpm issue-update "gitlab-test-run" --status completed
  artifacts:
    paths:
      - test-results.json

deploy:
  stage: deploy
  script:
    - echo "Deploying..."
    - ccpm issue-update "deploy-production" --status completed
  only:
    - tags
```

## 🛠️ Development Tools Integration

### VS Code Integration

#### CCPM Extension

Install the CCPM extension for VS Code:

```json
// .vscode/extensions.json
{
    "recommendations": [
        "claude-ai.ccpm"
    ]
}
```

#### VS Code Settings

```json
// .vscode/settings.json
{
    "ccpm.enabled": true,
    "ccpm.projectPath": "${workspaceFolder}",
    "ccpm.autoSync": true,
    "ccpm.statusBar": true
}
```

#### VS Code Tasks

```json
// .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "CCPM Status",
            "type": "shell",
            "command": "ccpm",
            "args": ["status"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "CCPM Next",
            "type": "shell",
            "command": "ccpm",
            "args": ["next"],
            "group": "build"
        }
    ]
}
```

### IntelliJ IDEA Integration

#### External Tools

Configure CCPM as external tools in IntelliJ:

1. Go to **File** → **Settings** → **Tools** → **External Tools**
2. Add new tool:
   - **Name**: CCPM Status
   - **Program**: `ccpm`
   - **Parameters**: `status`
   - **Working directory**: `$ProjectFileDir$`

#### Run Configurations

Create custom run configurations for CCPM commands:

```xml
<!-- .idea/runConfigurations/CCPM_Status.xml -->
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="CCPM Status" type="PythonConfigurationType">
    <module name="project-name" />
    <option name="scriptName" value="$PROJECT_DIR$/ccpm" />
    <option name="parameters" value="status" />
    <option name="workingDirectory" value="$PROJECT_DIR$" />
  </configuration>
</component>
```

### Command Line Integration

#### Shell Aliases

Add convenient aliases to your shell configuration:

```bash
# ~/.bashrc or ~/.zshrc
alias ccpm-status='ccpm status'
alias ccpm-next='ccpm next'
alias ccpm-issues='ccpm issue-list'
alias ccpm-epics='ccpm epic-list'
alias ccpm-prds='ccpm prd-list'
```

#### Shell Functions

Create helpful shell functions:

```bash
# ~/.bashrc or ~/.zshrc
ccpm-work() {
    echo "Current project status:"
    ccpm status
    echo ""
    echo "Next recommended tasks:"
    ccpm next --limit 5
}

ccpm-daily() {
    echo "Daily CCPM Report - $(date)"
    echo "========================"
    ccpm status --format markdown
    echo ""
    echo "Open issues:"
    ccpm issue-list --status open --format table
}
```

## 📊 Monitoring and Reporting Integration

### Dashboard Integration

#### Grafana Dashboard

Create Grafana dashboards for CCPM metrics:

```json
// grafana-dashboard.json
{
  "dashboard": {
    "title": "CCPM Project Metrics",
    "panels": [
      {
        "title": "Issue Completion Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "ccpm_issues_completed_total / ccpm_issues_total * 100"
          }
        ]
      },
      {
        "title": "Epic Progress",
        "type": "bargraph",
        "targets": [
          {
            "expr": "ccpm_epic_progress"
          }
        ]
      }
    ]
  }
}
```

#### Prometheus Metrics

Export CCPM metrics to Prometheus:

```python
# metrics_exporter.py
from prometheus_client import Counter, Gauge, Histogram
import subprocess
import json

# Metrics
issues_total = Counter('ccpm_issues_total', 'Total number of issues')
issues_completed = Counter('ccpm_issues_completed', 'Completed issues')
epic_progress = Gauge('ccpm_epic_progress', 'Epic progress percentage')

def export_metrics():
    # Get CCPM status
    result = subprocess.run(['ccpm', 'status', '--format', 'json'], 
                          capture_output=True, text=True)
    data = json.loads(result.stdout)
    
    # Update metrics
    issues_total._value._value = data['total_issues']
    issues_completed._value._value = data['completed_issues']
    
    for epic in data['epics']:
        epic_progress.labels(epic=epic['id']).set(epic['progress'])
```

### Slack Integration

#### Slack Notifications

Send CCPM updates to Slack:

```python
# slack_notifier.py
import requests
import subprocess
import json

SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

def send_slack_notification(message):
    payload = {"text": message}
    requests.post(SLACK_WEBHOOK_URL, json=payload)

def notify_issue_completion(issue_id):
    result = subprocess.run(['ccpm', 'issue-show', issue_id, '--format', 'json'], 
                          capture_output=True, text=True)
    issue = json.loads(result.stdout)
    
    message = f"🎉 Issue completed: *{issue['title']}*\n"
    message += f"Epic: {issue['epic']}\n"
    message += f"Completed by: {issue['assignee']}\n"
    message += f"Notes: {issue['completion_notes']}"
    
    send_slack_notification(message)

# Usage
notify_issue_completion("implement-user-auth")
```

#### Slack Commands

Create Slack slash commands for CCPM:

```python
# slack_commands.py
from flask import Flask, request
import subprocess
import json

app = Flask(__name__)

@app.route('/ccpm', methods=['POST'])
def handle_ccpm_command():
    command = request.form['command']
    text = request.form['text']
    
    if command == '/ccpm-status':
        result = subprocess.run(['ccpm', 'status', '--format', 'json'], 
                              capture_output=True, text=True)
        data = json.loads(result.stdout)
        
        response = f"📊 Project Status:\n"
        response += f"• Total Issues: {data['total_issues']}\n"
        response += f"• Completed: {data['completed_issues']}\n"
        response += f"• Progress: {data['overall_progress']}%"
        
        return {"text": response}
    
    elif command == '/ccpm-next':
        result = subprocess.run(['ccpm', 'next', '--limit', '3', '--format', 'json'], 
                              capture_output=True, text=True)
        data = json.loads(result.stdout)
        
        response = "🎯 Next Recommended Tasks:\n"
        for task in data['tasks']:
            response += f"• {task['title']} (Priority: {task['priority']})\n"
        
        return {"text": response}

if __name__ == '__main__':
    app.run(debug=True)
```

### Email Integration

#### Email Notifications

Send CCPM reports via email:

```python
# email_notifier.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import subprocess
import json

def send_email_report(recipient, subject, body):
    msg = MIMEMultipart()
    msg['From'] = 'ccpm@yourcompany.com'
    msg['To'] = recipient
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Send email (configure your SMTP settings)
    server = smtplib.SMTP('smtp.yourcompany.com', 587)
    server.starttls()
    server.login('username', 'password')
    server.send_message(msg)
    server.quit()

def generate_daily_report():
    # Get CCPM status
    result = subprocess.run(['ccpm', 'status', '--format', 'markdown'], 
                          capture_output=True, text=True)
    
    subject = f"Daily CCPM Report - {datetime.now().strftime('%Y-%m-%d')}"
    body = result.stdout
    
    return subject, body

# Send daily report
subject, body = generate_daily_report()
send_email_report('team@yourcompany.com', subject, body)
```

## 🔧 Custom Integrations

### API Integration

CCPM provides a REST API for custom integrations:

```python
# custom_integration.py
import requests
import json

CCPM_API_BASE = "http://localhost:8000"

class CCPMClient:
    def __init__(self, base_url=CCPM_API_BASE):
        self.base_url = base_url
    
    def get_status(self):
        response = requests.get(f"{self.base_url}/status")
        return response.json()
    
    def create_issue(self, title, epic, description):
        data = {
            "title": title,
            "epic": epic,
            "description": description
        }
        response = requests.post(f"{self.base_url}/issues", json=data)
        return response.json()
    
    def update_issue(self, issue_id, status):
        data = {"status": status}
        response = requests.patch(f"{self.base_url}/issues/{issue_id}", json=data)
        return response.json()

# Usage
client = CCPMClient()
status = client.get_status()
print(f"Project progress: {status['overall_progress']}%")
```

### Webhook Integration

Set up webhooks for real-time updates:

```python
# webhook_handler.py
from flask import Flask, request
import subprocess
import json

app = Flask(__name__)

@app.route('/webhook/ccpm', methods=['POST'])
def handle_webhook():
    event_type = request.headers.get('X-CCPM-Event')
    payload = request.json
    
    if event_type == 'issue.completed':
        # Handle issue completion
        issue_id = payload['issue']['id']
        issue_title = payload['issue']['title']
        
        # Update external systems
        update_jira_ticket(issue_id, 'completed')
        send_slack_notification(f"Issue completed: {issue_title}")
        
    elif event_type == 'epic.completed':
        # Handle epic completion
        epic_id = payload['epic']['id']
        epic_title = payload['epic']['title']
        
        # Trigger next phase
        start_next_epic(epic_id)
        
    return {"status": "success"}

def update_jira_ticket(issue_id, status):
    # Update Jira ticket status
    pass

def send_slack_notification(message):
    # Send Slack notification
    pass

def start_next_epic(epic_id):
    # Start next epic in sequence
    pass

if __name__ == '__main__':
    app.run(debug=True)
```

## 📱 Mobile Integration

### Mobile App Integration

Create mobile apps that integrate with CCPM:

```python
# mobile_api.py
from flask import Flask, request, jsonify
import subprocess
import json

app = Flask(__name__)

@app.route('/mobile/status', methods=['GET'])
def get_mobile_status():
    result = subprocess.run(['ccpm', 'status', '--format', 'json'], 
                          capture_output=True, text=True)
    data = json.loads(result.stdout)
    
    # Format for mobile consumption
    mobile_data = {
        "progress": data['overall_progress'],
        "active_epics": len([e for e in data['epics'] if e['status'] == 'active']),
        "open_issues": len([i for i in data['issues'] if i['status'] == 'open']),
        "recent_activity": data['recent_activity'][:5]
    }
    
    return jsonify(mobile_data)

@app.route('/mobile/next', methods=['GET'])
def get_mobile_next():
    result = subprocess.run(['ccpm', 'next', '--limit', '5', '--format', 'json'], 
                          capture_output=True, text=True)
    return jsonify(result.json())

if __name__ == '__main__':
    app.run(debug=True)
```

## 🔒 Security and Authentication

### API Authentication

Secure your CCPM integrations:

```python
# secure_api.py
from functools import wraps
from flask import request, jsonify
import jwt

SECRET_KEY = 'your-secret-key'

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(*args, **kwargs)
    return decorated

@app.route('/secure/status', methods=['GET'])
@require_auth
def get_secure_status():
    # Only authenticated users can access
    return get_status()
```

## 📚 Integration Examples

### Complete Integration Setup

Here's a complete example of setting up multiple integrations:

```bash
# 1. Install CCPM
curl -fsSL https://raw.githubusercontent.com/claude-ai/ccpm/main/install/install.sh | bash

# 2. Initialize project
ccpm init --project-name "My Project" --github-repo "https://github.com/user/repo"

# 3. Set up GitHub Actions
mkdir -p .github/workflows
# Create workflow files (see examples above)

# 4. Set up monitoring
pip install prometheus_client
# Create metrics exporter

# 5. Set up notifications
# Configure Slack webhooks and email settings

# 6. Test integrations
ccpm issue-start "Test integration" --epic testing
# Verify GitHub issue creation, Slack notification, etc.
```

### Integration Checklist

- [ ] GitHub CLI installed and authenticated
- [ ] CCPM initialized in project
- [ ] GitHub Actions workflows configured
- [ ] Slack webhooks configured
- [ ] Email notifications set up
- [ ] Monitoring dashboards created
- [ ] Custom integrations developed
- [ ] Security measures implemented
- [ ] Integration tests passing

## 🚨 Troubleshooting Integrations

### Common Issues

#### GitHub Authentication Problems
```bash
# Check authentication status
gh auth status

# Re-authenticate if needed
gh auth login

# Verify repository access
gh repo view
```

#### API Connection Issues
```bash
# Test API connectivity
curl http://localhost:8000/status

# Check CCPM service status
ccpm status

# Verify configuration
ccpm config list
```

#### Webhook Failures
```bash
# Check webhook logs
tail -f /var/log/ccpm-webhooks.log

# Test webhook endpoint
curl -X POST http://localhost:8000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🎯 Next Steps

After setting up integrations:

1. **Monitor**: Watch integration logs and metrics
2. **Optimize**: Improve integration performance and reliability
3. **Extend**: Add more integrations as needed
4. **Automate**: Create more automated workflows
5. **Scale**: Apply integrations to larger teams and projects

---

For more information, see the [Workflow Guide](workflow.md) and [Troubleshooting Guide](troubleshooting.md).
