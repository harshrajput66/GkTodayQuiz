// api/index.js — Vercel serverless entry point
const app = require('../backend/src/app');

// Vercel serverless functions require the exported Express app
module.exports = app;
