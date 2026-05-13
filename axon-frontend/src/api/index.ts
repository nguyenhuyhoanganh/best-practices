import axios from 'axios';
import client from './client';
import type {
  BestPractice,
  BestPracticeListItem,
  BestPracticeRequest,
  Analytics,
  BpReview,
  Feedback,
  PagedResponse,
  DashboardStats,
  AiInsightClassification,
  Job,
  AiCapability,
  WorkCategory,
  Work,
  User,
} from '../types';

// Separate instance for /auth/* endpoints (not under /api prefix)
const authClient = axios.create({ withCredentials: true });

// Auth — calls /auth/* (proxied by Vite to BE directly, no /api prefix)
export const authApi = {
  refresh: () => authClient.post<{ access_token: string }>('/auth/refresh'),
  logout: () => authClient.post('/auth/logout'),
  me: () => authClient.get<User>('/auth/me'),
};

// Best Practices — under /api/v1/
export const bpApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PagedResponse<BestPracticeListItem>>('/v1/best-practices', { params }),
  get: (id: string) => client.get<BestPractice>(`/v1/best-practices/${id}`),
  create: (data: BestPracticeRequest) => client.post<BestPractice>('/v1/best-practices', data),
  update: (id: string, data: Partial<BestPracticeRequest>) =>
    client.put<BestPractice>(`/v1/best-practices/${id}`, data),
  delete: (id: string) => client.delete(`/v1/best-practices/${id}`),
  like: (id: string) => client.post(`/v1/best-practices/${id}/like`),
  unlike: (id: string) => client.delete(`/v1/best-practices/${id}/like`),
  download: (id: string, fileId: string) =>
    client.get(`/v1/best-practices/${id}/files/${fileId}`, { responseType: 'blob' }),
  uploadFile: (id: string, formData: FormData) =>
    client.post(`/v1/best-practices/${id}/files`, formData),
  deleteFile: (id: string, fileId: string) =>
    client.delete(`/v1/best-practices/${id}/files/${fileId}`),
};

// Feedback
export const feedbackApi = {
  list: (bpId: string) => client.get<Feedback[]>(`/v1/best-practices/${bpId}/feedback`),
  create: (bpId: string, content: string) =>
    client.post<Feedback>(`/v1/best-practices/${bpId}/feedback`, { content }),
  delete: (bpId: string, feedbackId: string) =>
    client.delete(`/v1/best-practices/${bpId}/feedback/${feedbackId}`),
};

// Analytics
export const analyticsApi = {
  get: (bpId: string) => client.get<Analytics>(`/v1/best-practices/${bpId}/analytics`),
};

// Management (reviewer actions)
export const managementApi = {
  queue: (params?: Record<string, unknown>) =>
    client.get<PagedResponse<BestPracticeListItem>>('/v1/management/queue', { params }),
  review: (bpId: string, data: { action: BpReview['action']; comment?: string }) =>
    client.post<BpReview>(`/v1/management/best-practices/${bpId}/review`, data),
  close: (bpId: string, reason: string) =>
    client.post(`/v1/management/best-practices/${bpId}/close`, { reason }),
};

// Dashboard
export const dashboardApi = {
  stats: () => client.get<DashboardStats>('/v1/dashboard/stats'),
};

// AI Insight
export const aiInsightApi = {
  classify: (bpId: string) =>
    client.get<AiInsightClassification>(`/v1/ai-insight/best-practices/${bpId}/classification`),
};

// Lookup / Reference data (public)
export const lookupApi = {
  jobs: () => client.get<Job[]>('/v1/jobs'),
  aiCapabilities: () => client.get<AiCapability[]>('/v1/ai-capabilities'),
  workCategories: () => client.get<WorkCategory[]>('/v1/work-categories'),
  works: (workCategoryId?: string) =>
    client.get<Work[]>('/v1/works', {
      params: workCategoryId ? { workCategoryId } : undefined,
    }),
};

// Master data admin CRUD
export const masterDataApi = {
  jobs: {
    list: () => client.get<Job[]>('/v1/admin/master-data/jobs'),
    create: (data: { name: string; description?: string }) =>
      client.post<Job>('/v1/admin/master-data/jobs', data),
    update: (id: string, data: { name: string; description?: string }) =>
      client.put<Job>(`/v1/admin/master-data/jobs/${id}`, data),
    delete: (id: string) => client.delete(`/v1/admin/master-data/jobs/${id}`),
  },
  workCategories: {
    list: (jobId?: string) =>
      client.get('/v1/admin/master-data/work-categories', {
        params: jobId ? { jobId } : undefined,
      }),
    create: (data: { job_id: string; name: string; description?: string }) =>
      client.post('/v1/admin/master-data/work-categories', data),
    update: (id: string, data: { name: string; description?: string }) =>
      client.put(`/v1/admin/master-data/work-categories/${id}`, data),
    delete: (id: string) => client.delete(`/v1/admin/master-data/work-categories/${id}`),
  },
  works: {
    list: (workCategoryId?: string) =>
      client.get('/v1/admin/master-data/works', {
        params: workCategoryId ? { workCategoryId } : undefined,
      }),
    create: (data: {
      job_id: string;
      work_category_id: string;
      name: string;
      code: string;
      description?: string;
    }) => client.post('/v1/admin/master-data/works', data),
    update: (id: string, data: { name: string; code: string; description?: string }) =>
      client.put(`/v1/admin/master-data/works/${id}`, data),
    delete: (id: string) => client.delete(`/v1/admin/master-data/works/${id}`),
  },
  aiCapabilities: {
    list: () => client.get<AiCapability[]>('/v1/admin/master-data/ai-capabilities'),
    create: (data: { name: string; is_default?: boolean }) =>
      client.post<AiCapability>('/v1/admin/master-data/ai-capabilities', data),
    update: (id: string, data: { name: string }) =>
      client.put<AiCapability>(`/v1/admin/master-data/ai-capabilities/${id}`, data),
    delete: (id: string) => client.delete(`/v1/admin/master-data/ai-capabilities/${id}`),
  },
};

// Admin — user management
export const userApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PagedResponse<User>>('/v1/admin/users', { params }),
  updateRole: (userId: string, role: User['role']) =>
    client.put(`/v1/admin/users/${userId}/role`, { role }),
};
