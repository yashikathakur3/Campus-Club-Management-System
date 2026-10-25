import client from './client';

export async function listEvents(params) { return (await client.get('/events', { params })).data; }
export async function getEvent(id) { return (await client.get(`/events/${id}`)).data.data; }
export async function createEvent(clubId, payload) { return (await client.post(`/clubs/${clubId}/events`, payload)).data.data.event; }
export async function listClubEvents(clubId, params = {}) { return (await client.get(`/clubs/${clubId}/events`, { params })).data; }
export async function updateEvent(id, payload) { return (await client.patch(`/events/${id}`, payload)).data.data.event; }
export async function changeEventStatus(id, action) { return (await client.patch(`/events/${id}/status`, { action })).data.data.event; }
export async function registerForEvent(id) { return (await client.post(`/events/${id}/register`)).data.data; }
export async function unregisterFromEvent(id) { return (await client.delete(`/events/${id}/register`)).data.data; }
export async function listEventRegistrations(id, params) { return (await client.get(`/events/${id}/registrations`, { params })).data; }
export async function listMyRegistrations(params) { return (await client.get('/me/registrations', { params })).data; }
