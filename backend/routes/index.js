const express = require('express');
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

router.get('/health', (req, res) => sendSuccess(res, {
  status: 'ok',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development',
}));

module.exports = router;
