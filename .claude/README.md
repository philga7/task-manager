# Claude Code PM Setup Documentation

## Overview
This directory contains the Claude Code PM (Project Management) system configuration for parallel agent execution in the task manager project.

## Directory Structure
```
.claude/
├── agents/           # Agent-specific configurations
│   ├── frontend-agent.md
│   └── backend-agent.md
├── context/          # Shared context and project information
│   └── project-overview.md
├── epics/            # Epic definitions and workstreams
│   └── sample-parallel-feature.md
├── workflows/        # Workflow templates
│   └── feature-development.md
├── templates/        # Reusable templates
│   └── progress-report.md
└── README.md         # This file
```

## Agent Types

### Frontend Agent
- **Specialization**: React, TypeScript, Tailwind CSS, Vite
- **Responsibilities**: UI components, state management, user experience
- **Configuration**: `.claude/agents/frontend-agent.md`

### Backend Agent
- **Specialization**: Python, FastAPI, database design, API development
- **Responsibilities**: API endpoints, data persistence, business logic
- **Configuration**: `.claude/agents/backend-agent.md`

### DevOps Agent
- **Specialization**: GitHub Actions, deployment, CI/CD, infrastructure
- **Responsibilities**: Automated testing, deployment, monitoring
- **Configuration**: Defined in main `CLAUDE.md`

### Integration Agent
- **Specialization**: API integration, third-party services, data synchronization
- **Responsibilities**: External service integration, data flow management
- **Configuration**: Defined in main `CLAUDE.md`

## Workflow Templates

### Feature Development Workflow
- **File**: `.claude/workflows/feature-development.md`
- **Purpose**: Coordinate multiple agents for feature development
- **Phases**: Planning, Parallel Development, Integration, Testing, Deployment

### Progress Reporting
- **Template**: `.claude/templates/progress-report.md`
- **Purpose**: Standardized progress updates from agents
- **Frequency**: Daily updates recommended

## Usage Guidelines

### For Agents
1. **Read Configuration**: Review your agent-specific configuration file
2. **Follow Workflows**: Use established workflow templates
3. **Share Progress**: Use progress report templates for updates
4. **Coordinate**: Communicate dependencies and blockers
5. **Document**: Update context files with decisions and progress

### For Project Managers
1. **Create Epics**: Define epics in `.claude/epics/`
2. **Assign Agents**: Specify agent responsibilities and dependencies
3. **Monitor Progress**: Review progress reports in `.claude/context/`
4. **Facilitate Communication**: Ensure agents can coordinate effectively
5. **Track Quality**: Monitor adherence to quality standards

### For Developers
1. **Understand Context**: Read project overview and agent configurations
2. **Follow Patterns**: Use established development patterns
3. **Maintain Quality**: Adhere to quality standards and testing requirements
4. **Update Documentation**: Keep context files current
5. **Coordinate**: Communicate with other agents when needed

## Communication Protocol

### Daily Updates
- Agents post progress reports using the template
- Include blockers, dependencies, and next steps
- Update context files with key decisions

### Integration Checkpoints
- Scheduled sync points for integration testing
- Demo sessions to showcase progress
- Architecture review and decision making

### Blocker Resolution
- Immediate notification when blocked
- Clear description of what's needed
- Escalation to project manager if needed

## Quality Standards

### Code Quality
- TypeScript compilation passes
- ESLint rules followed
- Proper error handling implemented
- Responsive design maintained

### Testing Requirements
- Unit tests for all new functionality
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for critical paths

### Documentation
- Code comments for complex logic
- API documentation for endpoints
- User documentation for features
- Architecture decisions documented

## Getting Started

### For New Agents
1. Read the main `CLAUDE.md` configuration
2. Review your agent-specific configuration
3. Understand the project overview in `.claude/context/`
4. Follow established workflow templates
5. Start with a simple epic to learn the process

### For New Epics
1. Create epic definition in `.claude/epics/`
2. Define agent assignments and dependencies
3. Set clear success criteria and timeline
4. Establish communication plan
5. Begin execution following workflow templates

## Troubleshooting

### Common Issues
- **Blocked Dependencies**: Use immediate notification protocol
- **Integration Problems**: Schedule integration checkpoints
- **Quality Issues**: Review quality standards and testing
- **Communication Gaps**: Use progress report templates

### Escalation Path
1. Agent-to-agent communication
2. Project manager involvement
3. Architecture review
4. Process improvement

## Future Enhancements
- Automated progress tracking
- Real-time collaboration tools
- Advanced analytics for agent performance
- Integration with external project management tools
