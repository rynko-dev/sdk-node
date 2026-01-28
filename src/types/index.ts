/**
 * Rynko SDK Types
 */

// ============================================
// Configuration Types
// ============================================

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 5) */
  maxAttempts?: number;
  /** Initial delay between retries in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay between retries in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Maximum jitter to add to delay in milliseconds (default: 1000) */
  maxJitterMs?: number;
  /** HTTP status codes that should trigger a retry (default: [429, 503, 504]) */
  retryableStatuses?: number[];
}

export interface RynkoConfig {
  /** API Key for authentication */
  apiKey: string;
  /** Base URL for the API (default: https://api.rynko.dev) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Retry configuration for failed requests */
  retry?: RetryConfig | false;
}

// ============================================
// Document Types
// ============================================

export interface GenerateDocumentOptions {
  /** Template ID to use */
  templateId: string;
  /** Output format */
  format: 'pdf' | 'excel' | 'csv';
  /** Template variables for content generation */
  variables?: Record<string, unknown>;
  /** Custom filename (without extension) */
  filename?: string;
  /** Webhook URL to receive completion notification */
  webhookUrl?: string;
  /** Custom metadata to pass through to webhook */
  metadata?: Record<string, unknown>;
  /** Use draft version instead of published version (for testing) */
  useDraft?: boolean;
  /** Force use of purchased credits instead of free quota */
  useCredit?: boolean;
}

export interface GenerateBatchOptions {
  /** Template ID to use */
  templateId: string;
  /** Output format */
  format: 'pdf' | 'excel' | 'csv';
  /** List of variable sets (one per document) - each object contains the variables for that document */
  documents: Record<string, unknown>[];
  /** Webhook URL to receive batch completion notification */
  webhookUrl?: string;
  /** Custom metadata for the batch */
  metadata?: Record<string, unknown>;
  /** Use draft version instead of published version (for testing) */
  useDraft?: boolean;
  /** Force use of purchased credits instead of free quota */
  useCredit?: boolean;
}

/**
 * Response from document generation request.
 * Note: This is an async operation - the document is queued for generation.
 * Use `waitForCompletion()` or poll `getJob()` to get the downloadUrl once ready.
 */
export interface GenerateDocumentResponse {
  /** Job ID for tracking */
  jobId: string;
  /** Job status (will be 'queued' for new requests) */
  status: DocumentJobStatus;
  /** URL to check job status */
  statusUrl: string;
  /** Estimated wait time in seconds */
  estimatedWaitSeconds: number;
}

/**
 * Response from batch document generation request.
 * Note: This is an async operation - documents are queued for generation.
 * Use `getBatch()` to poll for completion status.
 */
export interface GenerateBatchResponse {
  /** Batch ID for tracking */
  batchId: string;
  /** Batch status (will be 'queued' for new requests) */
  status: string;
  /** Total jobs in batch */
  totalJobs: number;
  /** URL to check batch status */
  statusUrl: string;
  /** Estimated wait time in seconds */
  estimatedWaitSeconds: number;
}

export interface DocumentJob {
  /** Job ID */
  jobId: string;
  /** Job status */
  status: DocumentJobStatus;
  /** Output format */
  format: 'pdf' | 'excel' | 'csv';
  /** Template ID used */
  templateId: string;
  /** Template name */
  templateName?: string;
  /** Custom filename */
  filename?: string;
  /** Signed download URL (available when completed) */
  downloadUrl?: string;
  /** When download URL expires */
  downloadUrlExpiresAt?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Error message (if failed) */
  errorMessage?: string;
  /** Error code (if failed) */
  errorCode?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Whether a webhook was configured for this job */
  hasWebhook?: boolean;
  /** Whether webhook was successfully delivered */
  webhookSent?: boolean;
  /** Webhook delivery error if failed */
  webhookError?: string;
  /** Created timestamp */
  createdAt: string;
  /** When processing started */
  processingAt?: string;
  /** Completed timestamp */
  completedAt?: string;
  /** When file expires from storage */
  expiresAt?: string;
}

export type DocumentJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ListDocumentJobsOptions {
  /** Filter by status */
  status?: DocumentJobStatus;
  /** Filter by format */
  format?: 'pdf' | 'excel' | 'csv';
  /** Filter by template ID */
  templateId?: string;
  /** Filter by workspace ID */
  workspaceId?: string;
  /** Filter by date range start */
  dateFrom?: string | Date;
  /** Filter by date range end */
  dateTo?: string | Date;
  /** Number of results per page (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
  /** Offset for pagination */
  offset?: number;
}

// ============================================
// Template Types
// ============================================

export interface Template {
  id: string;
  name: string;
  type: 'pdf' | 'excel';
  description?: string;
  variables?: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
}

export interface ListTemplatesOptions {
  /** Number of results per page (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
  /** Search by template name */
  search?: string;
}

// ============================================
// Webhook Types
// ============================================

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  description?: string;
  isActive: boolean;
  secret?: string;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEventType =
  | 'document.generated'
  | 'document.failed'
  | 'document.downloaded';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

// ============================================
// Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  teamId?: string;
  teamName?: string;
  workspaceId?: string;
  workspaceName?: string;
}
