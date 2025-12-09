# Task Manager - Modern Productivity Application

A comprehensive task management application built with React, TypeScript, and modern web technologies. Features task management, project organization, goal setting, real-time analytics, and user authentication with a professional dark theme UI.

## 🚀 Live Demo

**[Task Manager Demo](https://tasks.informedcrew.com)**

Includes a fully functional demo mode with sample data. Click "Try Demo" in the header to explore all features.

## ✨ Key Features

### 🎯 **Task Management**
- Create, edit, and delete tasks with priority levels and due dates
- Task status tracking (Todo, In Progress, Completed)
- Filtering by project, priority, and completion status
- Search functionality across all task content

### 📊 **Project Organization**
- Hierarchical project structure with color coding
- Project progress tracking and analytics
- Task-to-project relationships with automatic progress calculation

### 🎯 **Goal Setting & Milestones**
- Long-term goal planning with target dates
- Milestone tracking with automatic and manual completion
- Milestone-to-task linking for automated progress tracking

### 📈 **Real-Time Analytics**
- Live productivity metrics and completion rates
- Weekly productivity trends and task completion patterns
- Interactive charts and progress visualization

### 🔐 **Authentication System**
- User registration, login, and session management
- Demo mode with sample data for portfolio visitors
- Protected routes and user-specific data storage
- Profile management and data export/import

### 🎨 **Modern UI/UX**
- Responsive design optimized for all devices
- Professional dark theme with customizable accent colors
- Intuitive navigation with authentication-aware routing
- Loading states and comprehensive error handling

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **State Management**: React Context API with useReducer pattern
- **Routing**: React Router DOM with protected routes
- **Storage**: Local Storage with robust data persistence
- **Testing**: Vitest, React Testing Library, @testing-library/user-event
- **Development**: ESLint, PostCSS, TypeScript ESLint

## 📦 Quick Start

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/task-manager.git
   cd task-manager
   npm install
   ```

2. **Set up environment variables** (optional, for issue reporting)
   ```bash
   # Create .env file with EmailJS credentials
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:5173`

### Build Commands
```bash
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Code quality check
```

### Testing Commands
```bash
npm test              # Run tests in watch mode (development)
npm run test:run      # Run tests once (CI/CD)
npm run test:ui       # Open visual test dashboard
npm run test:coverage # Generate coverage report
```

See [Testing Guide](src/tests/README.md) for comprehensive testing documentation.

## 🎮 Usage Guide

### Getting Started
1. **Demo Mode**: Click "Try Demo" to explore with sample data
2. **Create Account**: Register for permanent data storage
3. **Switch Modes**: Toggle between demo and authenticated modes in Settings

### Core Workflows

#### Task Management
- Navigate to **Tasks** page
- Create tasks with priority, due date, and project assignment
- Track progress and mark as complete
- Filter and search tasks by various criteria

#### Project Organization
- Go to **Projects** page to create and manage projects
- Assign tasks to projects for organization
- Monitor project progress and completion rates

#### Goal Setting
- Visit **Goals** page to create long-term goals
- Add milestones and link tasks for automated tracking
- Monitor goal completion and progress visualization

#### Analytics & Insights
- Check **Analytics** page for comprehensive insights
- Review real-time productivity metrics and trends
- Access quick analytics from Settings page

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Goals/          # Goal-related components
│   ├── Layout/         # Layout and navigation
│   ├── Projects/       # Project components
│   ├── Tasks/          # Task components
│   └── UI/             # Generic UI components (with tests)
├── context/            # React Context and state management
├── pages/              # Main application pages
├── tests/              # Test utilities and configuration
│   ├── setup.ts        # Global test setup
│   ├── test-utils.tsx  # Reusable test helpers
│   └── README.md       # Comprehensive testing guide
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

## 🧪 Testing

This project uses **Vitest** with **React Testing Library** for comprehensive testing:

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Multi-component interaction tests
- **Coverage**: 80%+ coverage target for new code
- **TDD Approach**: RED-GREEN-REFACTOR cycle

### Testing Philosophy

- ✅ Test user-visible behavior, not implementation details
- ✅ Use accessibility-first queries (getByRole, getByLabelText)
- ✅ Test edge cases and error states
- ✅ Mock external dependencies appropriately
- ✅ Write descriptive test names that explain intent

### Example Test

```typescript
it('should disable submit button when form is invalid', async () => {
  const user = userEvent.setup();
  render(<TaskForm />);
  
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByRole('button')).toBeDisabled();
});
```

For detailed testing guidelines, see [Testing Guide](src/tests/README.md).

## 🚀 Deployment

### Vercel Deployment
- Connect GitHub repository to Vercel
- Automatic deployment on push to main branch and releases
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

### CI/CD Pipeline
This project uses GitHub Actions with optimized workflows:

#### Deploy Workflow (`.github/workflows/deploy.yml`)
- **Test Job**: Runs linting and code quality checks
- **Deploy Job**: Downloads build artifacts and deploys to Vercel (depends on test success)
- **Triggers**: Pull requests to main and published releases

#### Release Workflow (`.github/workflows/release.yml`)
- **Test Job**: Runs linting and code quality checks
- **Build Job**: Builds the project and uploads artifacts (depends on test success)
- **Release Job**: Runs semantic-release for automated versioning and publishing (depends on build success)
- **Triggers**: Push to main and develop branches (excluding changelog and package-lock changes)
- **Branch Strategy**: Main branch for production releases, develop branch for alpha releases

**Benefits:**
- Faster feedback on code quality issues
- Parallel job execution for improved performance
- Build jobs only run after successful tests
- Clear separation of concerns between testing and deployment

### Automated Releases
This project uses semantic-release for automated versioning and releases following the test-automation-harness pattern. The system automatically:
- Analyzes commit messages to determine version bumps using conventional commits
- Generates changelogs and release notes from commit history
- Creates GitHub releases with proper tagging
- Supports dual-branch strategy: main for production, develop for alpha releases
- Triggers deployments on release publication

#### Commit Message Format
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New features (minor version bump)
- `fix`: Bug fixes (patch version bump)
- `docs`: Documentation changes (patch version bump)
- `style`: Code style changes (patch version bump)
- `refactor`: Code refactoring (patch version bump)
- `perf`: Performance improvements (patch version bump)
- `test`: Adding or updating tests (patch version bump)
- `build`: Build system changes (patch version bump)
- `ci`: CI/CD changes (patch version bump)
- `chore`: Maintenance tasks (patch version bump)
- `revert`: Reverting previous commits (patch version bump)

**Examples:**
```
feat: add user authentication system
fix(auth): resolve login validation issue
docs: update API documentation
feat(ui): add dark mode toggle

BREAKING CHANGE: API response format has changed
```

**Commit Template:**
This project includes a git commit message template (`.gitmessage`) that will automatically show the conventional commit format when you run `git commit` without the `-m` flag. The template is automatically configured when you clone the repository.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following established patterns
4. Submit a pull request

### Bug Reports
- Use structured bug report template
- Provide clear reproduction steps
- Include screenshots and environment details

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Contact

- **Email**: maestro7@gmail.com
- **LinkedIn**: [https://www.linkedin.com/in/qareleasemanager/](https://www.linkedin.com/in/qareleasemanager/)

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
