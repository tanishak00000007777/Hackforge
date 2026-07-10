import { apiGet } from './apiClient.js';

export function getLeaderboard(hackathonId) {
  return apiGet(`/leaderboard/${hackathonId}`);
}
