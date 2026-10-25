const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/authController');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/authValidators');

const router = express.Router();
const authAttemptLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Try again later.' } },
});

router.post('/register', authAttemptLimit, validate({ body: registerSchema }), asyncHandler(controller.register));
router.post('/login', authAttemptLimit, validate({ body: loginSchema }), asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.getMe));
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), asyncHandler(controller.patchMe));
router.patch('/me/password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(controller.patchPassword));

module.exports = router;
