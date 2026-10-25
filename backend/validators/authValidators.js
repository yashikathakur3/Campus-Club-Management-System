const { z } = require('zod');

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');
const optionalText = (max) => z.string().trim().max(max).optional();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  studentId: optionalText(80),
  department: optionalText(120),
}).strict();

const loginSchema = z.object({ email, password: z.string().min(1) }).strict();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  department: optionalText(120),
  year: z.number().int().min(1).max(6).optional(),
  bio: optionalText(500),
  avatarUrl: z.string().trim().url().max(2048).optional(),
  studentId: optionalText(80),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one profile field is required');

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
}).strict();

module.exports = { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema };
