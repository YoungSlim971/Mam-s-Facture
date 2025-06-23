const request = require('supertest');
let app;

beforeAll(async () => {
  app = await require('../server');
});

describe('PUT /api/factures/:id', () => {
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
      .put(`/api/factures/${id}`)
      .send({ statut: 'payée' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('paid');

    const getRes = await request(app).get(`/api/factures/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('paid');
  });
});
