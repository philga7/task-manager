# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

# [1.1.0](https://github.com/philga7/task-manager/compare/v1.0.2...v1.1.0) (2025-08-20)


### Features

* **troubleshooting:** add EmailJS-powered issue reporting system with environment variable configuration ([#29](https://github.com/philga7/task-manager/issues/29)) ([305aad6](https://github.com/philga7/task-manager/commit/305aad60c6d2d48aaa3105f3dd3a67194e15de2c))

## [1.0.2](https://github.com/philga7/task-manager/compare/v1.0.1...v1.0.2) (2025-08-20)

## [1.0.1](https://github.com/philga7/task-manager/compare/v1.0.0...v1.0.1) (2025-08-19)

# 1.0.0 (2025-08-19)


### Bug Fixes

* clear demo storage data to prevent privacy leaks ([#12](https://github.com/philga7/task-manager/issues/12)) ([a89abc7](https://github.com/philga7/task-manager/commit/a89abc79f6d6bc113e52a3ed57ed02b2248051cd))
* **demodata:** implement complete demo mode data isolation ([#20](https://github.com/philga7/task-manager/issues/20)) ([729981b](https://github.com/philga7/task-manager/commit/729981b7fa1d780b34031e4fc51d89f701d377e3))
* **refresh:** implement authentication state persistence on page refresh ([#19](https://github.com/philga7/task-manager/issues/19)) ([822b57e](https://github.com/philga7/task-manager/commit/822b57ef3f33e7cf75e055eee2eb492f03710041))
* resolve iOS authentication issues and clean up debug UI ([#14](https://github.com/philga7/task-manager/issues/14)) ([c158928](https://github.com/philga7/task-manager/commit/c158928665edd23b6aba9d85ccf132db7f4f5001))
* resolve production date handling errors in analytics calculations ([#9](https://github.com/philga7/task-manager/issues/9)) ([d589e86](https://github.com/philga7/task-manager/commit/d589e863d55ef7b6fe731850e6c8979f73c0f8fe))
* resolve storage corruption causing iOS authentication failures ([#15](https://github.com/philga7/task-manager/issues/15)) ([003c13e](https://github.com/philga7/task-manager/commit/003c13edfff168b538b56b269d4fab0cfd90613c))
* **settings:** remove SettingsWrapper redirect logic to allow Settings page access ([#17](https://github.com/philga7/task-manager/issues/17)) ([883e68a](https://github.com/philga7/task-manager/commit/883e68aff89f52eb51822ec61029a2d470607f4f))
* **task:** resolve TaskForm dueDate TypeError with safe date formatting ([#18](https://github.com/philga7/task-manager/issues/18)) ([6c89ce5](https://github.com/philga7/task-manager/commit/6c89ce511bb373d1e2e9e97d63f81dd9c60d54da))


### Features

* add deployment infrastructure with GitHub Actions and Vercel ([#3](https://github.com/philga7/task-manager/issues/3)) ([0ae270d](https://github.com/philga7/task-manager/commit/0ae270dbf6e40f7b3e9202ec766492a7990d4666))
* add GitHub Issues template for structured bug reporting ([#5](https://github.com/philga7/task-manager/issues/5)) ([0e82528](https://github.com/philga7/task-manager/commit/0e82528480d0f3593542e4cded2318eec5df915d))
* enhance task manager with UI components and goal milestone linking ([#2](https://github.com/philga7/task-manager/issues/2)) ([1aa74d7](https://github.com/philga7/task-manager/commit/1aa74d77043722cbe946e984e0b38c995d2f4b76))
* implement authentication system with demo mode and comprehensiv… ([#4](https://github.com/philga7/task-manager/issues/4)) ([87c358f](https://github.com/philga7/task-manager/commit/87c358f9ed0edaf4a61bf96e11038c78111de4f2))
* implement automated GitHub releases with semantic versioning ([#22](https://github.com/philga7/task-manager/issues/22)) ([09fdc45](https://github.com/philga7/task-manager/commit/09fdc453660ff7eb716d1e34aa8978a82938b1bc))
* implement comprehensive authentication system ([#6](https://github.com/philga7/task-manager/issues/6)) ([8503f24](https://github.com/philga7/task-manager/commit/8503f245fa4b1fda62d52a0dcfcaa89963e67fc3))
* implement comprehensive authentication system with protected routes and improved UX ([#7](https://github.com/philga7/task-manager/issues/7)) ([593dfd5](https://github.com/philga7/task-manager/commit/593dfd5722efafe0f1b1ee4f8216d573933845ba))
* implement comprehensive MVP fixes and improvements ([#13](https://github.com/philga7/task-manager/issues/13)) ([0384167](https://github.com/philga7/task-manager/commit/03841676742160499c30bcd76cc1c01ddfdaa348))
* implement mobile browser authentication and storage compatibility ([#11](https://github.com/philga7/task-manager/issues/11)) ([95271b1](https://github.com/philga7/task-manager/commit/95271b19fe1b4c22590f6568f476312335881fc0))
* implement persistent storage with context refactor ([#1](https://github.com/philga7/task-manager/issues/1)) ([31cb426](https://github.com/philga7/task-manager/commit/31cb426008af9ad6034e98ae9b50f6484ad4f3bb))
* implement real-time productivity analytics across all pages ([#8](https://github.com/philga7/task-manager/issues/8)) ([623985b](https://github.com/philga7/task-manager/commit/623985b41e6b1293408a607cd4e607df41d30ce2))
* redirect authenticated users to Dashboard instead of Settings ([#16](https://github.com/philga7/task-manager/issues/16)) ([9bbd725](https://github.com/philga7/task-manager/commit/9bbd7251de76eeb001be8ca1f4e4f8f120181693))

## [1.0.0] - 2025-01-19

### Added
- Initial release of Task Manager application
- User authentication system with demo mode
- Task management with priority levels and due dates
- Project organization with hierarchical structure
- Goal setting and milestone tracking
- Real-time analytics and productivity metrics
- Modern responsive UI with dark theme
- Local storage data persistence
- Protected routes and user-specific data
- Comprehensive error handling and loading states

### Technical Features
- React 18 with TypeScript
- Vite build system
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management
- ESLint and TypeScript ESLint for code quality
- Automated deployment with Vercel
- Semantic versioning and automated releases
