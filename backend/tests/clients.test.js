const request = require('supertest');
const { setupDummyProfile, cleanupDummyProfile } = require('./testUtils');
let app;
beforeAll(async () => {
  await setupDummyProfile();
  app = await require('../server');
});

afterAll(async () => {
  await cleanupDummyProfile();
});

const API_TOKEN = 'test-token'; // Use the same token as used in the pnpm test command

describe('Client endpoints', () => {
  test('POST /api/clients creates a client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ nom_client: 'Client Test', telephone: '111' });
    expect(res.status).toBe(201);
    expect(res.body.nom_client).toBe('Client Test');
    const id = res.body.id;

    const getRes = await request(app).get(`/api/clients/${id}`).set('Authorization', `Bearer ${API_TOKEN}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(id);
  });

  test('PUT /api/clients/:id updates existing client', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ nom_client: 'Client Test', telephone: '111' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/clients/${id}`)
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ nom_client: 'Client Updated', telephone: '222' });
    expect(updateRes.status).toBe(200);
    // The API returns the updated client object directly
    expect(updateRes.body.nom_client).toBe('Client Updated');
    expect(updateRes.body.telephone).toBe('222');

    const getRes = await request(app).get(`/api/clients/${id}`).set('Authorization', `Bearer ${API_TOKEN}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.nom_client).toBe('Client Updated');
    expect(getRes.body.telephone).toBe('222');
  });
});

describe('Client creation and listing', () => {
  test('POST /api/clients adds client that appears in GET /api/clients', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ nom_client: 'Nouveau Client', telephone: '123' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const listRes = await request(app).get('/api/clients').set('Authorization', `Bearer ${API_TOKEN}`);
    expect(listRes.status).toBe(200);
    const created = listRes.body.find(c => c.id === id);
    expect(created).toBeTruthy();
    expect(created.nom_client).toBe('Nouveau Client');
  });

  test('GET /api/clients/:id returns all fields', async () => {
    const payload = {
      nom_client: 'Full Fields',
      telephone: '000',
      email: 'full@example.com',
      siren: '123456789',
      siret: '12345678900011',
      legal_form: 'SARL',
      tva: 'FR123456789',
      rcs_number: 'RCS 123',
      logo: '/img.png'
    };
    const res = await request(app).post('/api/clients').set('Authorization', `Bearer ${API_TOKEN}`).send(payload);
    expect(res.status).toBe(201);
    const id = res.body.id;

    const getRes = await request(app).get(`/api/clients/${id}`).set('Authorization', `Bearer ${API_TOKEN}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual(
      expect.objectContaining({
        id,
        email: payload.email,
        siren: payload.siren,
        siret: payload.siret,
        legal_form: payload.legal_form,
        tva: payload.tva,
        rcs_number: payload.rcs_number,
        logo: payload.logo
      })
    );
  });
});

describe('Client invoice counts', () => {
  test('includes invoice totals and updates when status changes', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ nom_client: 'Count Client', telephone: '000' });
    expect(clientRes.status).toBe(201);
    const clientId = clientRes.body.id;

    const inv1 = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        client_id: clientId,
        nom_client: 'Count Client',
        date_facture: '2024-01-01',
        lignes: [{ description: 'x', quantite: 1, prix_unitaire: 10 }],
        status: 'unpaid'
      });
    expect(inv1.status).toBe(201);
    const invoiceId = inv1.body.id;

    await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({
        client_id: clientId,
        nom_client: 'Count Client',
        date_facture: '2024-01-02',
        lignes: [{ description: 'y', quantite: 1, prix_unitaire: 15 }],
        status: 'paid'
      });

    let listRes = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(listRes.status).toBe(200);
    let cli = listRes.body.find(c => c.id === clientId);
    expect(cli.totalInvoices).toBe(2);
    expect(cli.unpaidInvoices).toBe(1);

    await request(app)
      .patch(`/api/factures/${invoiceId}/status`)
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ status: 'paid' });

    listRes = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    cli = listRes.body.find(c => c.id === clientId);
    expect(cli.totalInvoices).toBe(2);
    expect(cli.unpaidInvoices).toBe(0);
  });
});
