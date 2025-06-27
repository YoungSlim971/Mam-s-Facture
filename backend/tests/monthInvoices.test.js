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

describe('GET /api/invoices/stats?month=<now>&year=<now>', () => {
  test('counts invoices created this month', async () => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const initialRes = await request(app)
      .get(`/api/invoices/stats?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(initialRes.status).toBe(200);
    const {
      payees: initPaid = 0,
      non_payees: initUnpaid = 0,
      total: initTotal = 0,
    } = initialRes.body;

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
      .get(`/api/invoices/stats?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(afterRes.status).toBe(200);
    expect(afterRes.body.payees).toBe(initPaid + 1);
    expect(afterRes.body.non_payees).toBe(initUnpaid + 1);
    expect(afterRes.body.total).toBe(initTotal + 2);
  });
});

describe('GET /api/invoices/stats?month=06&year=2025', () => {
  test('counts invoices for a specific month', async () => {
    const initialRes = await request(app)
      .get('/api/invoices/stats?month=06&year=2025')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(initialRes.status).toBe(200);
    const {
      payees: initPaid = 0,
      non_payees: initUnpaid = 0,
      total: initTotal = 0,
    } = initialRes.body;

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'June Paid',
        date_facture: '2025-06-10',
        lignes: [{ description: 'a', quantite: 1, prix_unitaire: 10 }],
        status: 'paid',
      });

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'June Unpaid',
        date_facture: '2025-06-11',
        lignes: [{ description: 'b', quantite: 1, prix_unitaire: 15 }],
        status: 'unpaid',
      });

    const afterRes = await request(app)
      .get('/api/invoices/stats?month=06&year=2025')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(afterRes.status).toBe(200);
    expect(afterRes.body.payees).toBe(initPaid + 1);
    expect(afterRes.body.non_payees).toBe(initUnpaid + 1);
    expect(afterRes.body.total).toBe(initTotal + 2);
  });
});
