jest.mock('../services/quoteService', () => ({
  getRandomQuote: jest.fn(() => { throw new Error('boom'); })
}));
const request = require('supertest');
let app;

beforeAll(async () => {
  app = await require('../server');
});

const API_TOKEN = 'test-token';

describe('Error handling', () => {
  test('GET missing client returns 404', async () => {
    const res = await request(app)
      .get('/api/clients/999999')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Client non trouvé');
  });

  test('GET missing invoice returns 404', async () => {
    const res = await request(app)
      .get('/api/factures/999999')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Facture non trouvée');
  });

  test('server error propagates to middleware', async () => {
    const res = await request(app).get('/api/quote');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Erreur lors de la récupération de la citation');
  });
});
