import 'dotenv/config';
import express from 'express';
import { connectDB } from './db.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
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
