import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import 'jest-canvas-mock';
import { TextEncoder, TextDecoder } from 'util';

// Mock Material-UI components
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  const styledEngine = jest.requireActual('@mui/styled-engine');
  
  return {
    ...actual,
    styled: styledEngine.default,
    useTheme: () => ({
      palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
      },
      typography: {
        fontFamily: 'Roboto',
      },
    }),
  };
});

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  Delete: () => 'DeleteIcon',
  ContentCopy: () => 'ContentCopyIcon',
  ThumbUp: () => 'ThumbUpIcon',
  ThumbDown: () => 'ThumbDownIcon',
  Report: () => 'ReportIcon',
}));

// Mock styled-components
jest.mock('styled-components', () => ({
  ...jest.requireActual('styled-components'),
  createGlobalStyle: jest.fn(() => () => null),
  css: jest.fn((...args) => JSON.stringify(args)),
  keyframes: jest.fn(() => 'keyframes'),
}));

// Mock Redis
jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    zadd: jest.fn(),
    zremrangebyscore: jest.fn(),
    zrangebyscore: jest.fn(),
    zcard: jest.fn(),
    lrange: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
    llen: jest.fn()
  }));
  return { Redis: RedisMock };
});

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked OpenAI response'
            }
          }]
        })
      }
    }
  }))
}));

// Mock environment variables
process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'test-openai-key';
process.env.NEXT_PUBLIC_REDIS_URL = 'redis://localhost:6379';
process.env.NEXT_PUBLIC_REDIS_PASSWORD = 'test-redis-password';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-supabase-key';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock setImmediate
global.setImmediate = (callback) => setTimeout(callback, 0);

// Mock Web Speech API
const mockSpeechRecognition = {
  continuous: true,
  interimResults: true,
  lang: 'en-US',
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null,
};

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition)
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition)
});

// Mock AudioContext
class MockAnalyserNode {
  frequencyBinCount = 1024;
  getByteFrequencyData = jest.fn();
  disconnect = jest.fn();
}

class MockAudioContext {
  createAnalyser = jest.fn().mockReturnValue(new MockAnalyserNode());
  createMediaStreamSource = jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
  });
  close = jest.fn();
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }]
    })
  }
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
  }),
}));

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Suppress console errors during tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: React.createFactory()') ||
      args[0].includes('Warning: componentWillReceiveProps'))
  ) {
    return;
  }
  originalError.call(console, ...args);
}; 