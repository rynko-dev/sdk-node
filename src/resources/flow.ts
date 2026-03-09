/**
 * Flow Resource
 */

import type { HttpClient } from '../utils/http';
import type { PaginationMeta } from '../types';
import type {
  FlowGate,
  FlowRun,
  FlowApproval,
  FlowDelivery,
  FlowRunStatus,
  ListGatesOptions,
  SubmitRunOptions,
  SubmitRunResponse,
  ListRunsOptions,
  WaitForRunOptions,
  ListApprovalsOptions,
  ApproveOptions,
  RejectOptions,
  ListDeliveriesOptions,
  FLOW_RUN_TERMINAL_STATUSES,
} from '../types/flow';

const TERMINAL_STATUSES: FlowRunStatus[] = [
  'completed',
  'delivered',
  'approved',
  'rejected',
  'validation_failed',
  'render_failed',
  'delivery_failed',
];

export class FlowResource {
  constructor(private http: HttpClient) {}

  // ============================================
  // Gates (read-only)
  // ============================================

  /**
   * List all gates
   *
   * @example
   * ```typescript
   * const { data, meta } = await rynko.flow.listGates();
   * for (const gate of data) {
   *   console.log(gate.name, gate.status);
   * }
   * ```
   */
  async listGates(
    options: ListGatesOptions = {}
  ): Promise<{ data: FlowGate[]; meta: PaginationMeta }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    const response = await this.http.get<{ data: FlowGate[]; total: number }>(
      '/api/flow/gates',
      {
        limit,
        page,
        status: options.status,
      }
    );

    const gates = response.data ?? (response as any).gates ?? [];
    const total = response.total ?? (response as any).meta?.total ?? gates.length;

    return {
      data: gates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a gate by ID
   *
   * @example
   * ```typescript
   * const gate = await rynko.flow.getGate('gate_abc123');
   * console.log(gate.name, gate.status);
   * ```
   */
  async getGate(gateId: string): Promise<FlowGate> {
    return this.http.get<FlowGate>(`/api/flow/gates/${gateId}`);
  }

  // ============================================
  // Runs
  // ============================================

  /**
   * Submit a run to a gate for validation
   *
   * @example
   * ```typescript
   * const run = await rynko.flow.submitRun('gate_abc123', {
   *   input: {
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *     amount: 150.00,
   *   },
   *   metadata: { source: 'checkout' },
   * });
   * console.log('Run ID:', run.id);
   *
   * // Wait for validation result
   * const result = await rynko.flow.waitForRun(run.id);
   * console.log('Status:', result.status);
   * ```
   */
  async submitRun(
    gateId: string,
    options: SubmitRunOptions
  ): Promise<SubmitRunResponse> {
    const { input, ...rest } = options;
    return this.http.post<SubmitRunResponse>(
      `/api/flow/gates/${gateId}/runs`,
      { payload: input, ...rest }
    );
  }

  /**
   * Get a run by ID
   *
   * @example
   * ```typescript
   * const run = await rynko.flow.getRun('run_abc123');
   * console.log('Status:', run.status);
   * if (run.errors) {
   *   console.log('Validation errors:', run.errors);
   * }
   * ```
   */
  async getRun(runId: string): Promise<FlowRun> {
    return this.http.get<FlowRun>(`/api/flow/runs/${runId}`);
  }

  /**
   * List all runs
   *
   * @example
   * ```typescript
   * const { data, meta } = await rynko.flow.listRuns({ status: 'approved' });
   * console.log(`Found ${meta.total} approved runs`);
   * ```
   */
  async listRuns(
    options: ListRunsOptions = {}
  ): Promise<{ data: FlowRun[]; meta: PaginationMeta }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    const response = await this.http.get<{ data: FlowRun[]; total: number }>(
      '/api/flow/runs',
      {
        limit,
        page,
        status: options.status,
      }
    );

    const runs = response.data ?? (response as any).runs ?? [];
    const total = response.total ?? (response as any).meta?.total ?? runs.length;

    return {
      data: runs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List runs for a specific gate
   *
   * @example
   * ```typescript
   * const { data } = await rynko.flow.listRunsByGate('gate_abc123');
   * ```
   */
  async listRunsByGate(
    gateId: string,
    options: ListRunsOptions = {}
  ): Promise<{ data: FlowRun[]; meta: PaginationMeta }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    const response = await this.http.get<{ data: FlowRun[]; total: number }>(
      `/api/flow/gates/${gateId}/runs`,
      {
        limit,
        page,
        status: options.status,
      }
    );

    const runs = response.data ?? (response as any).runs ?? [];
    const total = response.total ?? (response as any).meta?.total ?? runs.length;

    return {
      data: runs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List active (non-terminal) runs
   *
   * @example
   * ```typescript
   * const { data } = await rynko.flow.listActiveRuns();
   * console.log(`${data.length} runs in progress`);
   * ```
   */
  async listActiveRuns(
    options: Omit<ListRunsOptions, 'status'> = {}
  ): Promise<{ data: FlowRun[]; meta: PaginationMeta }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    const response = await this.http.get<{ data: FlowRun[]; total: number }>(
      '/api/flow/runs/active',
      { limit, page }
    );

    const runs = response.data ?? (response as any).runs ?? [];
    const total = response.total ?? (response as any).meta?.total ?? runs.length;

    return {
      data: runs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Wait for a run to reach a terminal state
   *
   * @example
   * ```typescript
   * const run = await rynko.flow.submitRun('gate_abc123', {
   *   input: { name: 'John' },
   * });
   *
   * const result = await rynko.flow.waitForRun(run.id, {
   *   pollInterval: 2000,
   *   timeout: 120000,
   * });
   *
   * if (result.status === 'approved') {
   *   console.log('Run approved!', result.output);
   * } else if (result.status === 'rejected') {
   *   console.log('Run rejected:', result.errors);
   * }
   * ```
   */
  async waitForRun(
    runId: string,
    options: WaitForRunOptions = {}
  ): Promise<FlowRun> {
    const pollInterval = options.pollInterval ?? 1000;
    const timeout = options.timeout ?? 60000;
    const startTime = Date.now();

    while (true) {
      const run = await this.getRun(runId);

      if (TERMINAL_STATUSES.includes(run.status)) {
        return run;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for run ${runId} to complete`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  // ============================================
  // Approvals
  // ============================================

  /**
   * List approvals
   *
   * @example
   * ```typescript
   * const { data } = await rynko.flow.listApprovals({ status: 'pending' });
   * for (const approval of data) {
   *   console.log(`Approval ${approval.id} for run ${approval.runId}`);
   * }
   * ```
   */
  async listApprovals(
    options: ListApprovalsOptions = {}
  ): Promise<{ data: FlowApproval[]; meta: PaginationMeta }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    const response = await this.http.get<{ data: FlowApproval[]; total: number }>(
      '/api/flow/approvals',
      {
        limit,
        page,
        status: options.status,
      }
    );

    const approvals = response.data ?? (response as any).approvals ?? [];
    const total = response.total ?? (response as any).meta?.total ?? approvals.length;

    return {
      data: approvals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve a pending approval
   *
   * @example
   * ```typescript
   * const approval = await rynko.flow.approve('approval_abc123', {
   *   note: 'Looks good, approved.',
   * });
   * ```
   */
  async approve(
    approvalId: string,
    options: ApproveOptions = {}
  ): Promise<FlowApproval> {
    return this.http.post<FlowApproval>(
      `/api/flow/approvals/${approvalId}/approve`,
      options
    );
  }

  /**
   * Reject a pending approval
   *
   * @example
   * ```typescript
   * const approval = await rynko.flow.reject('approval_abc123', {
   *   reason: 'Invalid data in the amount field.',
   * });
   * ```
   */
  async reject(
    approvalId: string,
    options: RejectOptions = {}
  ): Promise<FlowApproval> {
    return this.http.post<FlowApproval>(
      `/api/flow/approvals/${approvalId}/reject`,
      options
    );
  }

  /**
   * Resend approval notification emails for a run
   *
   * Re-sends approval request emails to all pending approvers for a run
   * that is in `review_required` status.
   *
   * @example
   * ```typescript
   * const result = await rynko.flow.resendApprovalEmail('run_abc123');
   * console.log(`Sent ${result.sentCount} of ${result.totalApprovers} emails`);
   * ```
   */
  async resendApprovalEmail(
    runId: string
  ): Promise<{ success: boolean; sentCount: number; totalApprovers: number }> {
    return this.http.post<{ success: boolean; sentCount: number; totalApprovers: number }>(
      `/api/flow/approvals/resend/${runId}`,
      {}
    );
  }

  // ============================================
  // Deliveries
  // ============================================

  /**
   * List deliveries for a run
   *
   * @example
   * ```typescript
   * const { data } = await rynko.flow.listDeliveries('run_abc123');
   * for (const delivery of data) {
   *   console.log(`${delivery.status} - ${delivery.url}`);
   * }
   * ```
   */
  async listDeliveries(
    runId: string,
    options: ListDeliveriesOptions = {}
  ): Promise<{ data: FlowDelivery[]; meta: PaginationMeta }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    const response = await this.http.get<{ data: FlowDelivery[]; total: number }>(
      `/api/flow/runs/${runId}/deliveries`,
      { limit, page }
    );

    const deliveries = response.data ?? (response as any).deliveries ?? [];
    const total = response.total ?? (response as any).meta?.total ?? deliveries.length;

    return {
      data: deliveries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retry a failed delivery
   *
   * @example
   * ```typescript
   * const delivery = await rynko.flow.retryDelivery('delivery_abc123');
   * console.log('Retry status:', delivery.status);
   * ```
   */
  async retryDelivery(deliveryId: string): Promise<FlowDelivery> {
    return this.http.post<FlowDelivery>(
      `/api/flow/deliveries/${deliveryId}/retry`,
      {}
    );
  }
}
