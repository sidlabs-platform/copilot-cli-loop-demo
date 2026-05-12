const request = require('supertest');
const app = require('../src/server');

describe('GET /health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('PUT /tasks/:id', () => {
  it('updates a task and returns 200', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Original' });
    const id = created.body.id;

    const res = await request(app)
      .put(`/tasks/${id}`)
      .send({ title: 'Updated', completed: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.completed).toBe(true);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/tasks/99999')
      .send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('returns 400 if no fields provided', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Test' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 if completed is not a boolean', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Test' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ completed: 'yes' });
    expect(res.status).toBe(400);
  });
});
