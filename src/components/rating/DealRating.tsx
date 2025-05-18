import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  CircularProgress,
  Rating as MuiRating,
  Box,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useSupabase } from '@/hooks/useSupabase';
import type { DealRatingData, DealSummary } from '@/types/rating';
import { ShareDialog } from './ShareDialog';
import { ExportButton } from './ExportButton';

interface DealRatingProps {
  briefingId: string;
  onRatingSubmit?: (rating: number) => void;
  onSummaryGenerate?: (summary: string) => void;
}

export const DealRating: React.FC<DealRatingProps> = ({
  briefingId,
  onRatingSubmit,
  onSummaryGenerate
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [summary, setSummary] = useState<DealSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { supabase } = useSupabase();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    loadRatingAndSummary();
  }, [briefingId]);

  const loadRatingAndSummary = async () => {
    try {
      const { data: briefing, error: briefingError } = await supabase
        .from('briefings')
        .select('rating, comments')
        .eq('id', briefingId)
        .single();

      if (briefingError) throw briefingError;

      if (briefing?.rating) {
        setRating(briefing.rating);
      }
      if (briefing?.comments) {
        setComment(briefing.comments);
      }

      const { data: summaryData, error: summaryError } = await supabase
        .from('summaries')
        .select('*')
        .eq('briefing_id', briefingId)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        throw summaryError;
      }

      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (err) {
      setError('Failed to load rating and summary data');
      console.error('Error loading rating data:', err);
    }
  };

  const handleRatingChange = (event: React.ChangeEvent<{}>, value: number | null) => {
    setRating(value);
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.target.value);
  };

  const submitRating = async () => {
    if (rating === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const ratingData: DealRatingData = {
        rating,
        comments: comment,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('briefings')
        .update(ratingData)
        .eq('id', briefingId);

      if (updateError) throw updateError;

      setSuccessMessage('Rating saved successfully');
      onRatingSubmit?.(rating);
    } catch (err) {
      setError('Failed to save rating');
      console.error('Error submitting rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSummary = async () => {
    if (!rating) {
      setError('Please provide a rating before generating summary');
      return;
    }

    setIsGeneratingSummary(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingId,
          rating,
          comment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      setSuccessMessage('Summary generated successfully');
      onSummaryGenerate?.(data.summary);
    } catch (err) {
      setError('Failed to generate summary');
      console.error('Error generating summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleViewHistory = () => {
    // To be implemented in subtask 4
    console.log('History view functionality coming soon');
  };

  return (
    <Paper elevation={3} className="p-6 space-y-6">
      <Box className="flex justify-between items-center">
        <Typography variant="h5" component="h2" gutterBottom>
          Rate This Deal
        </Typography>
        <Box className="flex gap-2">
          <Tooltip title="Share Summary">
            <IconButton onClick={handleShare} size="small">
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <ExportButton 
            briefingId={briefingId} 
            disabled={!summary || isGeneratingSummary}
          />
          <Tooltip title="View History">
            <IconButton onClick={handleViewHistory} size="small">
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box className="space-y-4">
        <Box className="flex flex-col items-center">
          <Typography component="legend" gutterBottom>
            Your Rating
          </Typography>
          <MuiRating
            value={rating}
            onChange={handleRatingChange}
            max={10}
            size="large"
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
            icon={<StarIcon fontSize="inherit" />}
          />
          <Typography variant="body2" color="textSecondary" className="mt-2">
            {rating ? `${rating}/10` : 'Select a rating'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Comments"
          placeholder="Share your thoughts about this deal..."
          value={comment}
          onChange={handleCommentChange}
        />

        <Box className="flex gap-4 justify-center">
          <Button
            variant="contained"
            color="primary"
            onClick={submitRating}
            disabled={isSubmitting || rating === null}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save Rating'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={generateSummary}
            disabled={isGeneratingSummary || !rating}
            startIcon={isGeneratingSummary ? <CircularProgress size={20} /> : null}
          >
            {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
          </Button>
        </Box>
      </Box>

      {summary && (
        <>
          <Divider className="my-6" />
          <Box className="space-y-4">
            <Typography variant="h6" gutterBottom>
              Deal Summary
            </Typography>
            <Paper variant="outlined" className="p-4 bg-gray-50">
              {summary.content.split('\n').map((paragraph, i) => (
                <Typography key={i} paragraph>
                  {paragraph}
                </Typography>
              ))}
            </Paper>
            <Typography variant="caption" color="textSecondary">
              Generated on: {new Date(summary.created_at).toLocaleString()}
            </Typography>
          </Box>
        </>
      )}

      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccessMessage(null);
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          variant="filled"
          onClose={() => {
            setError(null);
            setSuccessMessage(null);
          }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        briefingId={briefingId}
      />
    </Paper>
  );
}; 