import React, { useState, useEffect } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { QuestionInput } from './QuestionInput';
import AnswerDisplay from './qa/AnswerDisplay';
import { ConversationHistory } from './ConversationHistory';
import PerformanceMetrics from './PerformanceMetrics';
import { VoiceService } from '../services/voiceService';
import { QAService } from '../services/qaService';
import type { QAResponse, QAHistoryItem } from '../types/qa';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Props {
  briefingId: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

export const QAInterface: React.FC<Props> = ({ briefingId }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<QAResponse | null>(null);
  const [history, setHistory] = useState<QAHistoryItem[]>([]);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const qaService = new QAService();
  const voiceService = new VoiceService();

  useEffect(() => {
    const checkVoiceSupport = async () => {
      const supported = await voiceService.isSupported();
      setIsVoiceSupported(supported);
    };

    const loadHistory = async () => {
      try {
        const data = await qaService.getHistory(briefingId);
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    checkVoiceSupport();
    loadHistory();
  }, [briefingId]);

  const handleQuestionSubmit = async (submittedQuestion: string) => {
    setIsLoading(true);
    try {
      const answer = await qaService.askQuestion(briefingId, submittedQuestion);
      setCurrentAnswer(answer);
      setQuestion('');

      const historyItem: QAHistoryItem = {
        id: Date.now().toString(),
        question: submittedQuestion,
        answer: answer.answer,
        sources: answer.sources,
        confidence: answer.confidence,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyItem, ...prev]);
    } catch (error) {
      setCurrentAnswer({
        answer: '',
        sources: [],
        confidence: 0,
        error: 'Failed to get answer. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!isVoiceSupported) return;

    try {
      setIsListening(true);
      const text = await voiceService.startRecording();
      setQuestion(text);
      await handleQuestionSubmit(text);
    } catch (error) {
      console.error('Voice input error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const handleFeedback = async (type: 'like' | 'dislike' | 'report') => {
    if (!currentAnswer) return;

    try {
      await qaService.submitFeedback({
        questionId: history[0]?.id || Date.now().toString(),
        rating: type === 'like' ? 1 : type === 'dislike' ? -1 : 0,
        userId: 'anonymous',
        comment: type === 'report' ? 'Reported by user' : undefined
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleHistoryDelete = async (id: string) => {
    try {
      setHistory(prev => prev.filter(item => item.id !== id));
      // Optionally: Add API call to delete from backend
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  return (
    <Paper sx={{ width: '100%', minHeight: '600px' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Ask" />
          <Tab label="History" />
          <Tab label="Metrics" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <QuestionInput
          question={question}
          onChange={setQuestion}
          onSubmit={handleQuestionSubmit}
          onVoiceInput={handleVoiceInput}
          isLoading={isLoading}
          isVoiceSupported={isVoiceSupported}
          isListening={isListening}
        />
        {currentAnswer && (
          <AnswerDisplay
            answer={currentAnswer}
            onFeedback={handleFeedback}
          />
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <ConversationHistory
          history={history}
          onDelete={handleHistoryDelete}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <PerformanceMetrics briefingId={briefingId} />
      </TabPanel>
    </Paper>
  );
}; 