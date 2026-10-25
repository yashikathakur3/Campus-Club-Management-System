const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/eventController');
const schemas = require('../validators/eventValidators');

const router = express.Router();
router.get('/', optionalAuth, validate({ query: schemas.listEvents }), asyncHandler(controller.list));
router.get('/:id/registrations', authenticate, validate({ params: schemas.eventIdParams, query: schemas.registrationList }), asyncHandler(controller.registrations));
router.post('/:id/register', authenticate, validate({ params: schemas.eventIdParams }), asyncHandler(controller.register));
router.delete('/:id/register', authenticate, validate({ params: schemas.eventIdParams }), asyncHandler(controller.cancelRegistration));
router.patch('/:id/status', authenticate, validate({ params: schemas.eventIdParams, body: schemas.statusAction }), asyncHandler(controller.status));
router.patch('/:id', authenticate, validate({ params: schemas.eventIdParams, body: schemas.patchEvent }), asyncHandler(controller.patch));
router.get('/:id', optionalAuth, validate({ params: schemas.eventIdParams }), asyncHandler(controller.get));
module.exports = router;
