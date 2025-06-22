const request = require('supertest');
const app = require('../server');

describe('GET /api/factures/:id/html', () => {
  test('returns invoice HTML', async () => {
    const createRes = await request(app)
      .post('/api/factures')
      .send({
        nom_client: 'Client Test',
        date_facture: '2024-01-01',
        lignes: [{ description: 'Item', quantite: 1, prix_unitaire: 10 }]
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;
    const numero = createRes.body.numero_facture;

    const res = await request(app).get(`/api/factures/${id}/html`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.headers['content-disposition']).toContain(`facture-${numero}.html`);
    expect(res.text).toMatch(/<html/);
    expect(res.text).toMatch(/FACTURE/);
  });

  test('returns 404 for missing invoice', async () => {
    const res = await request(app).get('/api/factures/9999/html');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Facture non trouvée');
  });
});
