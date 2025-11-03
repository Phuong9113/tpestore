// Lightweight Express server for AI chat using Google Gemini
// Loads API key from .env and exposes /api/chat and /api/chat-stream endpoints

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // Fail fast with a clear message if API key missing
  // Do not start the server without credentials
  // eslint-disable-next-line no-console
  console.error('GEMINI_API_KEY is not set. Add it to .env.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Normalize incoming history to Gemini content format
function toGeminiHistory(messages) {
  if (!Array.isArray(messages)) return [];
  // Expected input shape example:
  // [{ role: 'user'|'model', content: 'text here' }]
  return messages
    .filter((m) => m && m.content && (m.role === 'user' || m.role === 'model'))
    .map((m) => ({ role: m.role, parts: [{ text: String(m.content) }] }));
}

// POST /api/chat — single-response chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid payload: message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history: toGeminiHistory(history),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.json({ reply: text });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/chat:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Optional: streaming response using Server-Sent Events (SSE)
app.post('/api/chat-stream', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid payload: message is required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history: toGeminiHistory(history),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048,
      },
    });

    const streamResult = await chat.sendMessageStream(message);

    for await (const chunk of streamResult.stream) {
      const piece = chunk.text();
      if (piece) {
        res.write(`data: ${JSON.stringify({ delta: piece })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/chat-stream:', err);
    try {
      res.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
      res.end();
    } catch (_) {
      // ignore
    }
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI chat server listening on http://localhost:${PORT}`);
});


