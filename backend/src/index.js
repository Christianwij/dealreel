import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pdfjs from 'pdfjs-dist';
const { getDocument } = pdfjs;
import OpenAI from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';
import { exec } from 'child_process';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fetch from 'node-fetch';
import canvasPkg from 'canvas';
const { createCanvas: nodeCreateCanvas, ImageData } = canvasPkg;
import Tesseract from 'tesseract.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize ElevenLabs client
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel voice

console.log('DealReel backend running with LOCAL OCR ONLY');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
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

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Patch global ImageData for PDF.js compatibility
if (typeof global.ImageData === 'undefined') {
  global.ImageData = ImageData;
}

// Use node-canvas for createCanvas in Node.js
function getCompatibleCanvas(width, height) {
  return nodeCreateCanvas(width, height);
}

// Helper function to extract headers from text
function extractHeaders(text) {
  const lines = text.split('\n');
  const headers = lines
    .map(line => line.trim())
    .filter(line => {
      // Must be at least 2 words, mostly alpha, not all caps, not mostly numbers/symbols
      const words = line.split(/\s+/);
      const alphas = line.replace(/[^a-zA-Z]/g, '').length;
      const nums = line.replace(/[^0-9]/g, '').length;
      const symbols = line.replace(/[a-zA-Z0-9\s]/g, '').length;
      return (
        line.length > 4 &&
        words.length >= 2 &&
        alphas > nums &&
        alphas > symbols &&
        /[a-zA-Z]/.test(line) &&
        !/^([A-Z\s]+)$/.test(line) &&
        !/^\d+$/.test(line)
      );
    })
    .filter((header, index, self) => self.indexOf(header) === index);
  return headers;
}

// Helper function to extract text from PDF using pdfjs-dist
async function extractTextFromPDF(buffer) {
  // Convert Buffer to Uint8Array for pdfjs-dist compatibility
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

// Helper function to generate script for a single header
async function generateScriptForHeader(header) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional voiceover script writer. Write 2-3 concise, engaging sentences that could be used in a pitch deck voiceover. Keep the tone professional and compelling."
        },
        {
          role: "user",
          content: `Write a short voiceover script for the section titled \"${header}\". The script should be 2-3 sentences long and maintain a professional, engaging tone.`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return {
      title: header,
      text: response.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error(`Error generating script for ${header}:`, error);
    throw error;
  }
}

// Helper function to convert text to speech using ElevenLabs
async function textToSpeech(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: 'arraybuffer'
    });

    // Convert the audio buffer to base64
    const base64Audio = Buffer.from(response.data).toString('base64');
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
}

// Helper to save base64 audio to file
function saveBase64Audio(base64, filename) {
  const audioBuffer = Buffer.from(base64, 'base64');
  const audioPath = path.join(__dirname, '../../dealreel-video/public/audio', filename);
  fs.writeFileSync(audioPath, audioBuffer);
  return `/audio/${filename}`;
}

function isTextReadable(text) {
  return text.length > 50 && !/[^\x00-\x7F]+/.test(text);
}

// Helper to preprocess image buffer for OCR (grayscale, adaptive threshold)
function preprocessImageForOCR(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Grayscale and adaptive threshold (binarization)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
    // Adaptive threshold: if avg > 180, set to white, else black
    const bin = avg > 180 ? 255 : 0;
    imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = bin;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Local OCR fallback using tesseract.js
async function performOCR(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(data);
    const loadingTask = getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 4.0 }); // High-res
      const canvas = getCompatibleCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      preprocessImageForOCR(canvas);
      const imageBuffer = canvas.toBuffer('image/png');
      // Use tesseract.js for OCR with best settings
      const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        user_defined_dpi: 300
      });
      fullText += text + '\n';
    }
    if (!fullText) {
      throw new Error('Local OCR did not return any text.');
    }
    // Clean OCR output: remove lines that are too short, mostly non-alphanumeric, or excessive symbols
    const cleaned = fullText.split('\n').filter(line => {
      const alnum = line.replace(/[^a-zA-Z0-9]/g, '').length;
      const nonAlnum = line.replace(/[a-zA-Z0-9]/g, '').length;
      return line.trim().length > 2 && alnum > nonAlnum && /[a-zA-Z]/.test(line);
    }).join('\n');
    return cleaned;
  } catch (err) {
    console.error('Local OCR error:', err);
    throw new Error('OCR fallback failed: ' + (err.message || err.toString()));
  }
}

// PATCH: Make /api/upload return only a videoUrl (static placeholder for now)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  try {
    console.log(`[STEP 1: UPLOAD RECEIVED] Request ID: ${requestId}`);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', requestId });
    }
    // Simulate processing (OCR, etc.)
    // ... (real processing would go here)
    // Return a static video URL as a placeholder
    return res.json({
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      requestId,
      processingTime: Date.now() - startTime
    });
  } catch (error) {
    console.error(`[ERROR] Request ${requestId} failed:`, {
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime
    });
    res.status(500).json({
      error: error.message,
      requestId,
      processingTime: Date.now() - startTime
    });
  }
});

// Script generation endpoint
app.post('/api/generate-script', async (req, res) => {
  try {
    const { headers } = req.body;

    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ error: 'Headers array is required' });
    }

    // Generate scripts for all headers in parallel
    const scriptPromises = headers.map(header => generateScriptForHeader(header));
    const script = await Promise.all(scriptPromises);

    res.json({ script });
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Text-to-speech endpoint
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { script } = req.body;

    if (!script || !Array.isArray(script)) {
      return res.status(400).json({ error: 'Script array is required' });
    }

    // Convert each script section to speech
    const audioPromises = script.map(async (section) => {
      const audioData = await textToSpeech(section.text);
      return {
        title: section.title,
        audio: audioData
      };
    });

    const audioSections = await Promise.all(audioPromises);

    res.json({ audioSections });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Video generation endpoint
app.post('/api/generate-video', async (req, res) => {
  try {
    const { sections } = req.body; // [{title, text, audio: base64 or URL}]
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required' });
    }

    // Ensure audio dir exists
    const audioDir = path.join(__dirname, '../../dealreel-video/public/audio');
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

    // Save audio files and build JSON for Remotion
    const remotionSections = sections.map((section, i) => {
      let audioUrl = section.audio;
      if (audioUrl && audioUrl.startsWith('data:audio')) {
        // Save base64 audio
        const base64 = audioUrl.split(',')[1];
        const filename = `section${i + 1}.mp3`;
        audioUrl = saveBase64Audio(base64, filename);
      }
      return {
        title: section.title,
        text: section.text,
        audio: audioUrl
      };
    });

    // Write JSON input for Remotion
    const jsonPath = path.join(__dirname, '../../dealreel-video/input.json');
    fs.writeFileSync(jsonPath, JSON.stringify(remotionSections, null, 2));

    // Output video path
    const outputPath = path.join(__dirname, '../../dealreel-video/output.mp4');

    // Call Remotion render script
    await new Promise((resolve, reject) => {
      exec(`node render-dealreel-video.js input.json output.mp4`, { cwd: path.join(__dirname, '../../dealreel-video') }, (err, stdout, stderr) => {
        if (err) return reject(stderr || err);
        resolve(stdout);
      });
    });

    // Return video file path (could be served statically or uploaded to cloud)
    res.json({ video: '/video/output.mp4' });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve Remotion video and audio output statically
app.use('/video', express.static(path.join(__dirname, '../../dealreel-video')));
app.use('/audio', express.static(path.join(__dirname, '../../dealreel-video/public/audio')));

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
}); 