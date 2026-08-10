const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'data', 'clients.json');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readClients() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeClients(clients) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2));
}

function findClient(clients, id) {
  const client = clients.find((c) => c.id === id);
  if (!client) {
    const err = new Error('Client not found');
    err.status = 404;
    throw err;
  }
  return client;
}

app.get('/api/clients', (req, res) => {
  res.json(readClients());
});

app.post('/api/clients', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const clients = readClients();
  const client = { id: crypto.randomUUID(), name: name.trim(), notes: [], actions: [] };
  clients.push(client);
  writeClients(clients);
  res.status(201).json(client);
});

app.delete('/api/clients/:id', (req, res) => {
  const clients = readClients();
  const next = clients.filter((c) => c.id !== req.params.id);
  writeClients(next);
  res.status(204).end();
});

app.post('/api/clients/:id/notes', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
  const clients = readClients();
  const client = findClient(clients, req.params.id);
  client.notes.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), text: text.trim() });
  writeClients(clients);
  res.status(201).json(client);
});

app.post('/api/clients/:id/actions', (req, res) => {
  const { text, dueDate } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
  if (!dueDate) return res.status(400).json({ error: 'dueDate is required' });
  const clients = readClients();
  const client = findClient(clients, req.params.id);
  client.actions.push({ id: crypto.randomUUID(), text: text.trim(), dueDate, done: false });
  writeClients(clients);
  res.status(201).json(client);
});

app.patch('/api/clients/:id/actions/:actionId', (req, res) => {
  const clients = readClients();
  const client = findClient(clients, req.params.id);
  const action = client.actions.find((a) => a.id === req.params.actionId);
  if (!action) return res.status(404).json({ error: 'Action not found' });
  if (typeof req.body.done === 'boolean') action.done = req.body.done;
  writeClients(clients);
  res.json(client);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`VOM ops tracker running at http://localhost:${PORT}`);
});
