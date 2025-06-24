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

describe('POST /snippets', () => {
  describe('successful requests', () => {
    it('should create a snippet and return its summary with id', async () => {
      const testText = 'This is a test snippet for AI summarization.';

      const res = await request(app)
        .post('/snippets')
        .send({ text: testText })
        .expect(201);

      const body = res.body as SnippetResponse;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('summary');
      expect(typeof body.id).toBe('string');
      expect(typeof body.summary).toBe('string');
      expect(body.summary).toBe('mocked summary');

      // Verify the AI service was called with the correct text
      expect(summarize.getSummary).toHaveBeenCalledWith(testText);
      expect(summarize.getSummary).toHaveBeenCalledTimes(1);
    });

    it('should handle long text input', async () => {
      const longText = 'A'.repeat(1000);

      const res = await request(app)
        .post('/snippets')
        .send({ text: longText })
        .expect(201);

      const body = res.body as SnippetResponse;
      expect(body.summary).toBe('mocked summary');
      expect(summarize.getSummary).toHaveBeenCalledWith(longText);
    });
  });

  describe('validation errors', () => {
    it('should return 400 when text is missing', async () => {
      const res = await request(app).post('/snippets').send({}).expect(400);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Text is required' });
    });

    it('should return 400 when text is empty string', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({ text: '' })
        .expect(400);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Text is required' });
    });

    it('should return 400 when text is only whitespace', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({ text: '   ' })
        .expect(400);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Text is required' });
    });

    it('should return 400 when text is null', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({ text: null })
        .expect(400);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Text is required' });
    });
  });

  describe('AI service errors', () => {
    it('should return 503 when AI service hits rate limit', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as { status?: number }).status = 429;

      vi.spyOn(summarize, 'getSummary').mockRejectedValueOnce(rateLimitError);

      const res = await request(app)
        .post('/snippets')
        .send({ text: 'Test text' })
        .expect(503);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({
        error: 'AI service rate limit reached. Please try again later.',
      });
    });

    it('should return 500 when AI service throws generic error', async () => {
      vi.spyOn(summarize, 'getSummary').mockRejectedValueOnce(
        new Error('AI service unavailable'),
      );

      const res = await request(app)
        .post('/snippets')
        .send({ text: 'Test text' })
        .expect(500);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Failed to generate summary.' });
    });

    it('should return 500 when AI service throws error with response.status', async () => {
      const errorWithResponse = new Error('Service error');
      (errorWithResponse as { response?: { status?: number } }).response = {
        status: 500,
      };

      vi.spyOn(summarize, 'getSummary').mockRejectedValueOnce(
        errorWithResponse,
      );

      const res = await request(app)
        .post('/snippets')
        .send({ text: 'Test text' })
        .expect(500);

      const body = res.body as ErrorResponse;
      expect(body).toEqual({ error: 'Failed to generate summary.' });
    });
  });

  describe('request format', () => {
    it('should accept JSON content type', async () => {
      const res = await request(app)
        .post('/snippets')
        .set('Content-Type', 'application/json')
        .send({ text: 'Test text' })
        .expect(201);

      const body = res.body as SnippetResponse;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('summary');
    });

    it('should handle additional fields in request body', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({
          text: 'Test text',
          extraField: 'should be ignored',
          anotherField: 123,
        })
        .expect(201);

      const body = res.body as SnippetResponse;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('summary');
      expect(summarize.getSummary).toHaveBeenCalledWith('Test text');
    });
  });

  describe('security tests', () => {
    it('should handle XSS attempts in input text', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        '"><img src=x onerror=alert("xss")>',
      ];

      for (const payload of xssPayloads) {
        const res = await request(app)
          .post('/snippets')
          .send({ text: payload })
          .expect(201);

        const body = res.body as SnippetResponse;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('summary');

        // Verify the AI service was called with the exact payload
        expect(summarize.getSummary).toHaveBeenCalledWith(payload);

        // The summary should be the mocked value, not the raw payload
        expect(body.summary).toBe('mocked summary');
      }
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE snippets; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "admin'--",
        "1' UNION SELECT * FROM users--",
      ];

      for (const payload of sqlInjectionPayloads) {
        const res = await request(app)
          .post('/snippets')
          .send({ text: payload })
          .expect(201);

        const body = res.body as SnippetResponse;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('summary');

        // Verify the AI service was called with the exact payload
        expect(summarize.getSummary).toHaveBeenCalledWith(payload);
      }
    });

    it('should handle NoSQL injection attempts', async () => {
      const nosqlInjectionPayloads = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$where": "1==1"}',
        '{"$regex": ".*"}',
        '{"$exists": true}',
      ];

      for (const payload of nosqlInjectionPayloads) {
        const res = await request(app)
          .post('/snippets')
          .send({ text: payload })
          .expect(201);

        const body = res.body as SnippetResponse;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('summary');

        // Verify the AI service was called with the exact payload
        expect(summarize.getSummary).toHaveBeenCalledWith(payload);
      }
    });

    it('should handle command injection attempts', async () => {
      const commandInjectionPayloads = [
        '$(rm -rf /)',
        '; rm -rf /',
        '| rm -rf /',
        '`rm -rf /`',
        '$(cat /etc/passwd)',
      ];

      for (const payload of commandInjectionPayloads) {
        const res = await request(app)
          .post('/snippets')
          .send({ text: payload })
          .expect(201);

        const body = res.body as SnippetResponse;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('summary');

        // Verify the AI service was called with the exact payload
        expect(summarize.getSummary).toHaveBeenCalledWith(payload);
      }
    });

    it('should handle large payloads without crashing', async () => {
      const largePayload = 'A'.repeat(10000); // 10KB payload

      const res = await request(app)
        .post('/snippets')
        .send({ text: largePayload })
        .expect(201);

      const body = res.body as SnippetResponse;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('summary');
      expect(summarize.getSummary).toHaveBeenCalledWith(largePayload);
    });

    it('should handle unicode and special characters safely', async () => {
      const unicodePayloads = [
        '🚀 Test with emoji',
        'Test with unicode: 你好世界',
        'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        'Test with quotes: "single" and \'double\'',
        'Test with newlines:\n\r\t',
        'Test with null bytes: \x00\x01\x02',
      ];

      for (const payload of unicodePayloads) {
        const res = await request(app)
          .post('/snippets')
          .send({ text: payload })
          .expect(201);

        const body = res.body as SnippetResponse;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('summary');
        expect(summarize.getSummary).toHaveBeenCalledWith(payload);
      }
    });

    it('should not expose sensitive information in error responses', async () => {
      // Mock the AI service to throw an error with potentially sensitive info
      vi.spyOn(summarize, 'getSummary').mockRejectedValueOnce(
        new Error(
          'Database connection failed: mongodb://user:password@localhost:27017',
        ),
      );

      const res = await request(app)
        .post('/snippets')
        .send({ text: 'Test text' })
        .expect(500);

      const body = res.body as ErrorResponse;
      expect(body.error).toBe('Failed to generate summary.');

      // Ensure the error message doesn't contain sensitive information
      expect(body.error).not.toContain('mongodb://');
      expect(body.error).not.toContain('password');
      expect(body.error).not.toContain('localhost');
    });
  });
});
