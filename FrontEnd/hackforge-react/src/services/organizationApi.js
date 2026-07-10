import { apiGet, apiPost } from './apiClient.js';

export function getMyOrganizations() {
  return apiGet('/organizations/me');
}

export function createOrganization(payload) {
  return apiPost('/organizations/', payload);
}
