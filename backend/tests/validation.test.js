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

describe('Validation of lignes', () => {
  test('POST rejects non positive quantity', async () => {
    const res = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Client',
        date_facture: '2024-01-01',
        lignes: [
          { description: 'Item', quantite: 0, prix_unitaire: 10 }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Quantité invalide');
  });

  test('POST rejects negative unit price', async () => {
    const res = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Client',
        date_facture: '2024-01-01',
        lignes: [
          { description: 'Item', quantite: 1, prix_unitaire: -5 }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Prix unitaire invalide');
  });

  test('PUT rejects invalid values', async () => {
    // create a valid facture first
    const createRes = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Client',
        date_facture: '2024-01-01',
        lignes: [
          { description: 'Item', quantite: 1, prix_unitaire: 10 }
        ]
      });
    expect(createRes.status).toBe(201); // This should now pass with dummy profile
    const id = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/factures/${id}`)
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        nom_client: 'Client', // Required for update
        date_facture: '2024-01-01', // Required for update
        lignes: [
          { description: 'Item', quantite: -1, prix_unitaire: 10 }
        ]
      });
    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error).toBe('Quantité invalide');
  });
});
