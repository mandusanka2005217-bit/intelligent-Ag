import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ApiErrorBody } from '@contracts/types';

/**
 * In development VITE_API_BASE_URL is left unset and Vite proxies /api to the
 * Express server on port 8000. In production the same Express process serves
 * the built frontend, so a relative base URL works there too.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      if (error.response.status >= 500) {
        console.error('API server error', error.response.data);
      }
    } else if (error.request) {
      console.error('API: no response received', error.request);
    }
    return Promise.reject(error);
  },
);

/** Turn any thrown API error into a message suitable for the interface. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const detail = body?.error?.details?.[0];
    if (detail) return `${detail.path}: ${detail.message}`;
    if (body?.error?.message) return body.error.message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Is the API running?';
    if (!error.response) return 'Cannot reach the API. Start it with `npm run dev` from the repository root.';
    return `Request failed (${error.response.status})`;
  }
  return error instanceof Error ? error.message : 'Unexpected error';
}

export default apiClient;
