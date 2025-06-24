import 'dotenv/config';
import express from 'express';
import { connectDB } from './db.js';
import { Snippet } from './models/Snippet.js';
import { getSummary } from './ai/openai/summarize.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/snippets', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  try {
    const summary = await getSummary(text);
    const snippet = await Snippet.create({ text, summary });
    res.status(201).json({ id: snippet._id, summary: snippet.summary });
  } catch (err: any) {
    if (err?.status === 429 || err?.response?.status === 429) {
      return res.status(503).json({ error: 'AI service rate limit reached. Please try again later.' });
    }
    // Log the error for debugging
    console.error(err);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

export default app;

if (process.argv[1] === new URL(import.meta.url).pathname) {
  connectDB()
    .then(() => {
      const port = process.env.PORT ?? 3000;
      app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`API listening on port ${String(port)}`);
      });
    })
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
}
