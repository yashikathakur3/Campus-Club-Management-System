const { z } = require('zod');

const category = z.enum(['technical', 'cultural', 'sports', 'academic', 'social_service', 'arts', 'other']);
const url = z.string().trim().url().max(2048);
const socialLinks = z.object({ website: url.optional(), instagram: url.optional(), facebook: url.optional(), linkedin: url.optional() }).strict().optional();
const clubIdParams = z.object({ id: z.string().regex(/^(?:[a-f\d]{24}|[a-z0-9]+(?:-[a-z0-9]+)*)$/i, 'Invalid club id or slug') }).strict();
const createClubSchema = z.object({
  name: z.string().trim().min(2).max(100), description: z.string().trim().max(3000).optional(), category,
  logoUrl: url.optional(), bannerUrl: url.optional(), contactEmail: z.string().trim().email().max(254).optional(),
  socialLinks, joinPolicy: z.enum(['open', 'approval']).default('approval'), presidentUserId: z.string().regex(/^[a-f\d]{24}$/i),
}).strict();
const patchClubSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(), description: z.string().trim().max(3000).optional(), category: category.optional(),
  logoUrl: url.optional(), bannerUrl: url.optional(), contactEmail: z.string().trim().email().max(254).optional(),
  socialLinks, joinPolicy: z.enum(['open', 'approval']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one editable field is required');
const listClubsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(120).optional(), category: category.optional(), sort: z.enum(['name', 'createdAt', 'memberCount']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'), includeInactive: z.enum(['true', 'false']).transform((value) => value === 'true').default(false),
}).strict();
const statusSchema = z.object({ isActive: z.boolean() }).strict();
const joinSchema = z.object({ message: z.string().trim().max(500).optional() }).strict();
const memberListSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20), status: z.enum(['active', 'pending']).default('active') }).strict();
const memberUserParams = z.object({ id: z.string().regex(/^(?:[a-f\d]{24}|[a-z0-9]+(?:-[a-z0-9]+)*)$/i), userId: z.string().regex(/^[a-f\d]{24}$/i) }).strict();
const memberPatch = z.object({ status: z.enum(['active', 'rejected', 'removed']).optional(), clubRole: z.enum(['member', 'coordinator']).optional(), canAnnounce: z.boolean().optional() }).strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one membership field is required');
const transferSchema = z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) }).strict();

module.exports = { clubIdParams, createClubSchema, patchClubSchema, listClubsSchema, statusSchema, joinSchema, memberListSchema, memberUserParams, memberPatch, transferSchema };
