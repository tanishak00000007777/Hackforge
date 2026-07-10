import { apiGet, apiPost, apiPatch } from './apiClient.js';

export function registerForHackathon(hackathonId, payload = {}) {
  return apiPost(`/registrations/${hackathonId}`, payload);
}

export function getRegistrations(hackathonId) {
  return apiGet(`/registrations/${hackathonId}`);
}

export function updateRegistrationStatus(registrationId, status) {
  return apiPatch(`/registrations/${registrationId}/status`, { status });
}
