import axios from 'axios';
import { setupMock } from '@/mock/setupMock';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 8000
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => Promise.reject(new Error(error?.response?.data?.message || error.message || 'Request failed'))
);

if (import.meta.env.VITE_USE_MOCK === 'true') {
  setupMock(apiClient);
}
