import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs-extra';
import pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

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
  path.join(__dirname, 'public'),
  path.join(__dirname, '../../dealreel-video/public/audio')
];

await Promise.all(dirs.map(dir => fs.ensureDir(dir)));

// Local OCR using tesseract.js
async function performOCR(filePath) {
  try {
    const data = await fs.readFile(filePath);
    const uint8Array = new Uint8Array(data);
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 4.0 }); // High-res for better OCR
      const { data: { text } } = await Tesseract.recognize(
        await page.render({ viewport }).promise,
        'eng',
        {
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          user_defined_dpi: 300
        }
      );
      fullText += text + '\n';
    }
    
    if (!fullText) {
      throw new Error('OCR did not return any text');
    }
    return fullText;
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
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', requestId });
    }

    // Ensure directories exist
    const uploadsDir = path.join(__dirname, 'uploads');
    const publicDir = path.join(__dirname, 'public');
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(publicDir);

    // Copy placeholder video
    const videoFilename = `${Date.now()}-${req.file.originalname}.mp4`;
    const videoPath = path.join(__dirname, 'public', 'sample.mp4');
    const destPath = path.join(uploadsDir, videoFilename);

    // Verify placeholder exists
    if (!await fs.pathExists(videoPath)) {
      throw new Error('Placeholder video not found');
    }

    // Copy video file
    await fs.copy(videoPath, destPath);

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

// Start server
app.listen(port, () => {
  console.log(`DealReel backend running on port ${port}`);
}); 