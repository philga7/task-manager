# Claude Code PM Configuration

## Project Overview
This is a React-based task management application with TypeScript, featuring user authentication, project organization, goal setting, and real-time analytics.

## Agent Types

### Frontend Agent
- **Specialization**: React, TypeScript, Tailwind CSS, Vite
- **Responsibilities**: UI components, state management, user experience
- **Tools**: React DevTools, TypeScript compiler, Tailwind CSS

### Backend Agent  
- **Specialization**: Python, FastAPI, database design, API development
- **Responsibilities**: API endpoints, data persistence, business logic
- **Tools**: Python, FastAPI, SQLAlchemy, Pydantic

### DevOps Agent
- **Specialization**: GitHub Actions, deployment, CI/CD, infrastructure
- **Responsibilities**: Automated testing, deployment, monitoring
- **Tools**: GitHub Actions, Vercel, Docker, testing frameworks

### Integration Agent
- **Specialization**: API integration, third-party services, data synchronization
- **Responsibilities**: External service integration, data flow management
- **Tools**: REST APIs, webhooks, data transformation

## Workflow Templates

### Feature Development
1. **Planning**: Define requirements and acceptance criteria
2. **Frontend**: Create UI components and state management
3. **Backend**: Implement API endpoints and business logic
4. **Integration**: Connect frontend and backend
5. **Testing**: Unit tests, integration tests, E2E tests
6. **Deployment**: Automated deployment and monitoring

### Bug Fix Workflow
1. **Reproduction**: Identify and reproduce the issue
2. **Root Cause**: Analyze and identify the root cause
3. **Fix Implementation**: Implement the fix
4. **Testing**: Verify the fix resolves the issue
5. **Documentation**: Update documentation if needed

## Context Sharing Rules
- All agents must share progress updates in `.claude/context/`
- Dependencies between workstreams must be documented
- API contracts must be versioned and documented
- Database schema changes require migration scripts

## Quality Standards
- All code must pass TypeScript compilation
- Frontend components must be responsive and accessible
- Backend APIs must include proper error handling
- All changes must include appropriate tests
- Documentation must be updated for user-facing changes
