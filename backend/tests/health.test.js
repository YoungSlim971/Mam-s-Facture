const request = require('supertest');
let app;
beforeAll(async () => {
  app = await require('../server');
});

describe('GET /api/health', () => {
  it('returns API health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);

    expect(res.body.status).toBe('OK');
    expect(res.body.storage).toBe('SQLite (sql.js)');

    // ensure timestamp is a valid ISO string
    const isoTimestamp = new Date(res.body.timestamp).toISOString();
    expect(res.body.timestamp).toBe(isoTimestamp);
  });
});
