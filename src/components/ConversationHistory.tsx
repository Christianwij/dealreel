import React from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography, Divider } from '@mui/material';
import { Delete, ContentCopy } from '@mui/icons-material';
import type { QAHistoryItem } from '../types/qa';

interface Props {
  history: QAHistoryItem[];
  onDelete: (id: string) => void;
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
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No conversation history yet
        </Typography>
      </Box>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <List>
      {history.map((item, index) => (
        <React.Fragment key={item.id}>
          <ListItem
            alignItems="flex-start"
            onClick={() => onSelect?.(item)}
            sx={{ cursor: onSelect ? 'pointer' : 'default' }}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  edge="end"
                  onClick={() => copyToClipboard(item.answer)}
                  size="small"
                >
                  <ContentCopy />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => onDelete(item.id)}
                  size="small"
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" component="div">
                    {item.question}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(item.timestamp)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {item.answer}
                  </Typography>
                  {item.sources.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Sources:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {item.sources.map((source, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            sx={{
                              bgcolor: 'action.hover',
                              px: 1,
                              py: 0.25,
                              borderRadius: 1
                            }}
                          >
                            {source}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
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
          {index < history.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
}; 