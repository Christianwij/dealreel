import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock setImmediate
(global as any).setImmediate = (callback: Function) => setTimeout(callback, 0);

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

// Mock OpenAI
jest.mock('openai', () => {
  return {
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
  };
});

// Mock string-similarity
jest.mock('string-similarity', () => ({
  compareTwoStrings: jest.fn().mockReturnValue(0.8),
  findBestMatch: jest.fn().mockReturnValue({
    bestMatch: { target: 'mock match', rating: 0.8 },
    ratings: [{ target: 'mock match', rating: 0.8 }],
  }),
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.prototype.observe = jest.fn();
mockIntersectionObserver.prototype.unobserve = jest.fn();
mockIntersectionObserver.prototype.disconnect = jest.fn();
mockIntersectionObserver.prototype.takeRecords = jest.fn();
Object.defineProperty(mockIntersectionObserver.prototype, 'root', { value: null });
Object.defineProperty(mockIntersectionObserver.prototype, 'rootMargin', { value: '0px' });
Object.defineProperty(mockIntersectionObserver.prototype, 'thresholds', { value: [0] });

window.IntersectionObserver = mockIntersectionObserver;

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
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
});

afterAll(() => {
  console.error = originalError;
}); 