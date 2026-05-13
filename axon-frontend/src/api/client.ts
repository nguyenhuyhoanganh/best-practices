import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({ baseURL: '/api', withCredentials: true });

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;
    if (!refreshing) {
      refreshing = axios
        .post<{ access_token: string }>('/auth/refresh', {}, { withCredentials: true })
        .then((r) => r.data.access_token)
        .finally(() => { refreshing = null; });
    }
    try {
      const newToken = await refreshing;
      useAuthStore.getState().setAccessToken(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    } catch {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  }
);

export default client;
