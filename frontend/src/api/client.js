import axios from 'axios';
import { AUTH_STORAGE_KEY, clearToken } from '../auth/storage';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Anonymous requests still work when browser storage is blocked.
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const body = error.response?.data?.error;
    const normalized = {
      code: body?.code || (error.response ? 'REQUEST_FAILED' : 'NETWORK_ERROR'),
      message: body?.message || (error.response ? 'The request could not be completed.' : 'Unable to reach the server. Check your connection and try again.'),
      details: body?.details,
      status: error.response?.status,
    };

    if (normalized.status === 401 && normalized.code === 'UNAUTHENTICATED') {
      clearToken();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }

    return Promise.reject(normalized);
  },
);

export default client;
