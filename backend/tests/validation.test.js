const request = require('supertest');
let app;
beforeAll(async () => {
  app = await require('../server');
});

describe('Validation of lignes', () => {
  test('POST rejects non positive quantity', async () => {
    const res = await request(app)
      .post('/api/factures')
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
      .send({
        nom_client: 'Client',
        date_facture: '2024-01-01',
        lignes: [
          { description: 'Item', quantite: 1, prix_unitaire: 10 }
        ]
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/factures/${id}`)
      .send({
        nom_client: 'Client',
        date_facture: '2024-01-01',
        lignes: [
          { description: 'Item', quantite: -1, prix_unitaire: 10 }
        ]
      });
    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error).toBe('Quantité invalide');
  });
});
