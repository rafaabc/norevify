const express = require('express');
const swaggerDocument = require('../resources/swagger.json');

const authRoutes = require('./routes/auth.routes');
const expensesRoutes = require('./routes/expenses.routes');
const remindersRoutes = require('./routes/reminders.routes');

const app = express();

const ALLOWED_ORIGINS = [
  'https://drive-ledger-front.vercel.app',
  'http://localhost:5173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get('/api-docs/swagger.json', (req, res) => res.json(swaggerDocument));

app.get('/api-docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Drive Ledger API</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url: '/api-docs/swagger.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: 'BaseLayout'
  });
</script>
</body>
</html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reminders', remindersRoutes);

module.exports = app;
