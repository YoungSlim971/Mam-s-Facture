const request = require('supertest');
const app = require('../server');

describe('Client endpoints', () => {
  test('POST /api/clients creates a client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ nom_client: 'Client Test', telephone: '111' });
    expect(res.status).toBe(201);
    expect(res.body.nom_client).toBe('Client Test');
    const id = res.body.id;

    const getRes = await request(app).get(`/api/clients/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(id);
  });

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
