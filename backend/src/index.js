import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDocument } from 'pdfjs-dist';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';
import { exec } from 'child_process';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import vision from '@google-cloud/vision';
import fetch from 'node-fetch';

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

// Set this to your deployed microservice URL after deploying to Render
const PDF_RENDER_MICROSERVICE_URL = process.env.PDF_RENDER_MICROSERVICE_URL || 'https://pdf-render-service-1.onrender.com/render';

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

// Helper function to extract headers from text
function extractHeaders(text) {
  // Split text into lines and filter for potential headers
  const lines = text.split('\n');
  const headers = lines
    .map(line => line.trim())
    .filter(line => {
      // Look for lines that:
      // 1. Are not empty
      // 2. Are relatively short (less than 50 chars)
      // 3. Are all uppercase
      // 4. Don't contain common non-header words
      const isShort = line.length < 50;
      const isUpperCase = line === line.toUpperCase();
      const isNotEmpty = line.length > 0;
      const isNotCommonWord = !['PAGE', 'OF', 'THE', 'AND', 'FOR'].includes(line);
      
      return isShort && isUpperCase && isNotEmpty && isNotCommonWord;
    })
    // Remove duplicates while preserving order
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

async function pdfToImagesWithMicroservice(filePath) {
  // Send the PDF to a Puppeteer-based microservice for rendering
  // The microservice should accept a PDF and return an array of image buffers (one per page)
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  const response = await fetch('https://YOUR_PDF_RENDER_MICROSERVICE_URL/render', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error('Failed to render PDF to images via microservice');
  }
  const images = await response.json(); // Expecting an array of base64-encoded images
  return images.map(img => Buffer.from(img, 'base64'));
}

async function performOCR(filePath) {
  // Google Cloud Vision OCR fallback for image-based PDFs using Puppeteer microservice
  try {
    const client = new vision.ImageAnnotatorClient();
    const images = await pdfToImagesWithMicroservice(filePath);
    if (!images.length) {
      throw new Error('PDF-to-image rendering microservice did not return any images.');
    }
    let fullText = '';
    for (const imageBuffer of images) {
      const [result] = await client.documentTextDetection({ image: { content: imageBuffer } });
      const pageText = result.fullTextAnnotation ? result.fullTextAnnotation.text : '';
      fullText += pageText + '\n';
    }
    if (!fullText) {
      throw new Error('Google Vision OCR did not return any text.');
    }
    return fullText;
  } catch (err) {
    console.error('Google Vision OCR error:', err);
    throw new Error('OCR fallback failed: ' + err.message);
  }
}

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the uploaded PDF file
    const dataBuffer = fs.readFileSync(req.file.path);
    
    // Parse the PDF and extract text
    let text = await extractTextFromPDF(dataBuffer);
    if (!isTextReadable(text)) {
      console.log('Text unreadable, performing OCR...');
      text = await performOCR(req.file.path);
    }
    
    // Extract headers from the text
    const headers = extractHeaders(text);

    let summary = null;
    if (headers.length === 0) {
      // If no headers, generate a summary using OpenAI
      try {
        const summaryResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes business documents."
            },
            {
              role: "user",
              content: `Summarize the following PDF content in 3-5 sentences for a business audience.\n\n${text.substring(0, 4000)}` // limit to 4000 chars for token safety
            }
          ],
          temperature: 0.5,
          max_tokens: 300
        });
        summary = summaryResponse.choices[0].message.content.trim();
      } catch (err) {
        summary = 'Could not generate summary.';
      }
    }

    res.json({
      message: 'File uploaded and parsed successfully',
      filename: req.file.filename,
      headers: headers,
      text: text,
      summary: summary
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: error.message });
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

app.get('/api/version', (req, res) => {
  res.send({ url: PDF_RENDER_MICROSERVICE_URL });
});

app.get('/api/debug', (req, res) => {
  res.send({
    env_var: process.env.PDF_RENDER_MICROSERVICE_URL,
    used_url_in_code: PDF_RENDER_MICROSERVICE_URL
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
}); 