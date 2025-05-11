import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs-extra';
import pdfjs from 'pdfjs-dist';

console.log('DealReel backend running with LOCAL OCR ONLY');

// Create uploads directory if it doesn't exist
await fs.ensureDir('uploads');

// Local OCR fallback using tesseract.js
async function performOCR(filePath) {
  try {
    const data = await fs.readFile(filePath);
    const uint8Array = new Uint8Array(data);
    const loadingTask = getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const imageBuffer = canvas.toBuffer('image/png');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageBuffer);
      await worker.terminate();
      fullText += text + '\n';
    }
    if (!fullText) {
      throw new Error('Local OCR did not return any text.');
    }
    return fullText;
  } catch (err) {
    console.error('Local OCR error:', err);
    throw new Error('OCR fallback failed: ' + err.message);
  }
}

// Helper to save base64 audio to file
async function saveBase64Audio(base64, filename) {
  const audioBuffer = Buffer.from(base64, 'base64');
  const audioPath = path.join(__dirname, '../../dealreel-video/public/audio', filename);
  await fs.ensureDir(path.dirname(audioPath));
  await fs.writeFile(audioPath, audioBuffer);
  return `/audio/${filename}`;
}

// Video generation endpoint
app.post('/api/generate-video', async (req, res) => {
  try {
    const { sections } = req.body;
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required' });
    }

    // Ensure audio dir exists
    const audioDir = path.join(__dirname, '../../dealreel-video/public/audio');
    await fs.ensureDir(audioDir);

    // ... existing code ...

    // Write JSON input for Remotion
    const jsonPath = path.join(__dirname, '../../dealreel-video/input.json');
    await fs.writeFile(jsonPath, JSON.stringify(remotionSections, null, 2));

    // ... existing code ...
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH: On upload, copy a static placeholder video to uploads/{timestamp}-{originalname}.mp4 and return its URL
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', requestId });
    }

    // Ensure uploads directory exists
    await fs.ensureDir(path.join(__dirname, 'uploads'));

    // Copy static placeholder video to uploads/{timestamp}-{originalname}.mp4
    const videoFilename = `${Date.now()}-${req.file.originalname}.mp4`;
    const videoPath = path.join(__dirname, 'public', 'sample.mp4');
    const destPath = path.join(__dirname, 'uploads', videoFilename);

    // Ensure source video exists
    if (!await fs.pathExists(videoPath)) {
      throw new Error('Placeholder video not found');
    }

    // Copy the video file
    await fs.copy(videoPath, destPath);

    // Return the video URL
    return res.json({
      videoUrl: `/video/${videoFilename}`,
      requestId,
      processingTime: Date.now() - startTime
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error.message,
      requestId,
      processingTime: Date.now() - startTime
    });
  }
});

// Serve uploads directory as /video
app.use('/video', express.static(path.join(__dirname, 'uploads')));

// Ensure placeholder video exists
const placeholderVideoPath = path.join(__dirname, 'public', 'sample.mp4');
const uploadsDir = path.join(__dirname, 'uploads');
await fs.ensureDir(uploadsDir);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 