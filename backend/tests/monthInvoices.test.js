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

describe('GET /api/invoices?month=current', () => {
  test('counts invoices created this month', async () => {
    const initialRes = await request(app)
      .get('/api/invoices?month=current')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(initialRes.status).toBe(200);
    const { paid: initPaid = 0, unpaid: initUnpaid = 0 } = initialRes.body;

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Test Paid',
        date_facture: '2024-01-01',
        lignes: [{ description: 'x', quantite: 1, prix_unitaire: 10 }],
        status: 'paid',
      });

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Test Unpaid',
        date_facture: '2024-01-02',
        lignes: [{ description: 'y', quantite: 1, prix_unitaire: 15 }],
        status: 'unpaid',
      });

    const afterRes = await request(app)
      .get('/api/invoices?month=current')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(afterRes.status).toBe(200);
    expect(afterRes.body.paid).toBe(initPaid + 1);
    expect(afterRes.body.unpaid).toBe(initUnpaid + 1);
  });
});
