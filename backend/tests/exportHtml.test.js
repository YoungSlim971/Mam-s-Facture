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
    // Ensure a user profile exists and has all required fields for the new validation rules
    const profilePayload = {
      full_name: "Test Emitter Company", // maps to raison_sociale
      address_street: "123 Emitter St", // maps to adresse
      address_postal_code: "12345",     // maps to code_postal
      address_city: "Emitville",        // maps to ville
      siret_siren: "12345678901234",    // maps to siret
      ape_naf_code: "6201Z",           // maps to ape_naf
      legal_form: "SAS",                // maps to forme_juridique (THIS WAS MISSING)
      vat_number: "FR00123456789",     // maps to tva_intra
      rcs_rm: "RCS Emitville 123",      // maps to rcs_ou_rm
      // Optional fields for ProfileDataForUpdate, backend will ignore if not for JSON
      email: "emitter@example.com",
      phone: "0102030405"
    };
    const profileRes = await request(app)
      .post('/api/user-profile')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send(profilePayload);
    // Check if profile creation was successful, otherwise tests dependent on it will fail.
    expect(profileRes.status).toBe(200);


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
