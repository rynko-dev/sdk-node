/**
 * Rynko Flow Types
 */

// ============================================
// Flow Run Status
// ============================================

export type FlowRunStatus =
  | 'validating'
  | 'validated'
  | 'rendering'
  | 'rendered'
  | 'pending_approval'
  | 'approved'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'validation_failed'
  | 'render_failed'
  | 'rejected'
  | 'delivery_failed';

/** Terminal statuses for waitForRun polling */
export const FLOW_RUN_TERMINAL_STATUSES: FlowRunStatus[] = [
  'validated',
  'completed',
  'delivered',
  'approved',
  'rejected',
  'validation_failed',
  'render_failed',
  'delivery_failed',
];

// ============================================
// Gate Types
// ============================================

export interface FlowGate {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  schemaVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListGatesOptions {
  /** Number of results per page (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
  /** Filter by gate status */
  status?: 'draft' | 'published' | 'archived';
}

// ============================================
// Run Types
// ============================================

export interface FlowRun {
  id: string;
  gateId: string;
  status: FlowRunStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  errors?: FlowValidationError[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface FlowValidationError {
  field?: string;
  rule?: string;
  message: string;
}

export interface SubmitRunOptions {
  /** Input data to validate against the gate schema */
  input: Record<string, unknown>;
  /** Optional metadata for tracking */
  metadata?: Record<string, unknown>;
  /** Webhook URL for run completion notification */
  webhookUrl?: string;
}

export interface SubmitRunResponse {
  /** Run ID (mapped from `runId` in API response) */
  id: string;
  /** Short ID for the run */
  shortId?: string;
  /** Run status */
  status: FlowRunStatus;
  /** Whether validation passed */
  success: boolean;
  /** Validation layer results */
  layers?: {
    schema?: 'pass' | 'fail' | 'skip';
    business_rules?: 'pass' | 'fail' | 'skip';
  };
  /** Error details (present when validation fails) */
  error?: {
    code?: string;
    message?: string;
    layer?: string;
    details?: Array<{
      message: string;
      code?: string;
      rule_id?: string;
      context?: Record<string, unknown>;
    }>;
  };
}

export interface ListRunsOptions {
  /** Number of results per page (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
  /** Filter by run status */
  status?: FlowRunStatus;
}

export interface WaitForRunOptions {
  /** Poll interval in milliseconds (default: 1000) */
  pollInterval?: number;
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
}

// ============================================
// Approval Types
// ============================================

export interface FlowApproval {
  id: string;
  runId: string;
  gateId: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerEmail?: string;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ListApprovalsOptions {
  /** Number of results per page (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
  /** Filter by approval status */
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ApproveOptions {
  /** Optional note from the reviewer */
  note?: string;
}

export interface RejectOptions {
  /** Optional reason for rejection */
  reason?: string;
}

// ============================================
// Delivery Types
// ============================================

export interface FlowDelivery {
  id: string;
  runId: string;
  status: 'pending' | 'delivered' | 'failed';
  url?: string;
  httpStatus?: number;
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
  createdAt: string;
}

export interface ListDeliveriesOptions {
  /** Number of results per page (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
}
