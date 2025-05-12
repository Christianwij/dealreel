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

// Enable CORS - allow all origins during development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Configure multer for file uploads with error handling
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const uploadDir = path.join(__dirname, 'uploads');
      // Ensure directory exists
      await fs.ensureDir(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Sanitize filename
    const sanitizedName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, sanitizedName);
  }
});

// Create a more robust upload middleware with better error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
}).single('file');

// Create required directories on startup
(async () => {
  try {
    const dirs = [
      path.join(__dirname, 'uploads'),
      path.join(__dirname, 'public')
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(dir);
      console.log(`Ensured directory exists: ${dir}`);
    }
    
    // Check for sample.mp4
    const samplePath = path.join(__dirname, 'public', 'sample.mp4');
    const exists = await fs.pathExists(samplePath);
    console.log(`Sample video exists: ${exists ? 'Yes' : 'No'} (${samplePath})`);
    
  } catch (err) {
    console.error('Error creating directories:', err);
  }
})();

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

// Wrap upload middleware in a custom error handler
app.post('/api/upload', function(req, res, next) {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: `Upload error: ${err.message}`,
        code: 'MULTER_ERROR',
        field: err.field
      });
    } else if (err) {
      // Unknown error occurred
      console.error('Upload error:', err);
      return res.status(400).json({ 
        error: `Upload error: ${err.message}`,
        code: 'UPLOAD_ERROR'
      });
    }
    
    // If everything went fine, continue
    next();
  });
}, async (req, res) => {
  const startTime = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.log('UPLOAD DEBUG request headers:', req.headers);
  console.log('UPLOAD DEBUG req.file:', req.file);
  console.log('UPLOAD DEBUG req.body:', req.body);
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded or file was rejected',
        requestId,
        code: 'NO_FILE'
      });
    }
    
    // Ensure directories exist
    const uploadsDir = path.join(__dirname, 'uploads');
    const publicDir = path.join(__dirname, 'public');
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(publicDir);
    
    // Generate video filename
    const videoFilename = `${requestId}.mp4`;
    const videoPath = path.join(publicDir, 'sample.mp4');
    const destPath = path.join(uploadsDir, videoFilename);
    
    // Debug info about paths
    console.log('Debug paths:');
    console.log('- videoPath:', videoPath);
    console.log('- destPath:', destPath);
    console.log('- publicDir:', publicDir);
    console.log('- uploadsDir:', uploadsDir);
    
    // Check if sample video exists
    const sampleExists = await fs.pathExists(videoPath);
    console.log('Sample video exists:', sampleExists);
    
    if (!sampleExists) {
      throw new Error(`Placeholder video not found at: ${videoPath}`);
    }
    
    // Copy video file
    await fs.copy(videoPath, destPath);
    
    // Double-check file existence
    const destExists = await fs.pathExists(destPath);
    console.log('Destination video exists:', destExists);
    
    if (!destExists) {
      throw new Error(`Failed to copy video file to: ${destPath}`);
    }
    
    // Return video URL
    console.log('Success! Returning video URL:', `/video/${videoFilename}`);
    
    return res.json({
      videoUrl: `/video/${videoFilename}`,
      requestId,
      processingTime: Date.now() - startTime
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      requestId,
      processingTime: Date.now() - startTime
    });
  }
});

// Serve video files with correct content type
app.use('/video', (req, res, next) => {
  res.set('Content-Type', 'video/mp4');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Serve public files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    stack: err.stack
  });
});

app.listen(port, () => {
  console.log(`DealReel backend running on port ${port}`);
}); 