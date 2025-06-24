import 'dotenv/config';
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import * as summarize from '../ai/openai/summarize.js';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  // Mock getSummary to avoid hitting OpenAI API 
  // (It was returning too many requests because of free account*)
  vi.spyOn(summarize, 'getSummary').mockResolvedValue('mocked summary');
});

afterEach(async () => {
  // Clean up all collections after each test
  const collections = await mongoose.connection.db?.collections() ?? [];
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
});

describe('POST /snippets', () => {
  it('should create a snippet and return its summary', async () => {
    const res = await request(app)
      .post('/snippets')
      .send({ text: 'This is a test snippet.' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('summary');
    expect(typeof res.body.summary).toBe('string');
  });
});