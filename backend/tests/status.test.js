const request = require('supertest');
let app;

beforeAll(async () => {
  app = await require('../server');
});

describe('PATCH /api/factures/:id/status', () => {
  test('updates invoice status', async () => {
    const createRes = await request(app)
      .post('/api/factures')
      .send({
        nom_client: 'Client Test',
        date_facture: '2024-01-01',
        lignes: [{ description: 'Item', quantite: 1, prix_unitaire: 10 }]
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const patchRes = await request(app)
      .patch(`/api/factures/${id}/status`)
      .send({ status: 'paid' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.message).toBe('Statut mis à jour');

    const getRes = await request(app).get(`/api/factures/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('paid');
  });
});
