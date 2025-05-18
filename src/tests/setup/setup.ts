import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect with React Testing Library's matchers
expect.extend(matchers);

// Mock fetch globally
beforeAll(() => {
  global.fetch = vi.fn();
  global.Request = vi.fn();
  global.Headers = vi.fn();
  global.FormData = vi.fn();
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (global.fetch) {
    vi.mocked(global.fetch).mockClear();
  }
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
}); 