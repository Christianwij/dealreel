import { VoiceService } from '../voiceService';

// Mock the Web Speech API
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  addEventListener = mockAddEventListener;
  removeEventListener = mockRemoveEventListener;
  start = mockStart;
  stop = mockStop;
  abort = jest.fn();
}

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
const mockMediaStreamTrack = { stop: jest.fn() };
const mockMediaStream = { getTracks: () => [mockMediaStreamTrack] };

// Mock AudioContext
const mockAnalyser = {
  fftSize: 0,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = 128; // Set mock sound level
    }
  }),
};

const mockAudioContext = {
  createAnalyser: () => mockAnalyser,
  createMediaStreamSource: () => ({ connect: jest.fn() }),
  close: jest.fn(),
};

describe('VoiceService', () => {
  let voiceService: VoiceService;

  beforeAll(() => {
    // Mock window.SpeechRecognition
    Object.defineProperty(window, 'SpeechRecognition', {
      value: MockSpeechRecognition,
      writable: true,
    });

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    // Mock AudioContext
    Object.defineProperty(window, 'AudioContext', {
      value: jest.fn(() => mockAudioContext),
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    voiceService = new VoiceService();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(voiceService).toBeDefined();
      expect(mockAddEventListener).toHaveBeenCalledTimes(4);
      expect(mockAddEventListener).toHaveBeenCalledWith('start', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('result', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('start', () => {
    it('should start recognition and audio monitoring', async () => {
      await voiceService.start();
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(mockStart).toHaveBeenCalled();
    });

    it('should emit error if start fails', async () => {
      const error = new Error('Permission denied');
      mockGetUserMedia.mockRejectedValueOnce(error);
      
      const errorHandler = jest.fn();
      voiceService.on('error', errorHandler);
      
      await voiceService.start();
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('stop', () => {
    it('should stop recognition and cleanup resources', async () => {
      await voiceService.start();
      voiceService.stop();
      
      expect(mockStop).toHaveBeenCalled();
      expect(mockMediaStreamTrack.stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(voiceService.isActive()).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should emit start event', () => {
      const startHandler = jest.fn();
      voiceService.on('start', startHandler);
      
      // Simulate start event
      const startCallback = mockAddEventListener.mock.calls.find(call => call[0] === 'start')[1];
      startCallback();
      
      expect(startHandler).toHaveBeenCalled();
      expect(voiceService.isActive()).toBe(true);
    });

    it('should emit end event', () => {
      const endHandler = jest.fn();
      voiceService.on('end', endHandler);
      
      // Simulate end event
      const endCallback = mockAddEventListener.mock.calls.find(call => call[0] === 'end')[1];
      endCallback();
      
      expect(endHandler).toHaveBeenCalled();
      expect(voiceService.isActive()).toBe(false);
    });

    it('should emit result event with transcript', () => {
      const resultHandler = jest.fn();
      voiceService.on('result', resultHandler);
      
      // Simulate result event
      const resultCallback = mockAddEventListener.mock.calls.find(call => call[0] === 'result')[1];
      resultCallback({
        results: [{
          0: { transcript: '  test transcript  ' },
          isFinal: true,
        }],
        length: 1,
      });
      
      expect(resultHandler).toHaveBeenCalledWith('test transcript');
    });

    it('should emit error event', () => {
      const errorHandler = jest.fn();
      voiceService.on('error', errorHandler);
      
      // Simulate error event
      const errorCallback = mockAddEventListener.mock.calls.find(call => call[0] === 'error')[1];
      errorCallback({
        error: 'no-speech',
        message: 'No speech detected',
      });
      
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should emit sound level events', async () => {
      jest.useFakeTimers();
      
      const soundLevelHandler = jest.fn();
      voiceService.on('soundLevel', soundLevelHandler);
      
      await voiceService.start();
      jest.advanceTimersByTime(100);
      
      expect(soundLevelHandler).toHaveBeenCalledWith(expect.any(Number));
      
      jest.useRealTimers();
    });
  });
}); 