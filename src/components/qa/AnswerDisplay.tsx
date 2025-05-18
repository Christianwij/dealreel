import React, { useState } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { ThumbUp, ThumbDown, Flag } from '@mui/icons-material';
import type { QAResponse } from '../../types/qa';

interface Props {
  answer: QAResponse;
  onFeedback: (type: 'like' | 'dislike' | 'report') => void;
}

const AnswerDisplay: React.FC<Props> = ({ answer, onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (type: 'like' | 'dislike' | 'report') => {
    if (!feedbackGiven) {
      onFeedback(type);
      setFeedbackGiven(true);
    }
  };

  if (answer.error) {
    return (
      <Box sx={{ mt: 2, color: 'error.main' }}>
        <Typography variant="body1">{answer.error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body1">{answer.answer}</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {answer.sources.map((source, index) => (
          <Chip key={index} label={source} variant="outlined" size="small" />
        ))}
      </Box>
      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Confidence: {Math.round(answer.confidence * 100)}%
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          size="small"
          onClick={() => handleFeedback('like')}
          disabled={feedbackGiven}
          color={feedbackGiven ? 'primary' : 'default'}
        >
          <ThumbUp fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleFeedback('dislike')}
          disabled={feedbackGiven}
          color={feedbackGiven ? 'error' : 'default'}
        >
          <ThumbDown fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleFeedback('report')}
          disabled={feedbackGiven}
          color={feedbackGiven ? 'warning' : 'default'}
        >
          <Flag fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default AnswerDisplay; 