const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  it('returns API health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);

    expect(res.body.status).toBe('OK');
    expect(res.body.storage).toBe('JSON Files');

    // ensure timestamp is a valid ISO string
    const isoTimestamp = new Date(res.body.timestamp).toISOString();
    expect(res.body.timestamp).toBe(isoTimestamp);
  });
});
