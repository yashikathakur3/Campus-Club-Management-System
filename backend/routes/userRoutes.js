const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/userController');
const { listUsersSchema, userIdParamsSchema, updateUserSchema } = require('../validators/userValidators');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);
router.get('/', validate({ query: listUsersSchema }), asyncHandler(controller.list));
router.get('/:id', validate({ params: userIdParamsSchema }), asyncHandler(controller.get));
router.patch('/:id', validate({ params: userIdParamsSchema, body: updateUserSchema }), asyncHandler(controller.patch));
module.exports = router;
