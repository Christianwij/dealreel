# Testing Guide

## Overview
This document outlines the testing strategy and procedures for the DealReel3 application.

## Test Types

### 1. Frontend Unit Tests (Jest + React Testing Library)
- Located in `src/components/__tests__` and `src/pages/__tests__`
- Run with `npm test`
- Coverage reports in `coverage/`

#### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### 2. Backend Unit Tests (Pytest)
- Located in `backend/tests`
- Run with `pytest`
- Coverage reports in `backend/htmlcov/`

#### Running Tests
```bash
# Run all tests
cd backend
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_document_qa.py
```

### 3. Integration Tests (Cypress)
- Located in `cypress/e2e`
- Test end-to-end user flows

#### Running Tests
```bash
# Open Cypress Test Runner
npm run cypress:open

# Run tests headlessly
npm run cypress:run
```

## Test Environment Setup

### Frontend
1. Install dependencies:
```bash
npm install
```

2. Set up test environment variables:
```bash
cp .env.test.example .env.test
```

### Backend
1. Install dependencies:
```bash
cd backend
pip install -r requirements-dev.txt
```

2. Set up test database:
```bash
cp .env.test.example .env.test
python scripts/setup_test_db.py
```

## Writing Tests

### Frontend Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Backend API Tests
```python
import pytest
from httpx import AsyncClient

async def test_document_upload(client: AsyncClient):
    response = await client.post("/api/documents/upload", 
        files={"file": ("test.pdf", b"test content", "application/pdf")})
    assert response.status_code == 200
```

### Integration Tests
```typescript
describe('Document QA Flow', () => {
  it('allows users to upload and query documents', () => {
    cy.login()
    cy.fixture('test.pdf').then(fileContent => {
      cy.get('[data-testid="dropzone"]').upload(fileContent, 'test.pdf')
    })
    cy.get('[data-testid="question-input"]').type('What is the main topic?')
    cy.get('[data-testid="submit-button"]').click()
    cy.get('[data-testid="answer"]').should('be.visible')
  })
})
```

## Test Data

### Test Files
- Sample files for testing are in `cypress/fixtures` and `backend/tests/fixtures`
- Include various file types (PDF, DOCX, PPTX)
- Different file sizes and content types

### Database Fixtures
- Located in `backend/tests/fixtures/data.json`
- Loaded automatically by pytest fixtures
- Contains sample users, documents, and QA pairs

## CI/CD Integration

### GitHub Actions
- Tests run automatically on pull requests
- Required checks must pass before merging
- Test results and coverage reports uploaded as artifacts

### Local Pre-commit Hooks
```bash
# Install pre-commit hooks
npm run prepare
```

## Troubleshooting

### Common Issues
1. Test Database Connection
```bash
# Verify test database
python backend/scripts/verify_test_db.py
```

2. Frontend Test Environment
```bash
# Clear Jest cache
npm test -- --clearCache
```

3. Cypress Issues
```bash
# Clear Cypress cache
npx cypress cache clear
```

## Best Practices

### Writing Tests
1. Follow AAA pattern (Arrange, Act, Assert)
2. Use meaningful test descriptions
3. Test edge cases and error conditions
4. Keep tests independent and isolated
5. Use appropriate mocks and stubs

### Test Coverage
- Maintain minimum 80% coverage for critical paths
- Focus on business logic and user flows
- Document any excluded paths

### Code Review
- Review test changes as thoroughly as implementation
- Ensure tests are readable and maintainable
- Check for appropriate test coverage

## Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Cypress Guides](https://docs.cypress.io/guides/overview/why-cypress) 