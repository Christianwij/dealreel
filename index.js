import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs-extra';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

console.log("🧠 Render is using the latest index.js (sanity check)");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Create required directories
const dirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'public')
];

await Promise.all(dirs.map(dir => fs.ensureDir(dir)));

// Local OCR using tesseract.js
async function performOCR(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng',
      {
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        user_defined_dpi: 300
      }
    );
    if (!text) {
      throw new Error('OCR did not return any text');
    }
    return text;
  } catch (err) {
    console.error('OCR error:', err);
    throw new Error('OCR failed: ' + err.message);
  }
}

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  try {
    console.log('UPLOAD DEBUG req.file:', req.file);
    console.log('UPLOAD DEBUG req.body:', req.body);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', requestId });
    }
    // Ensure directories exist
    const uploadsDir = path.join(__dirname, 'uploads');
    const publicDir = path.join(__dirname, 'public');
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(publicDir);
    // Use requestId for video filename
    const videoFilename = `${requestId}.mp4`;
    const videoPath = path.join(publicDir, 'sample.mp4');
    const destPath = path.join(uploadsDir, videoFilename);
    // Verify placeholder exists
    if (!await fs.pathExists(videoPath)) {
      throw new Error('Placeholder video not found');
    }
    // Copy video file
    await fs.copy(videoPath, destPath);
    // Double-check file existence
    if (!await fs.pathExists(destPath)) {
      throw new Error('Failed to copy video file');
    }
    // Return video URL
    return res.json({
      videoUrl: `/video/${videoFilename}`,
      requestId,
      processingTime: Date.now() - startTime
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      requestId,
      processingTime: Date.now() - startTime
    });
  }
});

// Serve videos with correct content type
app.use('/video', (req, res, next) => {
  res.set('Content-Type', 'video/mp4');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`DealReel backend running on port ${port}`);
}); 