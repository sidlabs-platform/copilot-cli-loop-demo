const request = require('supertest');
const path = require('path');
const os = require('os');

// Point persistence at a temp file so tests don't touch the repo root
process.env.TASKS_FILE = path.join(os.tmpdir(), `tasks-test-${process.pid}.json`);

const app = require('../src/server');

beforeEach(() => {
  app._resetTasks();
});

describe('GET /health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /tasks', () => {
  it('creates a task with valid title', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Valid' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Valid');
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app).post('/tasks').send();
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title is required');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({ completed: false });
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/tasks').send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is whitespace only', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is not a string', async () => {
    const res = await request(app).post('/tasks').send({ title: 123 });
    expect(res.status).toBe(400);
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

describe('PATCH /tasks/:id/complete', () => {
  it('toggles completed twice and returns correct state', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Toggle me' });
    const id = created.body.id;
    expect(created.body.completed).toBe(false);

    const first = await request(app).patch(`/tasks/${id}/complete`);
    expect(first.status).toBe(200);
    expect(first.body.completed).toBe(true);

    const second = await request(app).patch(`/tasks/${id}/complete`);
    expect(second.status).toBe(200);
    expect(second.body.completed).toBe(false);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).patch('/tasks/99999/complete');
    expect(res.status).toBe(404);
  });
});

describe('GET /tasks?completed', () => {
  it('returns all tasks when no filter', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('filters completed tasks', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Filter test' });
    await request(app).patch(`/tasks/${created.body.id}/complete`);

    const res = await request(app).get('/tasks?completed=true');
    expect(res.status).toBe(200);
    res.body.forEach((t) => expect(t.completed).toBe(true));
  });

  it('filters incomplete tasks', async () => {
    const res = await request(app).get('/tasks?completed=false');
    expect(res.status).toBe(200);
    res.body.forEach((t) => expect(t.completed).toBe(false));
  });

  it('returns 400 for invalid completed value', async () => {
    const res = await request(app).get('/tasks?completed=maybe');
    expect(res.status).toBe(400);
  });
});
