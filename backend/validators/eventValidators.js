const { z } = require('zod');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const isoDate = z.string().datetime({ offset: true }).transform((value) => new Date(value));
const categories = ['workshop', 'competition', 'social', 'meeting', 'talk', 'other'];
const eventIdParams = z.object({ id: objectId }).strict();
const clubIdParams = z.object({ clubId: z.string().regex(/^(?:[a-f\d]{24}|[a-z0-9]+(?:-[a-z0-9]+)*)$/i) }).strict();
const createEvent = z.object({
  club: objectId.optional(), title: z.string().trim().min(3).max(160), description: z.string().trim().min(1).max(10000),
  category: z.enum(categories), startsAt: isoDate, endsAt: isoDate, location: z.string().trim().min(1).max(240),
  capacity: z.coerce.number().int().min(1), registrationDeadline: isoDate.optional(), posterUrl: z.string().trim().url().max(2048).optional(),
  visibility: z.enum(['public', 'members_only']).default('public'), coordinators: z.array(objectId).max(20).default([]),
}).strict().refine((value) => value.endsAt > value.startsAt, { message: 'End must be after start', path: ['endsAt'] })
  .refine((value) => !value.registrationDeadline || value.registrationDeadline <= value.startsAt, { message: 'Deadline must be at or before start', path: ['registrationDeadline'] });
const patchEvent = z.object({
  title: z.string().trim().min(3).max(160).optional(), description: z.string().trim().min(1).max(10000).optional(), category: z.enum(categories).optional(),
  startsAt: isoDate.optional(), endsAt: isoDate.optional(), location: z.string().trim().min(1).max(240).optional(), capacity: z.coerce.number().int().min(1).optional(),
  registrationDeadline: isoDate.optional(), posterUrl: z.string().trim().url().max(2048).optional(), visibility: z.enum(['public', 'members_only']).optional(), coordinators: z.array(objectId).max(20).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one event field is required');
const statusAction = z.object({ action: z.enum(['publish', 'cancel']) }).strict();
const listEvents = z.object({
  q: z.string().trim().max(120).optional(), category: z.enum(categories).optional(), clubId: objectId.optional(), when: z.enum(['upcoming', 'past']).optional(),
  from: isoDate.optional(), to: isoDate.optional(), available: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sort: z.enum(['startsAt']).default('startsAt'), order: z.enum(['asc', 'desc']).default('asc'), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, { message: 'from must be before to', path: ['from'] });
const registrationList = z.object({ q: z.string().trim().max(120).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
const myRegistrations = z.object({ status: z.enum(['registered', 'cancelled', 'waitlisted']).optional(), when: z.enum(['upcoming', 'past']).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12) }).strict();
module.exports = { eventIdParams, clubIdParams, createEvent, patchEvent, statusAction, listEvents, registrationList, myRegistrations };
