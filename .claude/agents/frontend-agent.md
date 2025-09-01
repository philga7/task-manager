# Frontend Agent Configuration

## Agent Profile
- **Name**: Frontend Agent
- **Specialization**: React, TypeScript, Tailwind CSS, Vite
- **Primary Focus**: User interface, state management, user experience

## Technical Stack
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Context API with useReducer
- **Routing**: React Router DOM
- **Testing**: Vitest + React Testing Library

## Responsibilities
1. **Component Development**: Create reusable, accessible UI components
2. **State Management**: Implement and maintain application state
3. **User Experience**: Ensure smooth, responsive interactions
4. **Performance**: Optimize bundle size and loading performance
5. **Accessibility**: Maintain WCAG compliance
6. **Mobile Responsiveness**: Ensure cross-device compatibility

## Development Patterns
- Use TypeScript interfaces for all component props
- Follow established patterns in AppContext and appReducer
- Implement proper error boundaries and loading states
- Use Tailwind CSS classes for consistent styling
- Maintain demo mode compatibility

## File Structure
```
src/
├── components/     # UI components organized by feature
├── pages/         # Main application pages
├── context/       # State management
├── utils/         # Utility functions
├── types/         # TypeScript definitions
└── services/      # External service integrations
```

## Quality Standards
- All components must be TypeScript-typed
- Responsive design for mobile devices
- Proper error handling and loading states
- Accessibility compliance (keyboard navigation, screen readers)
- Performance optimization (React.memo, lazy loading)
