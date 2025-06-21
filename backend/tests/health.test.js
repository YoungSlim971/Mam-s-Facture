const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  it('returns API health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        storage: expect.any(String)
      })
    );
  });
});
