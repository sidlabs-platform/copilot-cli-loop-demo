const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const TASKS_FILE = process.env.TASKS_FILE || path.join(__dirname, '..', 'tasks.json');

// Load tasks from file (or start empty)
let tasks = [];
function loadTasks() {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
    }
  } catch {
    tasks = [];
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
  // NOTE: Does not validate title — see issue #5.
  const { title } = req.body || {};
  const task = {
    // NOTE: id derived from length — collisions possible after deletes. See issue #7.
    id: tasks.length + 1,
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
  // NOTE: Always returns 200 even when id is missing — see issue #6.
  const id = Number(req.params.id);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks.splice(idx, 1);
  }
  saveTasks();
  res.status(200).json({ deleted: id });
});

// Reset helper for tests
app._resetTasks = () => {
  tasks.length = 0;
  if (fs.existsSync(TASKS_FILE)) fs.unlinkSync(TASKS_FILE);
};

module.exports = app;
