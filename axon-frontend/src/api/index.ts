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
  TokenResponse,
} from '../types';

// Auth
export const authApi = {
  refresh: () => client.post<{ access_token: string }>('/auth/refresh'),
  logout: () => client.post('/auth/logout'),
  me: () => client.get<User>('/auth/me'),
};

// Best Practices
export const bpApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PagedResponse<BestPracticeListItem>>('/best-practices', { params }),
  get: (id: string) => client.get<BestPractice>(`/best-practices/${id}`),
  create: (data: BestPracticeRequest) => client.post<BestPractice>('/best-practices', data),
  update: (id: string, data: Partial<BestPracticeRequest>) =>
    client.put<BestPractice>(`/best-practices/${id}`, data),
  delete: (id: string) => client.delete(`/best-practices/${id}`),
  like: (id: string) => client.post(`/best-practices/${id}/like`),
  unlike: (id: string) => client.delete(`/best-practices/${id}/like`),
  download: (id: string, fileId: string) =>
    client.get(`/best-practices/${id}/files/${fileId}`, { responseType: 'blob' }),
  uploadFile: (id: string, formData: FormData) =>
    client.post(`/best-practices/${id}/files`, formData),
  deleteFile: (id: string, fileId: string) =>
    client.delete(`/best-practices/${id}/files/${fileId}`),
};

// Feedback
export const feedbackApi = {
  list: (bpId: string) => client.get<Feedback[]>(`/best-practices/${bpId}/feedback`),
  create: (bpId: string, content: string) =>
    client.post<Feedback>(`/best-practices/${bpId}/feedback`, { content }),
  delete: (bpId: string, feedbackId: string) =>
    client.delete(`/best-practices/${bpId}/feedback/${feedbackId}`),
};

// Analytics
export const analyticsApi = {
  get: (bpId: string) => client.get<Analytics>(`/best-practices/${bpId}/analytics`),
};

// Management (reviewer actions)
export const managementApi = {
  queue: (params?: Record<string, unknown>) =>
    client.get<PagedResponse<BestPracticeListItem>>('/management/queue', { params }),
  review: (bpId: string, data: { action: BpReview['action']; comment?: string }) =>
    client.post<BpReview>(`/management/best-practices/${bpId}/review`, data),
  close: (bpId: string, reason: string) =>
    client.post(`/management/best-practices/${bpId}/close`, { reason }),
};

// Dashboard
export const dashboardApi = {
  stats: () => client.get<DashboardStats>('/dashboard/stats'),
};

// AI Insight
export const aiInsightApi = {
  classify: (bpId: string) =>
    client.get<AiInsightClassification>(`/ai-insight/best-practices/${bpId}/classification`),
};

// Lookup / Master data
export const lookupApi = {
  jobs: () => client.get<Job[]>('/lookup/jobs'),
  aiCapabilities: () => client.get<AiCapability[]>('/lookup/ai-capabilities'),
  workCategories: () => client.get<WorkCategory[]>('/lookup/work-categories'),
  works: (categoryId?: string) =>
    client.get<Work[]>('/lookup/works', { params: categoryId ? { category_id: categoryId } : undefined }),
};

// Admin — user management
export const userApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PagedResponse<User>>('/admin/users', { params }),
  updateRole: (userId: string, role: User['role']) =>
    client.put(`/admin/users/${userId}/role`, { role }),
};

// Token response helper (used after SSO callback)
export const handleAuthCallback = (data: TokenResponse) => {
  import('../store/authStore').then(({ useAuthStore }) => {
    useAuthStore.getState().login(data.access_token, data.user);
  });
};
