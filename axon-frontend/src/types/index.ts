export type BPType = 'SKILL_SET' | 'MCP_CONFIG' | 'RULE_SET' | 'AGENT_WORKFLOW';
export type BPStatus = 'DRAFT' | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface ExternalLink {
  label: string;
  url: string;
}

export interface BestPracticeFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface BestPracticeListItem {
  id: string;
  title: string;
  description: string;
  type: BPType;
  status: BPStatus;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  usageScore: number;
  viewCount: number;
  downloadCount: number;
  publishedAt?: string;
}

export interface BestPractice extends BestPracticeListItem {
  usageGuide?: string;
  installGuide?: string;
  externalLinks: ExternalLink[];
  agentWorkflowId?: string;
  files: BestPracticeFile[];
  createdAt: string;
}

export interface BestPracticeRequest {
  title: string;
  description: string;
  type: BPType;
  usageGuide?: string;
  installGuide?: string;
  externalLinks: ExternalLink[];
  agentWorkflowId?: string;
  tags: string[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
}
