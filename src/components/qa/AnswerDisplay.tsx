import React, { useState } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { ThumbUp, ThumbDown, Flag } from '@mui/icons-material';
import type { QAResponse } from '../../types/qa';

interface Props {
  answer: QAResponse | null;
  onFeedback: (type: 'like' | 'dislike' | 'report') => void;
}

const AnswerDisplay: React.FC<Props> = ({ answer, onFeedback }) => {
  if (!answer) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <Typography color="textSecondary">No answer available</Typography>
      </Box>
    );
  }

  return (
    <Box p={2} border={1} borderColor="divider" borderRadius={1}>
      <Typography variant="body1" gutterBottom>
        {answer.answer}
      </Typography>

      <Box mt={2}>
        <Typography variant="subtitle2" color="textSecondary">
          Sources:
        </Typography>
        {answer.sources.map((source, index) => (
          <Box key={index} mt={1}>
            <Chip
              label={source}
              size="small"
              variant="outlined"
            />
          </Box>
        ))}
      </Box>

      <Box mt={2} display="flex" alignItems="center" gap={2}>
        <Typography variant="body2" color="textSecondary">
          Confidence: {Math.round(answer.confidence * 100)}%
        </Typography>
        
        <Box display="flex" gap={1}>
          <IconButton
            aria-label="thumbs up"
            onClick={() => onFeedback('like')}
            size="small"
          >
            <ThumbUp fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="thumbs down"
            onClick={() => onFeedback('dislike')}
            size="small"
          >
            <ThumbDown fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="report"
            onClick={() => onFeedback('report')}
            size="small"
            color="error"
          >
            <Flag fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AnswerDisplay; 