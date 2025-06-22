const request = require('supertest');
let app;
beforeAll(async () => {
  app = await require('../server');
});

describe('GET /api/quote', () => {
  test('returns a random quote', async () => {
    const res = await request(app).get('/api/quote');
    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe('string');
    expect(res.body.text.length).toBeGreaterThan(0);
    expect(typeof res.body.author).toBe('string');
  });
});
