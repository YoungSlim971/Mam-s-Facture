const request = require('supertest');
let app;

beforeAll(async () => {
  app = await require('../server');
});

describe('GET /api/factures?statut=payee', () => {
  test('returns only paid invoices', async () => {
    const res = await request(app).get('/api/factures?statut=payee');
    expect(res.status).toBe(200);
    const statuses = res.body.factures.map(f => f.status);
    expect(new Set(statuses)).toEqual(new Set(['paid']));
  });
});
