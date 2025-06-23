const request = require('supertest');
let app;
beforeAll(async () => {
  app = await require('../server');
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
    expect(updateRes.body.success).toBe(true);

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
