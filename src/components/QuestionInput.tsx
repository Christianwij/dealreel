import React from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send, Mic } from '@mui/icons-material';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (question: string) => void;
  onVoiceInput?: () => Promise<void>;
  isListening?: boolean;
  isLoading?: boolean;
}

export const QuestionInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  onVoiceInput,
  isListening = false,
  isLoading = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      display="flex"
      gap={1}
    >
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask a question..."
        disabled={isLoading || isListening}
        InputProps={{
          endAdornment: isLoading && (
            <CircularProgress size={20} />
          ),
        }}
      />
      
      <IconButton
        type="submit"
        disabled={!value.trim() || isLoading || isListening}
        color="primary"
      >
        <Send />
      </IconButton>

      {onVoiceInput && (
        <IconButton
          onClick={() => onVoiceInput()}
          disabled={isLoading}
          color={isListening ? 'error' : 'primary'}
        >
          <Mic />
        </IconButton>
      )}
    </Box>
  );
}; 