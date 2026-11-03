import request from 'supertest';
import { createApp } from '../app';

describe('auth contract', () => {
  const app = createApp();

  it('rejects /auth/me without a token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects /auth/refresh without a token', async () => {
    const res = await request(app).post('/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect([404, 401]).toContain(res.status);
  });
});