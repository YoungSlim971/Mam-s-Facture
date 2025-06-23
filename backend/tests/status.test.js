const request = require('supertest');
const { setupDummyProfile, cleanupDummyProfile } = require('./testUtils');
let app;
const API_TOKEN = 'test-token'; // Standard test token

beforeAll(async () => {
  await setupDummyProfile();
  app = await require('../server');
});

afterAll(async () => {
  await cleanupDummyProfile();
});

describe('PUT /api/factures/:id', () => {
  test('updates invoice status', async () => {
    const createRes = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Client Test', // This client won't exist in DB, but invoice stores name directly
        date_facture: '2024-01-01',
        lignes: [{ description: 'Item', quantite: 1, prix_unitaire: 10 }]
      });
    expect(createRes.status).toBe(201); // Should pass with dummy profile
    const id = createRes.body.id;

    // For updating status, the backend PUT /api/factures/:id expects the full invoice body or at least required fields.
    // Let's fetch the created invoice to ensure we have all necessary fields before updating.
    const initialInvoiceRes = await request(app)
        .get(`/api/factures/${id}`)
        .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(initialInvoiceRes.status).toBe(200);
    const invoiceToUpdate = initialInvoiceRes.body;

    const patchRes = await request(app)
      .put(`/api/factures/${id}`)
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ ...invoiceToUpdate, statut: 'payée', status: 'paid' }); // Send full body with status changed
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('paid');

    const getRes = await request(app)
        .get(`/api/factures/${id}`)
        .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('paid');
  });
});
