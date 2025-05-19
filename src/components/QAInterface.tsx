import React, { useState, useEffect } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { QuestionInput } from './QuestionInput';
import AnswerDisplay from './qa/AnswerDisplay';
import { ConversationHistory } from './ConversationHistory';
import PerformanceMetrics from './PerformanceMetrics';
import { VoiceService } from '../services/voiceService';
import { QAService } from '../services/qaService';
import { ErrorDisplay } from './ErrorDisplay';
import type { QAResponse, QAHistoryItem, QAFeedback } from '../types/qa';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Props {
  briefingId: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`qa-tabpanel-${index}`}
      aria-labelledby={`qa-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export const QAInterface: React.FC<Props> = ({ briefingId }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        setError('Failed to load conversation history');
      }
    };

    checkVoiceSupport();
    loadHistory();
  }, [briefingId]);

  const handleQuestionSubmit = async (submittedQuestion: string) => {
    setIsLoading(true);
    setError(null);
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
      console.error('Failed to get answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to get answer. Please try again.');
      setCurrentAnswer(null);
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
      setError(error instanceof Error ? error.message : 'Failed to process voice input');
    } finally {
      setIsListening(false);
    }
  };

  const handleFeedback = async (type: 'like' | 'dislike' | 'report') => {
    if (!currentAnswer || !history.length) return;

    try {
      const feedback: QAFeedback = {
        briefingId,
        question: history[0].question,
        answer: currentAnswer.answer,
        feedback: type
      };

      await qaService.submitFeedback(feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setError('Failed to submit feedback');
    }
  };

  const handleHistoryDelete = async (id: string) => {
    try {
      setHistory(prev => prev.filter(item => item.id !== id));
      await qaService.deleteHistory(briefingId);
    } catch (error) {
      console.error('Failed to delete history item:', error);
      setError('Failed to delete history item');
    }
  };

  return (
    <Paper elevation={2}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          aria-label="QA Interface tabs"
        >
          <Tab label="Ask Questions" id="qa-tab-0" aria-controls="qa-tabpanel-0" />
          <Tab label="History" id="qa-tab-1" aria-controls="qa-tabpanel-1" />
          <Tab label="Performance" id="qa-tab-2" aria-controls="qa-tabpanel-2" />
        </Tabs>
      </Box>

      {error && (
        <Box p={2}>
          <ErrorDisplay
            message={error}
            onDismiss={() => setError(null)}
          />
        </Box>
      )}

      <TabPanel value={currentTab} index={0}>
        <QuestionInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleQuestionSubmit}
          onVoiceInput={isVoiceSupported ? handleVoiceInput : undefined}
          isListening={isListening}
          isLoading={isLoading}
        />
        {currentAnswer && (
          <Box mt={3}>
            <AnswerDisplay
              answer={currentAnswer}
              onFeedback={handleFeedback}
            />
          </Box>
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