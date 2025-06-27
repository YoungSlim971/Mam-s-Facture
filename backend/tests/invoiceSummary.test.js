const request = require('supertest');
const { setupDummyProfile, cleanupDummyProfile } = require('./testUtils');
let app;
const API_TOKEN = 'test-token';

beforeAll(async () => {
  await setupDummyProfile();
  app = await require('../server');
});

afterAll(async () => {
  await cleanupDummyProfile();
});

describe('GET /api/invoices/summary', () => {
  test('counts paid and unpaid invoices', async () => {
    const before = await request(app)
      .get('/api/invoices/summary')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(before.status).toBe(200);
    const { payees: initPaid = 0, non_payees: initUnpaid = 0 } = before.body;

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Summary Paid',
        date_facture: '2024-01-01',
        lignes: [{ description: 'a', quantite: 1, prix_unitaire: 10 }],
        status: 'paid',
      });

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Summary Unpaid',
        date_facture: '2024-01-02',
        lignes: [{ description: 'b', quantite: 1, prix_unitaire: 15 }],
        status: 'unpaid',
      });

    const after = await request(app)
      .get('/api/invoices/summary')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(after.status).toBe(200);
    expect(after.body.payees).toBe(initPaid + 1);
    expect(after.body.non_payees).toBe(initUnpaid + 1);
  });
});
