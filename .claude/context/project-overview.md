# Project Overview Context

## Application Architecture
This is a React-based task management application with the following key components:

### Frontend (React/TypeScript)
- **Framework**: React 18+ with TypeScript
- **State Management**: React Context API with useReducer
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router DOM

### Current Features
- User authentication (login/register/demo mode)
- Task management with CRUD operations
- Project organization with hierarchical structure
- Goal setting with milestone tracking
- Real-time analytics and progress visualization
- Mobile-responsive design
- Local storage with data persistence

### Key Files and Structure
```
src/
├── components/     # UI components organized by feature
│   ├── Auth/      # Authentication components
│   ├── Tasks/     # Task management components
│   ├── Projects/  # Project management components
│   ├── Goals/     # Goal management components
│   └── UI/        # Reusable UI components
├── pages/         # Main application pages
├── context/       # State management (AppContext, appReducer)
├── utils/         # Utility functions (storage, validation, auth)
├── types/         # TypeScript type definitions
└── services/      # External service integrations
```

### Data Models
- **User**: Authentication and user preferences
- **Task**: Individual tasks with priority, due dates, status
- **Project**: Project containers with progress tracking
- **Goal**: Long-term goals with milestone tracking

### Storage Strategy
- **Local Storage**: Primary data persistence
- **Namespace Isolation**: Demo mode uses separate storage namespace
- **Session Management**: Authentication state persistence
- **Data Migration**: Automatic migration for schema changes

### Development Standards
- TypeScript for type safety
- Tailwind CSS for styling consistency
- Error boundaries for graceful error handling
- Responsive design for mobile compatibility
- Accessibility compliance (WCAG guidelines)
- Demo mode compatibility for all features

## Integration Points for Claude Code PM
- **API Layer**: Future backend integration points
- **External Services**: Email reporting, GitHub integration
- **Deployment**: Vercel deployment with GitHub Actions
- **Testing**: Unit tests, integration tests, E2E tests
- **Monitoring**: Error tracking and performance monitoring

## Current Development Priorities
1. Parallel agent execution system
2. Backend API development
3. Enhanced testing infrastructure
4. Performance optimization
5. Advanced analytics features
