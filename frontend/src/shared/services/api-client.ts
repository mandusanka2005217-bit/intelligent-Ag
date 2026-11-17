import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---- Request interceptor ----
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach auth token if present
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---- Response interceptor ----
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired — clear storage and redirect to login if applicable
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }

      if (status === 403) {
        console.warn('API: Forbidden — insufficient permissions.');
      }

      if (status >= 500) {
        console.error('API: Server error', error.response.data);
      }
    } else if (error.request) {
      console.error('API: No response received', error.request);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
