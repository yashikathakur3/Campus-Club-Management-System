const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/eventController');
const schemas = require('../validators/eventValidators');
const { z } = require('zod');

const router = express.Router();
const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20), status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional() }).strict();
router.get('/:clubId/events', authenticate, validate({ params: schemas.clubIdParams, query: listSchema }), asyncHandler(controller.listClub));
router.post('/:clubId/events', authenticate, validate({ params: schemas.clubIdParams, body: schemas.createEvent }), asyncHandler(controller.create));
module.exports = router;
