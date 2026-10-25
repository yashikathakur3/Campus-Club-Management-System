const { z } = require('zod');

const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(120).optional(),
  role: z.enum(['super_admin', 'member']).optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sort: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).strict();

const userIdParamsSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id') }).strict();
const updateUserSchema = z.object({
  role: z.enum(['super_admin', 'member']).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

module.exports = { listUsersSchema, userIdParamsSchema, updateUserSchema };
