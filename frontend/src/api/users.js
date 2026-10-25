import client from './client';

export async function listUsers(params) {
  const response = await client.get('/users', { params });
  return response.data;
}

export async function getUser(id) {
  const response = await client.get(`/users/${id}`);
  return response.data.data.user;
}

export async function updateUser(id, payload) {
  const response = await client.patch(`/users/${id}`, payload);
  return response.data.data.user;
}
