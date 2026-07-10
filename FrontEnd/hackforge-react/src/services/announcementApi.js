import { apiGet, apiPost } from './apiClient.js';

export function createAnnouncement(hackathonId, payload) {
  return apiPost(`/announcements/${hackathonId}`, payload);
}

export function getAnnouncements(hackathonId) {
  return apiGet(`/announcements/${hackathonId}`);
}
