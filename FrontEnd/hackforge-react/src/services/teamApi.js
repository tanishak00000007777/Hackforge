import { apiGet, apiPost, apiDelete } from './apiClient.js';

export function createTeam(hackathonId, payload) {
  return apiPost(`/teams/${hackathonId}`, payload);
}

export function joinTeam(hackathonId, inviteCode) {
  return apiPost(`/teams/${hackathonId}/join`, { invite_code: inviteCode });
}

export function getMyTeam(hackathonId) {
  return apiGet(`/teams/${hackathonId}/my-team`);
}

export function leaveTeam(hackathonId) {
  return apiDelete(`/teams/${hackathonId}/leave`);
}
