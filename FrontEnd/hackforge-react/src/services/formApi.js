import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiRequest } from './apiClient.js';

export const listForms = (hackathonId) => apiGet(`/forms/hackathons/${hackathonId}`);
export const createForm = (hackathonId, data) => apiPost(`/forms/hackathons/${hackathonId}`, data);
export const getForm = (formId) => apiGet(`/forms/manage/${formId}`);
export const updateForm = (formId, data) => apiPatch(`/forms/manage/${formId}`, data);
export const saveQuestions = (formId, questions) => apiPut(`/forms/manage/${formId}/questions`, questions);
export const publishForm = (formId) => apiPost(`/forms/manage/${formId}/publish`, {});
export const closeForm = (formId) => apiPost(`/forms/manage/${formId}/close`, {});
export const deleteForm = (formId) => apiDelete(`/forms/manage/${formId}`);
export const getPublicForm = (slug) => apiGet(`/forms/public/${slug}`, { skipAuth: true });
export const submitResponse = (slug, data) => apiRequest(`/forms/public/${slug}/responses`, { method: 'POST', body: data });
export const listResponses = (formId) => apiGet(`/forms/manage/${formId}/responses`);
export const getResponse = (responseId) => apiGet(`/forms/response-records/${responseId}`);
export const gradeResponse = (responseId, data) => apiPatch(`/forms/response-records/${responseId}/grade`, data);

export async function downloadAttachment(attachmentId, filename) {
  const { useAuthStore } = await import('../store/authStore.js');
  const token = useAuthStore.getState().accessToken;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
  const response = await fetch(`${base}/forms/attachment-files/${attachmentId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
