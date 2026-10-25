const express = require('express');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/clubController');

const router = express.Router();
router.get('/', authenticate, asyncHandler(controller.myMemberships));
module.exports = router;
