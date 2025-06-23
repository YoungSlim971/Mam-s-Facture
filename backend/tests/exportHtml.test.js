const request = require('supertest');
let app;
beforeAll(async () => {
  app = await require('../server');
});

describe('GET /api/factures/:id/html', () => {
  let createdClient;
  const API_TOKEN = 'test-token'; // Define at describe level for beforeAll

  beforeAll(async () => {
    // Ensure a user profile exists and has some data
    await request(app)
      .post('/api/user-profile')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        full_name: "Test Emitter Company",
        address_street: "123 Emitter St",
        address_postal_code: "12345",
        address_city: "Emitville",
        siret_siren: "12345678901234",
        ape_naf_code: "6201Z",
        vat_number: "FR00123456789",
        rcs_rm: "RCS Emitville 123",
        email: "emitter@example.com",
        phone: "0102030405"
      });

    // Create a client to be used in tests
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`) // Added Auth
      .send({
        nom_client: 'Test Client for HTML Export',
        adresse_facturation_rue: '1 Rue Test',
        adresse_facturation_cp: '75001',
        adresse_facturation_ville: 'Paris',
        tva: 'FR123456789'
      });
    expect(clientRes.status).toBe(201);
    createdClient = clientRes.body;
  });

  test('returns invoice HTML', async () => {
    const API_TOKEN = 'test-token'; // Added API_TOKEN
    const createRes = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`) // Added Auth
      .send({
        client_id: createdClient.id, // Use created client
        nom_client: createdClient.nom_client, // Can still be sent, often used for display
        date_facture: '2024-01-01',
        lignes: [{ description: 'Item', quantite: 1, prix_unitaire: 10 }]
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const res = await request(app)
      .get(`/api/factures/${id}/html`)
      .set('Authorization', `Bearer ${API_TOKEN}`); // Added Auth
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/<html/);
    expect(res.text).toMatch(/FACTURE/);
  });

  test('returns 404 for missing invoice', async () => {
    const API_TOKEN = 'test-token'; // Added API_TOKEN
    const res = await request(app)
      .get('/api/factures/9999/html')
      .set('Authorization', `Bearer ${API_TOKEN}`); // Added Auth
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Facture non trouvée');
  });
});
