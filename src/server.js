const express = require('express');

const app = express();
app.use(express.json());

// In-memory store. Persistence is intentionally not implemented (see issue #4).
const tasks = [];

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/tasks', (req, res) => {
  // NOTE: Does not validate title — see issue #5.
  const { title } = req.body || {};
  const task = {
    // NOTE: id derived from length — collisions possible after deletes. See issue #7.
    id: tasks.length + 1,
    title,
    completed: false,
  };
  tasks.push(task);
  res.status(201).json(task);
});

app.delete('/tasks/:id', (req, res) => {
  // NOTE: Always returns 200 even when id is missing — see issue #6.
  const id = Number(req.params.id);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks.splice(idx, 1);
  }
  res.status(200).json({ deleted: id });
});

module.exports = app;
