import { apiGet, apiPost, apiPatch } from './apiClient.js';

export function createSubmission(hackathonId, payload) {
  return apiPost(`/submissions/${hackathonId}`, payload);
}

export function updateSubmission(submissionId, payload) {
  return apiPatch(`/submissions/${submissionId}`, payload);
}

export function submitSubmission(submissionId) {
  return apiPost(`/submissions/${submissionId}/submit`);
}

export function getHackathonSubmissions(hackathonId) {
  return apiGet(`/submissions/${hackathonId}/all`);
}
