const request = require('supertest');
const app = require('../server');

describe('Client update', () => {
  test('PUT /api/clients/:id updates existing client', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .send({ nom_client: 'Client Test', telephone: '111' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/clients/${id}`)
      .send({ nom_client: 'Client Updated', telephone: '222' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const getRes = await request(app).get(`/api/clients/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.nom_client).toBe('Client Updated');
    expect(getRes.body.telephone).toBe('222');
  });
});

describe('Client creation and listing', () => {
  test('POST /api/clients adds client that appears in GET /api/clients', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .send({ nom_client: 'Nouveau Client', telephone: '123' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const listRes = await request(app).get('/api/clients');
    expect(listRes.status).toBe(200);
    const created = listRes.body.find(c => c.id === id);
    expect(created).toBeTruthy();
    expect(created.nom_client).toBe('Nouveau Client');
  });
});
