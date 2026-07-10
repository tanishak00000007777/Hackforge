import { apiGet, apiPost } from './apiClient.js';

export function inviteJudge(hackathonId, payload) {
  return apiPost(`/judges/${hackathonId}/invite`, payload);
}

export function acceptJudgeInvite(hackathonId) {
  return apiPost(`/judges/${hackathonId}/accept`);
}

export function createRubricCriteria(hackathonId, payload) {
  return apiPost(`/judges/${hackathonId}/rubric`, payload);
}

export function getRubric(hackathonId) {
  return apiGet(`/judges/${hackathonId}/rubric`);
}

export function submitScore(submissionId, payload) {
  return apiPost(`/judges/scores/${submissionId}`, payload);
}

export function getScores(submissionId) {
  return apiGet(`/judges/scores/${submissionId}`);
}
