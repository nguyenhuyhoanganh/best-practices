// Full types per DLD §5.1 + additional types for reviews, dashboard, AI insight
export type BPType = 'WEB' | 'TOOL' | 'EXTENSION';
export type BPStatus = 'REQUESTED' | 'REJECTED' | 'PUBLISHED';
export type UserRole = 'USER' | 'AX_CREATOR' | 'AX_SUPPORTER' | 'ADMIN';
export type ReviewAction = 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
}

export interface Job {
  id: string;
  name: string;
  display_order?: number;
}

export interface AiCapability {
  id: string;
  name: string;
  is_default?: boolean;
}

export interface WorkCategory {
  id: string;
  name: string;
}

export interface Work {
  id: string;
  name: string;
  code: string;
  work_category: WorkCategory;
}

export interface BpFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface BestPracticeListItem {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  type: BPType;
  status: BPStatus;
  job: Job[];
  work?: Work;
  creators: Pick<User, 'id' | 'name' | 'avatar_url'>[];
  like_count: number;
  view_count: number;
  download_count: number;
  is_liked_by_current_user: boolean;
  published_at?: string;
}

export interface BestPractice extends BestPracticeListItem {
  installation_guide?: string;
  web_content?: string;
  key_value?: string;
  ai_capability: AiCapability[];
  ai_tools_description?: string;
  close_reason?: string;
  files: BpFile[];
  created_at: string;
}

export interface BestPracticeRequest {
  name: string;
  description: string;
  thumbnail_url?: string;
  installation_guide?: string;
  type: BPType;
  web_content?: string;
  key_value?: string;
  ai_tools_description?: string;
  work_id?: string;
  job_ids: string[];
  ai_capability_ids: string[];
  creator_ids: string[];
}

export interface Feedback {
  id: string;
  content: string;
  user: Pick<User, 'id' | 'name' | 'avatar_url'>;
  created_at: string;
}

export interface BpReview {
  id: string;
  action: ReviewAction;
  comment?: string;
  reviewer: Pick<User, 'id' | 'name'>;
  reviewed_at: string;
}

export interface Analytics {
  view_count: number;
  download_count: number;
  like_count: number;
  feedback_count: number;
  recent_feedback: Feedback[];
  downloads_by_week: { week: string; count: number }[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export interface DashboardStats {
  total_submitters: number;
  total_published_bps: number;
  by_job: { job: Job; count: number }[];
  by_ai_capability: { capability: AiCapability; count: number }[];
  by_department: { department: string; count: number }[];
  top5_bps_by_work: { work: Work; bp_count: number }[];
  total_usage: number;
  active_users: number;
  usage_trend: { month: string; count: number }[];
  top5_usage: { bp: Pick<BestPracticeListItem, 'id' | 'name'>; usage_count: number }[];
}

export interface AiInsightClassification {
  name: string;
  description: string;
  embodiments: string[];
  scope: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}
