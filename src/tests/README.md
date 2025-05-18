# Testing Structure

This directory contains all tests for the DealReel application. We use Vitest as our testing framework along with React Testing Library for component testing.

## Directory Structure

```
src/tests/
├── components/       # React component tests
├── services/        # Service layer tests
├── hooks/           # Custom hooks tests
├── utils/           # Utility function tests
├── mocks/           # Shared test mocks
└── setup/           # Test setup files
```

## Testing Conventions

1. **File Naming**
   - Test files should be named `*.test.tsx` for React components
   - Test files should be named `*.test.ts` for non-React code
   - Test files should mirror the source file structure

2. **Imports**
   ```typescript
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { vi, describe, test, expect, beforeEach } from 'vitest';
   ```

3. **Mocking**
   - Use Vitest's mocking system: `vi.mock()`, `vi.fn()`
   - Place shared mocks in `src/tests/mocks/`
   - Mock external services and complex dependencies

4. **Test Structure**
   ```typescript
   describe('ComponentName', () => {
     // Setup
     beforeEach(() => {
       vi.clearAllMocks();
     });

     // Tests
     test('should render correctly', () => {
       // Arrange
       // Act
       // Assert
     });
   });
   ```

5. **Testing Practices**
   - Test component behavior, not implementation
   - Use semantic queries from React Testing Library
   - Test accessibility where applicable
   - Test error states and edge cases
   - Keep tests focused and maintainable

6. **Commands**
   - Run all tests: `npm test`
   - Run specific test: `npm test ComponentName`
   - Update snapshots: `npm test -- -u`
   - Watch mode: `npm test -- --watch`

## Coverage Requirements

- Aim for 80%+ coverage for critical paths
- Required coverage areas:
  - User interactions
  - Data fetching and mutations
  - Error handling
  - Edge cases
  - Accessibility features 