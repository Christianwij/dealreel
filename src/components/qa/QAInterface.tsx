import React, { useState, useEffect } from 'react';
import { Paper, Typography, CircularProgress } from '@mui/material';
import { QuestionInput } from './QuestionInput';
import { ConversationHistory } from './ConversationHistory';
import { v4 as uuidv4 } from 'uuid';

interface QAInterfaceProps {
  briefingId: string;
}

interface Question {
  id: string;
  text: string;
  timestamp: string;
  answer: {
    text: string;
    sources: Array<{
      text: string;
      page?: number;
      confidence: number;
    }>;
    timestamp: string;
  };
}

export const QAInterface: React.FC<QAInterfaceProps> = ({ briefingId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [briefingId]);

  const loadQuestions = async () => {
    try {
      const response = await fetch(`/api/qa/history?briefingId=${briefingId}`);
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleQuestionSubmit = async (questionText: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/qa/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingId,
          question: questionText,
        }),
      });

      const data = await response.json();

      const newQuestion: Question = {
        id: uuidv4(),
        text: questionText,
        timestamp: new Date().toISOString(),
        answer: {
          text: data.answer,
          sources: data.sources || [],
          timestamp: new Date().toISOString(),
        },
      };

      setQuestions((prev) => [newQuestion, ...prev]);

      // Save to database
      await fetch('/api/qa/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingId,
          question: newQuestion,
        }),
      });
    } catch (error) {
      console.error('Error submitting question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      await fetch(`/api/qa/delete?questionId=${questionId}`, { method: 'DELETE' });
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = async (questionId: string, type: 'like' | 'dislike' | 'report') => {
    try {
      await fetch('/api/qa/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          type,
        }),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Paper className="p-4">
        <Typography variant="h6" gutterBottom>
          Ask Questions
        </Typography>
        <QuestionInput onSubmit={handleQuestionSubmit} isLoading={isLoading} />
      </Paper>

      {isLoading && (
        <div className="flex justify-center">
          <CircularProgress />
        </div>
      )}

      <ConversationHistory
        questions={questions}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onFeedback={handleFeedback}
      />
    </div>
  );
}; 