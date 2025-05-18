# Backend Tests

This directory contains all tests for the DealReel backend services. We use pytest as our testing framework along with pytest-asyncio for async test support.

## Directory Structure

```
backend/tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests across components
├── fixtures/       # Shared test fixtures and data
├── conftest.py    # pytest configuration and shared fixtures
└── README.md      # This file
```

## Test Categories

### Unit Tests
Located in `unit/`, these tests focus on testing individual components in isolation:
- Services (QA, Auth, Document Processing)
- Models
- Utilities
- API Endpoints

### Integration Tests
Located in `integration/`, these tests verify the interaction between components:
- API endpoint flows
- Database operations
- External service integrations

## Running Tests

1. **Setup Test Environment**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\\venv\\Scripts\\activate  # Windows
   
   # Install dependencies
   pip install -r requirements-dev.txt
   ```

2. **Run All Tests**
   ```bash
   pytest
   ```

3. **Run Specific Test Categories**
   ```bash
   # Run unit tests only
   pytest backend/tests/unit/

   # Run integration tests only
   pytest backend/tests/integration/

   # Run specific test file
   pytest backend/tests/unit/test_qa_service.py
   ```

4. **Run with Coverage Report**
   ```bash
   pytest --cov=app --cov-report=html
   ```

## Writing Tests

1. **Naming Conventions**
   - Test files: `test_*.py`
   - Test classes: `Test*`
   - Test methods: `test_*`

2. **Using Fixtures**
   - Common fixtures are in `conftest.py`
   - Use `@pytest.fixture` decorator for test-specific fixtures
   - Scope fixtures appropriately (`function`, `class`, `module`, `session`)

3. **Async Testing**
   - Use `@pytest.mark.asyncio` for async tests
   - Use `async/await` syntax consistently
   - Handle cleanup in `finally` blocks

4. **Mocking**
   - Use `unittest.mock` for mocking
   - Use `@patch` decorator for dependency injection
   - Create mock fixtures for common dependencies

## Best Practices

1. **Test Organization**
   - Group related tests in classes
   - Use descriptive test names
   - Follow Arrange-Act-Assert pattern
   - Keep tests focused and atomic

2. **Database Testing**
   - Use test database (configured in `conftest.py`)
   - Clean up after tests
   - Use transactions for isolation

3. **Error Handling**
   - Test both success and error cases
   - Verify error messages and types
   - Test edge cases and boundaries

4. **Performance**
   - Keep tests fast
   - Use appropriate scopes for fixtures
   - Minimize database operations

## Continuous Integration

Tests are automatically run in the CI pipeline:
- On pull requests
- On merge to main branch
- Nightly for all branches

Test results and coverage reports are available in the CI artifacts. 