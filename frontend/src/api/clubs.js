import client from './client';

export async function listClubs(params) { const response = await client.get('/clubs', { params }); return response.data; }
export async function getClub(id) { const response = await client.get(`/clubs/${id}`); return response.data.data; }
export async function createClub(payload) { const response = await client.post('/clubs', payload); return response.data.data.club; }
export async function updateClub(id, payload) { const response = await client.patch(`/clubs/${id}`, payload); return response.data.data.club; }
export async function setClubStatus(id, isActive) { const response = await client.patch(`/clubs/${id}/status`, { isActive }); return response.data.data.club; }
export async function joinClub(id, message) { const response = await client.post(`/clubs/${id}/join`, { message }); return response.data.data.membership; }
export async function leaveClub(id) { const response = await client.post(`/clubs/${id}/leave`); return response.data.data.membership; }
export async function listClubMembers(id, params) { const response = await client.get(`/clubs/${id}/members`, { params }); return response.data; }
export async function updateClubMember(id, userId, payload) { const response = await client.patch(`/clubs/${id}/members/${userId}`, payload); return response.data.data.membership; }
export async function transferPresidency(id, userId) { const response = await client.post(`/clubs/${id}/transfer-presidency`, { userId }); return response.data.data; }
export async function listMyMemberships() { const response = await client.get('/me/memberships'); return response.data.data; }
