import { apiPost, apiGet } from './apiClient.js';

export function login(email, password) {
  return apiPost('/auth/login', { email, password }, { skipAuth: true });
}

export function register(payload) {
  return apiPost('/auth/register', payload, { skipAuth: true });
}

export function getMe() {
  return apiGet('/auth/me');
}

export function refreshToken(refreshTokenStr) {
  return apiPost('/auth/refresh', { refresh_token: refreshTokenStr }, { skipAuth: true });
}
