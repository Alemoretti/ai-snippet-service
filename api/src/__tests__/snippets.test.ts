import 'dotenv/config';
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
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