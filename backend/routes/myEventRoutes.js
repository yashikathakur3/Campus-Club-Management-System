const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/eventController');
const schemas = require('../validators/eventValidators');

const router = express.Router();
router.get('/', authenticate, validate({ query: schemas.myRegistrations }), asyncHandler(controller.mine));
module.exports = router;
