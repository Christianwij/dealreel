import React from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography, Divider } from '@mui/material';
import { Delete, ContentCopy } from '@mui/icons-material';
import type { QAHistoryItem } from '../types/qa';

interface Props {
  history: QAHistoryItem[];
  onDelete?: (id: string) => Promise<void>;
  onSelect?: (item: QAHistoryItem) => void;
  onFeedback?: (id: string, type: 'like' | 'dislike' | 'report') => void;
}

export const ConversationHistory: React.FC<Props> = ({ 
  history, 
  onDelete,
  onSelect,
  onFeedback 
}) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (history.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography color="textSecondary">No conversation history yet</Typography>
      </Box>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <List>
      {history.map((item) => (
        <ListItem
          key={item.id}
          divider
          secondaryAction={
            onDelete && (
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => {
                  onDelete(item.id).catch(console.error);
                }}
              >
                <Delete />
              </IconButton>
            )
          }
        >
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{item.question}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatTimestamp(item.timestamp)}
                </Typography>
              </Box>
            }
            secondary={
              <Box mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {item.answer}
                </Typography>
                <Box mt={1} display="flex" gap={1}>
                  {item.sources.map((source, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      color="primary"
                      component="span"
                      sx={{
                        backgroundColor: 'primary.50',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {source}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Confidence: {Math.round(item.confidence * 100)}%
                </Typography>
                {onFeedback && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onFeedback(item.id, 'like')}
                    >
                      👍
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onFeedback(item.id, 'dislike')}
                    >
                      👎
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onFeedback(item.id, 'report')}
                    >
                      ⚠️
                    </IconButton>
                  </Box>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}; 