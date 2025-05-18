import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Alert,
  Snackbar
} from '@mui/material';
import { exportSummary } from '../../services/exportService';

export interface ExportButtonProps {
  briefingId: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ briefingId, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [content, setContent] = useState({
    rating: true,
    feedback: true,
    history: true
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormat(event.target.value);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContent({
      ...content,
      [event.target.name]: event.target.checked
    });
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      await exportSummary({
        briefingId,
        format,
        includeRating: content.rating,
        includeFeedback: content.feedback,
        includeHistory: content.history
      });

      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isExportDisabled = !Object.values(content).some(Boolean) || loading;

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        disabled={disabled}
      >
        Export
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Export Deal Summary</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              value={format}
              onChange={handleFormatChange}
            >
              <FormControlLabel
                value="pdf"
                control={<Radio />}
                label="PDF Document"
              />
              <FormControlLabel
                value="docx"
                control={<Radio />}
                label="Word Document"
              />
              <FormControlLabel
                value="xlsx"
                control={<Radio />}
                label="Excel Spreadsheet"
              />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={content.rating}
                    onChange={handleContentChange}
                    name="rating"
                  />
                }
                label="Rating"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={content.feedback}
                    onChange={handleContentChange}
                    name="feedback"
                  />
                }
                label="Feedback"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={content.history}
                    onChange={handleContentChange}
                    name="history"
                  />
                }
                label="Question History"
              />
            </FormGroup>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleExport}
            disabled={isExportDisabled}
            variant="contained"
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}; 