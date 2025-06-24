import 'dotenv/config';
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import * as summarize from '../ai/openai/summarize.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';

interface SnippetListItem {
  id: string;
  text: string;
  summary: string;
}

interface ErrorResponse {
  error: string;
}

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  // Use MongoDB Memory Server if available, otherwise use environment variable
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (error) {
    // Fallback to environment variable (for CI)
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'MONGODB_URI is not set and MongoDB Memory Server is not available',
      );
    }
    await mongoose.connect(uri);
  }

  // Mock getSummary to avoid hitting OpenAI API
  // (It was returning too many requests because of free account*)
  vi.spyOn(summarize, 'getSummary').mockResolvedValue('mocked summary');
});

afterEach(async () => {
  // Clean up all collections after each test
  const collections = (await mongoose.connection.db?.collections()) ?? [];
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  // Reset all mocks after each test
  vi.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();

  // Clean up MongoDB Memory Server if it was used
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('GET /snippets', () => {
  it('should return empty array when no snippets exist', async () => {
    const res = await request(app).get('/snippets').expect(200);

    const body = res.body as SnippetListItem[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('should handle special characters in snippet text', async () => {
    const specialTexts = [
      'Snippet with emoji: 🚀',
      'Snippet with unicode: 你好世界',
      'Snippet with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      'Snippet with quotes: "single" and \'double\'',
      'Snippet with newlines:\n\r\t',
    ];

    // Create snippets with special characters
    for (const text of specialTexts) {
      await request(app).post('/snippets').send({ text }).expect(201);
    }

    const res = await request(app).get('/snippets').expect(200);

    const body = res.body as SnippetListItem[];
    expect(body).toHaveLength(specialTexts.length);

    // Verify all special texts are returned correctly
    const returnedTexts = body.map((s) => s.text).sort();
    const expectedTexts = [...specialTexts].sort();
    expect(returnedTexts).toEqual(expectedTexts);
  });

  it('should return correct snippet structure', async () => {
    await request(app)
      .post('/snippets')
      .send({ text: 'Test snippet' })
      .expect(201);

    const res = await request(app).get('/snippets').expect(200);

    const body = res.body as SnippetListItem[];
    expect(body).toHaveLength(1);

    const snippet = body[0];
    expect(snippet).toEqual({
      id: expect.any(String),
      text: 'Test snippet',
      summary: 'mocked summary',
    });

    // Verify ID is valid
    expect(snippet.id).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('should handle database errors gracefully', async () => {
    // Mock a database error by temporarily disconnecting
    await mongoose.disconnect();

    const res = await request(app).get('/snippets').expect(500);

    const body = res.body as ErrorResponse;
    expect(body).toEqual({ error: 'Failed to retrieve snippets.' });

    // Reconnect for cleanup
    if (mongoServer) {
      await mongoose.connect(mongoServer.getUri());
    }
  });
});
