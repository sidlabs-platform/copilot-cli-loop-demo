const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Request logging middleware (disabled in test)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });
}

const TASKS_FILE = process.env.TASKS_FILE || path.join(__dirname, '..', 'tasks.json');

// Load tasks from file (or start empty)
let tasks = [];
let nextId = 1;
function loadTasks() {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    }
  } catch {
    tasks = [];
    nextId = 1;
  }
}
function saveTasks() {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}
loadTasks();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/tasks', (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    return res.json(tasks);
  }
  if (completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  const flag = completed === 'true';
  res.json(tasks.filter((t) => t.completed === flag));
});

app.post('/tasks', (req, res) => {
  const { title } = req.body || {};
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title is required' });
  }
  const task = {
    id: nextId++,
    title,
    completed: false,
  };
  tasks.push(task);
  saveTasks();
  res.status(201).json(task);
});

app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, completed } = req.body || {};
  if (title === undefined && completed === undefined) {
    return res.status(400).json({ error: 'title or completed is required' });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }

  if (title !== undefined) task.title = title;
  if (completed !== undefined) task.completed = completed;

  saveTasks();
  res.status(200).json(task);
});

app.patch('/tasks/:id/complete', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  task.completed = !task.completed;
  saveTasks();
  res.status(200).json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'task not found' });
  }
  tasks.splice(idx, 1);
  saveTasks();
  res.status(204).send();
});

// Reset helper for tests
app._resetTasks = () => {
  tasks.length = 0;
  nextId = 1;
  if (fs.existsSync(TASKS_FILE)) fs.unlinkSync(TASKS_FILE);
};

module.exports = app;
