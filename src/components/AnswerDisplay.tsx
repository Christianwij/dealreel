import React from 'react';
import { Box, Typography, IconButton, CircularProgress, Paper } from '@mui/material';
import { ThumbUp, ThumbDown, Flag } from '@mui/icons-material';
import type { QAResponse } from '../types/qa';

interface Props {
  answer: QAResponse | null;
  onFeedback: (type: 'like' | 'dislike' | 'report') => void;
}

const AnswerDisplay: React.FC<Props> = ({ answer, onFeedback }) => {
  if (!answer) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Typography variant="body1" gutterBottom>
          {answer.answer}
        </Typography>

        <Box mt={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Sources:
          </Typography>
          {answer.sources.map((source, index) => (
            <Box key={index} display="flex" alignItems="center" mt={1}>
              <Typography variant="body2">
                {source}
              </Typography>
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
              <ThumbUp />
            </IconButton>
            <IconButton
              aria-label="thumbs down"
              onClick={() => onFeedback('dislike')}
              size="small"
            >
              <ThumbDown />
            </IconButton>
            <IconButton
              aria-label="report"
              onClick={() => onFeedback('report')}
              size="small"
              color="error"
            >
              <Flag />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default AnswerDisplay; 