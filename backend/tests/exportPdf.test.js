const request = require('supertest');

jest.mock('puppeteer', () => ({
  launch: async () => ({
    newPage: async () => ({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('PDFDATA'))
    }),
    close: jest.fn()
  })
}));

let app;

beforeAll(async () => {
  app = await require('../server');
});

describe('GET /api/factures/:id/pdf', () => {
  test('returns invoice PDF', async () => {
    const createRes = await request(app)
      .post('/api/factures')
      .send({
        nom_client: 'Client Test',
        date_facture: '2024-01-01',
        lignes: [{ description: 'Item', quantite: 1, prix_unitaire: 10 }]
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const res = await request(app).get(`/api/factures/${id}/pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('returns 404 for missing invoice', async () => {
    const res = await request(app).get('/api/factures/9999/pdf');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Facture non trouvée');
  });
});
