const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { env, validateEnv } = require('./config/env');
const routes = require('./routes');
const authRoutes = require('./routes/authRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const config = env || validateEnv();
const app = express();

app.use(helmet());
app.use(cors({ origin: config.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
if (config.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/v1', routes);
app.use('/api/v1/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
