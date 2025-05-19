export interface CacheStats {
  totalQuestions: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
}

export interface QASource {
  text: string;
  confidence: number;
}

export interface QAResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

export interface QAHistoryItem {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: number;
  timestamp: string;
}

export interface QAFeedback {
  briefingId: string;
  question: string;
  answer: string;
  feedback: 'like' | 'dislike' | 'report';
}

export interface QAQuestion {
  id: string;
  text: string;
  timestamp: string;
  answer: QAResponse;
}

export interface QAStats {
  hits: number;
  misses: number;
  totalQueries: number;
}

export interface QAMetrics {
  totalQuestions: number;
  averageConfidence: number;
  positiveRatings: number;
  negativeRatings: number;
}

export interface QAServiceType {
  askQuestion: (briefingId: string, question: string) => Promise<QAResponse>;
  getHistory: (briefingId: string) => Promise<Array<{ question: string; answer: string }>>;
  submitFeedback: (feedback: QAFeedback) => Promise<void>;
  getMetrics: (briefingId: string) => Promise<QAMetrics>;
}

export interface QAServiceInterface {
  askQuestion(briefingId: string, question: string, options?: { cache?: boolean }): Promise<QAResponse>;
  submitFeedback(feedbackData: QAFeedback): Promise<void>;
  getHistory(briefingId: string): Promise<QAHistoryItem[]>;
  getStats(): Promise<CacheStats>;
  getMetrics(briefingId: string): Promise<PerformanceMetrics>;
  getErrorLogs(limit?: number): Promise<string[]>;
  getCachedAnswer(question: string): Promise<QAResponse | null>;
  cacheAnswer(question: string, answer: QAResponse): Promise<void>;
}

export interface PerformanceMetrics {
  responseTime: number;
  tokenCount: number;
  cacheHitRate: number;
  errorRate: number;
  questionCount: number;
  averageResponseTime: number;
  totalQueries: number;
  lastHourQueries: number;
} 