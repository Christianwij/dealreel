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

  if (answer.error) {
    return (
      <Box p={2}>
        <Typography color="error">{answer.error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Typography variant="body1" gutterBottom>
          {answer.text}
        </Typography>

        <Box mt={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Sources:
          </Typography>
          {answer.sources.map((source, index) => (
            <Box key={index} display="flex" alignItems="center" mt={1}>
              <Typography variant="body2">
                {source.text} ({Math.round(source.confidence * 100)}%)
              </Typography>
            </Box>
          ))}
        </Box>

        <Box mt={2} display="flex" gap={1}>
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

        <Typography variant="caption" color="textSecondary" display="block" mt={1}>
          {new Date(answer.timestamp).toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AnswerDisplay; 