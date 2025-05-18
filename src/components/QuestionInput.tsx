import React from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send, Mic } from '@mui/icons-material';

interface Props {
  question: string;
  onChange: (question: string) => void;
  onSubmit: (question: string) => void;
  onVoiceInput: () => void;
  isLoading: boolean;
  isVoiceSupported: boolean;
  isListening: boolean;
}

export const QuestionInput: React.FC<Props> = ({
  question,
  onChange,
  onSubmit,
  onVoiceInput,
  isLoading,
  isVoiceSupported,
  isListening
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim());
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        width: '100%',
        mt: 2
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px'
          }
        }}
      />
      
      {isVoiceSupported && (
        <IconButton
          onClick={onVoiceInput}
          disabled={isLoading}
          color={isListening ? 'primary' : 'default'}
          sx={{
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.2)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        >
          <Mic />
        </IconButton>
      )}

      <IconButton
        type="submit"
        disabled={!question.trim() || isLoading}
        color="primary"
      >
        {isLoading ? <CircularProgress size={24} /> : <Send />}
      </IconButton>
    </Box>
  );
}; 