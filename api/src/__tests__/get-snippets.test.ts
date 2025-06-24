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

interface SnippetResponse {
  id: string;
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

describe('GET /snippets/:id', () => {
  it('should return a snippet by id', async () => {
    // First create a snippet
    const createRes = await request(app)
      .post('/snippets')
      .send({ text: 'Test snippet for retrieval' })
      .expect(201);

    const { id } = createRes.body as SnippetResponse;

    // Then retrieve it
    const getRes = await request(app).get(`/snippets/${id}`).expect(200);

    const body = getRes.body as SnippetResponse & { text: string };
    expect(body).toHaveProperty('id', id);
    expect(body).toHaveProperty('text', 'Test snippet for retrieval');
    expect(body).toHaveProperty('summary', 'mocked summary');
  });

  it('should return 404 for non-existent snippet', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format

    const res = await request(app).get(`/snippets/${fakeId}`).expect(404);

    const body = res.body as ErrorResponse;
    expect(body).toEqual({ error: 'Snippet not found' });
  });

  it('should return 404 for invalid id format and for valid but non-existent ids', async () => {
    const invalidIds = [
      'invalid-id',
      '123',
      'abc-def-ghi',
      '',
      'null',
      'undefined',
      '507f1f77bcf86cd79943901', // 23 chars, invalid
      '507f1f77bcf86cd7994390111', // 25 chars, invalid
    ];
    const validButNonExistentId = '507f1f77bcf86cd799439012'; // 24 hex chars, valid format but not in DB

    for (const invalidId of invalidIds) {
      const res = await request(app).get(`/snippets/${invalidId}`).expect(404);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Not found' });
    }

    // Valid format but not found
    const res = await request(app)
      .get(`/snippets/${validButNonExistentId}`)
      .expect(404);
    const body = res.body as ErrorResponse;
    expect(body).toEqual({ error: 'Snippet not found' });
  });

  it('should handle multiple snippets correctly', async () => {
    // Create multiple snippets
    const snippet1 = await request(app)
      .post('/snippets')
      .send({ text: 'First snippet' })
      .expect(201);

    const snippet2 = await request(app)
      .post('/snippets')
      .send({ text: 'Second snippet' })
      .expect(201);

    const { id: id1 } = snippet1.body as SnippetResponse;
    const { id: id2 } = snippet2.body as SnippetResponse;

    // Verify they are different
    expect(id1).not.toBe(id2);

    // Retrieve each one
    const get1 = await request(app).get(`/snippets/${id1}`).expect(200);

    const get2 = await request(app).get(`/snippets/${id2}`).expect(200);

    const body1 = get1.body as SnippetResponse & { text: string };
    const body2 = get2.body as SnippetResponse & { text: string };

    expect(body1.text).toBe('First snippet');
    expect(body2.text).toBe('Second snippet');
    expect(body1.id).toBe(id1);
    expect(body2.id).toBe(id2);
  });

  it('should handle special characters in snippet text', async () => {
    const specialText =
      'Snippet with special chars: !@#$%^&*()_+-=[]{}|;:,.<>? 🚀 你好世界';

    const createRes = await request(app)
      .post('/snippets')
      .send({ text: specialText })
      .expect(201);

    const { id } = createRes.body as SnippetResponse;

    const getRes = await request(app).get(`/snippets/${id}`).expect(200);

    const body = getRes.body as SnippetResponse & { text: string };
    expect(body.text).toBe(specialText);
    expect(body.id).toBe(id);
  });

  it('should handle very long snippet text', async () => {
    const longText = 'A'.repeat(1000);

    const createRes = await request(app)
      .post('/snippets')
      .send({ text: longText })
      .expect(201);

    const { id } = createRes.body as SnippetResponse;

    const getRes = await request(app).get(`/snippets/${id}`).expect(200);

    const body = getRes.body as SnippetResponse & { text: string };
    expect(body.text).toBe(longText);
    expect(body.text.length).toBe(1000);
  });
});
