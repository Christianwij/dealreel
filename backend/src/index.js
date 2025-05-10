import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDocument } from 'pdfjs-dist';
import OpenAI from 'openai';
import dotenv from 'dotenv';

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

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the uploaded PDF file
    const dataBuffer = fs.readFileSync(req.file.path);
    
    // Parse the PDF and extract text
    const text = await extractTextFromPDF(dataBuffer);
    
    // Extract headers from the text
    const headers = extractHeaders(text);

    res.json({
      message: 'File uploaded and parsed successfully',
      filename: req.file.filename,
      headers: headers
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 