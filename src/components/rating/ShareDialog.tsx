import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { ShareOptions } from '@/types/rating';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  briefingId: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  briefingId
}) => {
  const [options, setOptions] = useState<ShareOptions>({
    includeRating: true,
    includeComments: true,
    includeSummary: true,
    expiresIn: 24 // Default 24 hours
  });

  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    setError(null);
    setShareUrl('');
    setCopied(false);

    try {
      const response = await fetch('/api/share-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingId,
          options
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (err) {
      setError('Failed to create share link. Please try again.');
      console.error('Error sharing summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Summary</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Choose what information to include in the shared summary:
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeRating}
                onChange={(e) => setOptions({ ...options, includeRating: e.target.checked })}
              />
            }
            label="Include Rating"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeComments}
                onChange={(e) => setOptions({ ...options, includeComments: e.target.checked })}
              />
            }
            label="Include Comments"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeSummary}
                onChange={(e) => setOptions({ ...options, includeSummary: e.target.checked })}
              />
            }
            label="Include Summary"
          />
        </Box>

        <TextField
          fullWidth
          type="number"
          label="Link expires in (hours)"
          value={options.expiresIn}
          onChange={(e) => setOptions({ ...options, expiresIn: parseInt(e.target.value) || 24 })}
          inputProps={{ min: 1, max: 168 }} // Max 1 week
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {shareUrl && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Share Link:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {shareUrl}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton size="small" onClick={handleCopy}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={isLoading || (!options.includeRating && !options.includeComments && !options.includeSummary)}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Creating Link...' : 'Create Share Link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 