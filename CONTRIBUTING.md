# Contributing to RapidWoo Storefront

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/rapidwoo-storefront.git
   cd rapidwoo-storefront
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up Husky hooks:
   ```bash
   npm run prepare
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or fixes
- `chore/description` - Maintenance tasks

Example: `feat/add-wishlist-functionality`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run unit tests |
| `npm run test:ci` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests |
| `npm run validate` | Run all checks (lint, type-check, test) |

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Revert a previous commit |

### Examples

```bash
feat(cart): add quantity selector to cart items
fix(checkout): resolve payment processing error
docs(readme): update installation instructions
refactor(components): extract shared button logic
test(cart): add unit tests for cart store
```

## Pull Request Process

1. **Update your fork** with the latest from main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make your changes** following our code style guidelines

4. **Run all checks** before committing:
   ```bash
   npm run validate
   ```

5. **Commit your changes** using conventional commits

6. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```

7. **Open a Pull Request** using our PR template

8. **Respond to feedback** and make necessary changes

### PR Requirements

- [ ] All CI checks pass
- [ ] Code follows style guidelines
- [ ] Tests are included for new functionality
- [ ] Documentation is updated if needed
- [ ] PR description explains the changes
- [ ] Linked to relevant issue(s)

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types that may be reused

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful prop names

### File Structure

```
src/
├── components/       # React components
│   ├── Component/
│   │   ├── Component.component.tsx
│   │   ├── Component.test.tsx
│   │   └── index.ts
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
├── utils/            # Utility functions
├── types/            # TypeScript types
└── pages/            # Next.js pages
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.component.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCart.ts`)
- **Utilities**: camelCase (e.g., `formatPrice.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_ITEMS`)
- **Types/Interfaces**: PascalCase with `I` prefix for interfaces

## Testing

### Unit Tests

Write unit tests for:
- Utility functions
- Custom hooks
- Store logic
- Component behavior

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with coverage
npm run test:ci
```

### E2E Tests

Write E2E tests for:
- Critical user flows
- Checkout process
- Navigation

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Test File Naming

- Unit tests: `*.test.tsx` or `*.test.ts`
- E2E tests: `*.spec.ts` (in `/e2e` directory)

## Questions?

If you have questions, please open an issue with the `question` label.

---

Thank you for contributing! 🎉
