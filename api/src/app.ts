import 'dotenv/config';
import express, { Request, Response } from 'express';
import { connectDB } from './db.js';
import { Snippet } from './models/Snippet.js';
import { getSummary } from './ai/openai/summarize.js';

interface CreateSnippetRequest {
  text?: string;
}

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post(
  '/snippets',
  async (
    req: Request<
      Record<string, never>,
      Record<string, never>,
      CreateSnippetRequest
    >,
    res: Response,
  ): Promise<void> => {
    const { text } = req.body;
    if (!text?.trim()) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }
    try {
      const summary = await getSummary(text);
      const snippet = await Snippet.create({ text, summary });
      res.status(201).json({ id: snippet._id, summary: snippet.summary });
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null
          ? ((err as { status?: number; response?: { status?: number } })
              .status ??
            (err as { response?: { status?: number } }).response?.status)
          : undefined;
      if (status === 429) {
        res.status(503).json({
          error: 'AI service rate limit reached. Please try again later.',
        });
        return;
      }
      console.error(err);
      res.status(500).json({ error: 'Failed to generate summary.' });
    }
  },
);

app.get(
  '/snippets/:id',
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const snippet = await Snippet.findById(id);
      if (!snippet) {
        res.status(404).json({ error: 'Snippet not found' });
        return;
      }

      res.status(200).json({
        id: snippet._id,
        text: snippet.text,
        summary: snippet.summary,
      });
    } catch (err: unknown) {
      // If the id is invalid, Mongoose will throw a CastError, which we treat as 404
      res.status(404).json({ error: 'Not found' });
    }
  },
);

// Catch-all handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
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
