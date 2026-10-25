const eventService = require('../services/eventService');
const registrationService = require('../services/registrationService');
const { sendSuccess } = require('../utils/response');

async function list(req, res) { const result = await eventService.listPublicEvents(req.query); return sendSuccess(res, result.events, { meta: result.meta }); }
async function get(req, res) { return sendSuccess(res, await eventService.getEvent(req.user, req.params.id)); }
async function create(req, res) {
  if (req.body.club && req.body.club !== req.params.clubId) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Club in the body must match the route' } });
  const event = await eventService.createEvent(req.user, req.params.clubId, req.body); return sendSuccess(res, { event }, { status: 201 });
}
async function listClub(req, res) { const result = await eventService.listClubEvents(req.user, req.params.clubId, req.query); return sendSuccess(res, result.events, { meta: result.meta }); }
async function patch(req, res) { return sendSuccess(res, { event: await eventService.updateEvent(req.user, req.params.id, req.body) }); }
async function status(req, res) { return sendSuccess(res, { event: await eventService.changeEventStatus(req.user, req.params.id, req.body.action) }); }
async function register(req, res) { const result = await registrationService.registerForEvent(req.user, req.params.id); return sendSuccess(res, result, { status: 201 }); }
async function cancelRegistration(req, res) { return sendSuccess(res, await registrationService.cancelRegistration(req.user, req.params.id)); }
async function registrations(req, res) { const result = await eventService.listRegistrations(req.user, req.params.id, req.query); return sendSuccess(res, result.registrations, { meta: { ...result.meta, summary: result.summary } }); }
async function mine(req, res) { const result = await eventService.myRegistrations(req.user, req.query); return sendSuccess(res, result.registrations, { meta: result.meta }); }

module.exports = { list, get, create, listClub, patch, status, register, cancelRegistration, registrations, mine };
