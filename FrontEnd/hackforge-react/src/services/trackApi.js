import { apiGet, apiPost, apiDelete } from './apiClient.js';

export function getTracks(hackathonId) {
  return apiGet(`/tracks/${hackathonId}`);
}

export function createTrack(hackathonId, payload) {
  return apiPost(`/tracks/${hackathonId}`, payload);
}

export function deleteTrack(trackId) {
  return apiDelete(`/tracks/${trackId}`);
}
