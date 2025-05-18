import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import {
  Box,
  Container,
  Typography,
  Paper,
  Rating,
  Divider,
  Alert
} from '@mui/material';
import { format } from 'date-fns';

interface SharedSummaryProps {
  error?: string;
  content?: {
    title: string;
    rating?: number;
    comments?: string;
    summary?: string;
    summaryDate?: string;
  };
  expiresAt: string;
}

export const getServerSideProps: GetServerSideProps<SharedSummaryProps> = async ({ params }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const shareId = params?.id as string;

    const { data: share, error } = await supabase
      .from('shared_summaries')
      .select('content, expires_at')
      .eq('id', shareId)
      .single();

    if (error || !share) {
      return {
        props: {
          error: 'Summary not found or link has expired',
          expiresAt: new Date().toISOString()
        }
      };
    }

    // Check if share has expired
    if (new Date(share.expires_at) < new Date()) {
      return {
        props: {
          error: 'This share link has expired',
          expiresAt: share.expires_at
        }
      };
    }

    return {
      props: {
        content: share.content,
        expiresAt: share.expires_at
      }
    };
  } catch (error) {
    console.error('Error fetching shared summary:', error);
    return {
      props: {
        error: 'Failed to load shared summary',
        expiresAt: new Date().toISOString()
      }
    };
  }
};

export default function SharedSummary({ error, content, expiresAt }: SharedSummaryProps) {
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {content.title}
        </Typography>

        {content.rating !== undefined && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography component="span" sx={{ mr: 1 }}>
              Rating:
            </Typography>
            <Rating value={content.rating} readOnly max={10} />
            <Typography component="span" sx={{ ml: 1 }}>
              ({content.rating}/10)
            </Typography>
          </Box>
        )}

        {content.comments && (
          <>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            <Typography paragraph>{content.comments}</Typography>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {content.summary && (
          <>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
              {content.summary}
            </Typography>
            {content.summaryDate && (
              <Typography variant="caption" color="text.secondary">
                Generated on {format(new Date(content.summaryDate), 'PPP')}
              </Typography>
            )}
          </>
        )}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        This link will expire on {format(new Date(expiresAt), 'PPP')}
      </Typography>
    </Container>
  );
} 