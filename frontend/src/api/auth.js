import client from './client';

export async function register(payload) {
  const response = await client.post('/auth/register', payload);
  return response.data.data;
}

export async function login(payload) {
  const response = await client.post('/auth/login', payload);
  return response.data.data;
}

export async function getMe() {
  const response = await client.get('/auth/me');
  return response.data.data;
}
