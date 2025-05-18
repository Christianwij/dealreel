import React from 'react';
import { Paper, Typography, Divider, IconButton, Tooltip } from '@mui/material';
import { Delete, ContentCopy } from '@mui/icons-material';
import { AnswerDisplay } from './AnswerDisplay';

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

interface ConversationHistoryProps {
  questions: Question[];
  onDelete: (questionId: string) => void;
  onCopy: (text: string) => void;
  onFeedback: (questionId: string, type: 'like' | 'dislike' | 'report') => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  questions,
  onDelete,
  onCopy,
  onFeedback,
}) => {
  return (
    <div className="space-y-6">
      {questions.length === 0 ? (
        <Paper className="p-4">
          <Typography variant="body2" color="textSecondary" align="center">
            No questions asked yet. Start by asking a question about the deal!
          </Typography>
        </Paper>
      ) : (
        questions.map((question) => (
          <Paper key={question.id} className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Typography variant="subtitle1" className="font-medium">
                  {question.text}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(question.timestamp).toLocaleString()}
                </Typography>
              </div>
              <div className="flex gap-2">
                <Tooltip title="Copy question">
                  <IconButton
                    size="small"
                    onClick={() => onCopy(question.text)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete question">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(question.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            <Divider />

            <AnswerDisplay
              answer={question.answer}
              onFeedback={(type) => onFeedback(question.id, type)}
            />
          </Paper>
        ))
      )}
    </div>
  );
}; 