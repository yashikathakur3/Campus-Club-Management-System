const request = require('supertest');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { z } = require('zod');
const app = require('../app');
const { validateEnv } = require('../config/env');
const ApiError = require('../utils/ApiError');
const errorHandler = require('../middleware/errorHandler');

jest.setTimeout(30000);

describe('backend foundation', () => {
  test('health endpoint returns the documented shape', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);
    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        status: 'ok', db: 'disconnected', uptime: expect.any(Number), environment: expect.any(String),
      }),
    });
  });

  test('unknown routes return the error envelope', async () => {
    const response = await request(app).get('/api/v1/missing').expect(404);
    expect(response.body).toEqual({ success: false, error: { code: 'NOT_FOUND', message: expect.any(String) } });
  });

  test('error handler maps ApiError, Zod, and duplicate key errors', () => {
    const respond = (error) => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      errorHandler(error, {}, res, jest.fn());
      return res;
    };

    let res = respond(new ApiError(418, 'TEAPOT', 'Short and stout'));
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'TEAPOT', message: 'Short and stout' } });

    const parsed = z.object({ email: z.string().email() }).safeParse({ email: 'bad' });
    res = respond(parsed.error);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toMatchObject({ code: 'VALIDATION_ERROR', details: [{ field: 'email' }] });

    res = respond({ code: 11000, keyPattern: { email: 1 } });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].error).toMatchObject({ code: 'CONFLICT' });
  });

  test('production internal errors omit stack traces', () => {
    const prior = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorHandler(new Error('private failure'), {}, res, jest.fn());
    expect(res.json.mock.calls[0][0]).toEqual({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
    if (prior === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prior;
  });

  test('environment validation names missing required variables without exiting', () => {
    expect(() => validateEnv({})).toThrow('MONGO_URI, JWT_SECRET');
    expect(validateEnv({ MONGO_URI: 'mongodb://localhost/db', JWT_SECRET: 'test' })).toMatchObject({ PORT: '5000', NODE_ENV: 'development', CLIENT_ORIGIN: 'http://localhost:5173', JWT_EXPIRES_IN: '7d' });
  });

  test('connects to mongodb-memory-server', async () => {
    const result = execFileSync(process.execPath, [path.join(__dirname, 'mongoConnectionCheck.js')], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      timeout: 30000,
    });
    expect(result).toContain('Memory database connection verified: campus_club_db');
  });
});
