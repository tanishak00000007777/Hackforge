import { apiGet } from './apiClient.js';

export function getHackathonAnalytics(hackathonId) {
  return apiGet(`/analytics/${hackathonId}`);
}
