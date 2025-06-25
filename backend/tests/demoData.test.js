const request = require('supertest');
const seed = require('../scripts/seed-demo-data');
let app;
const API_TOKEN = 'test-token';

const fs = require('fs');
const path = require('path');

beforeAll(async () => {
  // Reset the database to ensure consistent seeding
  const dbPath = path.join(__dirname, '..', 'database', 'facturation.sqlite');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  await seed();
  app = await require('../server');
});

describe('Demo data seeding', () => {
  test('returns seeded client and invoices', async () => {
    const clientsRes = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(clientsRes.status).toBe(200);
    expect(clientsRes.body.length).toBeGreaterThanOrEqual(1);

    const invoiceRes = await request(app)
      .get('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(invoiceRes.status).toBe(200);
    // Response shape { factures: [...], pagination: { ... } }
    expect(invoiceRes.body.factures.length).toBeGreaterThanOrEqual(4);
  });
});
