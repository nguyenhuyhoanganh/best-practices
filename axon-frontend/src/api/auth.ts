import axios from 'axios';
import { api } from './client';
import type { BestPracticeRequest, BPType } from '../types';

export const authApi = {
  callback: (code: string) => axios.get(`/auth/sso/callback?code=${code}`),
  me: () => axios.get('/auth/me'),
  logout: () => axios.post('/auth/logout'),
};

export const bpApi = {
  list: (params: { type?: BPType; search?: string; sort?: string; page?: number; size?: number }) =>
    api.get('/best-practices', { params }),
  trending: () => api.get('/best-practices/trending'),
  detail: (id: string) => api.get(`/best-practices/${id}`),
  create: (data: BestPracticeRequest) => api.post('/best-practices', data),
  update: (id: string, data: BestPracticeRequest) => api.put(`/best-practices/${id}`, data),
  delete: (id: string) => api.delete(`/best-practices/${id}`),
  submit: (id: string) => api.post(`/best-practices/${id}/submit`),
  mySubmissions: () => api.get('/best-practices/my'),
  uploadFile: (bpId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/best-practices/${bpId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadFile: (bpId: string, fileId: string) =>
    api.get(`/best-practices/${bpId}/files/${fileId}/download`, { maxRedirects: 0 }),
};

export const adminApi = {
  queue: () => api.get('/admin/best-practices/queue'),
  take: (id: string) => api.put(`/admin/best-practices/${id}/take`),
  approve: (id: string) => api.put(`/admin/best-practices/${id}/approve`),
  reject: (id: string, comment: string) => api.put(`/admin/best-practices/${id}/reject`, { comment }),
  users: () => api.get('/admin/users'),
};
