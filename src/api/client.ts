import axios from 'axios';
import { setupMock } from '@/mock/setupMock';

const normalize = (value: string) => value.replace(/\/$/, '');

const apiBaseURL = (() => {
  const backendBase = String(import.meta.env.VITE_BACKEND_BASE_URL ?? '').trim();
  const apiBasePath = String(import.meta.env.VITE_API_BASE_PATH ?? '/api').trim() || '/api';

  if (backendBase) {
    return `${normalize(backendBase)}${apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`}`;
  }

  return String(import.meta.env.VITE_API_BASE_URL ?? '/api');
})();

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 8000
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => Promise.reject(new Error(error?.response?.data?.message || error.message || 'Request failed'))
);

if (import.meta.env.VITE_USE_MOCK === 'true') {
  setupMock(apiClient);
}
