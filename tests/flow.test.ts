/**
 * Flow Unit Tests
 *
 * Tests for Flow type definitions and constants.
 * These tests don't require a live API.
 */

import {
  FLOW_RUN_TERMINAL_STATUSES,
  type FlowRunStatus,
  type FlowGate,
  type FlowRun,
  type FlowApproval,
  type FlowDelivery,
  type FlowValidationError,
  type SubmitRunOptions,
  type SubmitRunResponse,
  type WaitForRunOptions,
  type ListGatesOptions,
  type ListRunsOptions,
  type ListApprovalsOptions,
  type ListDeliveriesOptions,
  type ApproveOptions,
  type RejectOptions,
} from '../src';

describe('Flow Run Status', () => {
  it('should accept all valid status values', () => {
    const statuses: FlowRunStatus[] = [
      'pending',
      'validating',
      'approved',
      'rejected',
      'review_required',
      'completed',
      'delivered',
      'validation_failed',
      'render_failed',
      'delivery_failed',
    ];
    expect(statuses).toHaveLength(10);
  });

  it('should export FLOW_RUN_TERMINAL_STATUSES as an array', () => {
    expect(Array.isArray(FLOW_RUN_TERMINAL_STATUSES)).toBe(true);
  });

  it('should include approved in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('approved');
  });

  it('should include rejected in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('rejected');
  });

  it('should include completed in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('completed');
  });

  it('should include delivered in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('delivered');
  });

  it('should include validation_failed in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('validation_failed');
  });

  it('should include render_failed in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('render_failed');
  });

  it('should include delivery_failed in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).toContain('delivery_failed');
  });

  it('should not include pending in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).not.toContain('pending');
  });

  it('should not include validating in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).not.toContain('validating');
  });

  it('should not include review_required in terminal statuses', () => {
    expect(FLOW_RUN_TERMINAL_STATUSES).not.toContain('review_required');
  });
});

describe('Gates', () => {
  describe('FlowGate', () => {
    it('should accept a valid gate object with required fields', () => {
      const gate: FlowGate = {
        id: 'gate_abc123',
        name: 'Invoice Validator',
        status: 'published',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      expect(gate.id).toBe('gate_abc123');
      expect(gate.name).toBe('Invoice Validator');
      expect(gate.status).toBe('published');
    });

    it('should accept a gate with all optional fields', () => {
      const gate: FlowGate = {
        id: 'gate_def456',
        name: 'Order Validator',
        slug: 'order-validator',
        description: 'Validates incoming order data',
        status: 'draft',
        schemaVersion: 3,
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-12T14:30:00Z',
      };

      expect(gate.slug).toBe('order-validator');
      expect(gate.description).toBe('Validates incoming order data');
      expect(gate.schemaVersion).toBe(3);
    });

    it('should accept all valid gate statuses', () => {
      const draft: FlowGate = { id: '1', name: 'A', status: 'draft', createdAt: '', updatedAt: '' };
      const published: FlowGate = { id: '2', name: 'B', status: 'published', createdAt: '', updatedAt: '' };
      const archived: FlowGate = { id: '3', name: 'C', status: 'archived', createdAt: '', updatedAt: '' };

      expect(draft.status).toBe('draft');
      expect(published.status).toBe('published');
      expect(archived.status).toBe('archived');
    });
  });

  describe('ListGatesOptions', () => {
    it('should accept an empty options object', () => {
      const options: ListGatesOptions = {};
      expect(options.limit).toBeUndefined();
      expect(options.page).toBeUndefined();
      expect(options.status).toBeUndefined();
    });

    it('should accept all filter options', () => {
      const options: ListGatesOptions = {
        limit: 50,
        page: 2,
        status: 'published',
      };

      expect(options.limit).toBe(50);
      expect(options.page).toBe(2);
      expect(options.status).toBe('published');
    });
  });
});

describe('Runs', () => {
  describe('FlowRun', () => {
    it('should accept a run with required fields', () => {
      const run: FlowRun = {
        id: 'run_abc123',
        gateId: 'gate_def456',
        status: 'pending',
        input: { name: 'John Doe', email: 'john@example.com' },
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z',
      };

      expect(run.id).toBe('run_abc123');
      expect(run.gateId).toBe('gate_def456');
      expect(run.status).toBe('pending');
      expect(run.input.name).toBe('John Doe');
    });

    it('should accept a run with all optional fields', () => {
      const run: FlowRun = {
        id: 'run_xyz789',
        gateId: 'gate_abc123',
        status: 'approved',
        input: { amount: 150.0 },
        output: { validated: true, normalizedAmount: 150.0 },
        errors: [],
        metadata: { source: 'checkout', orderId: 'ord_001' },
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:01:00Z',
        completedAt: '2026-02-01T09:01:00Z',
      };

      expect(run.output?.validated).toBe(true);
      expect(run.metadata?.source).toBe('checkout');
      expect(run.completedAt).toBeDefined();
    });

    it('should accept a rejected run with validation errors', () => {
      const run: FlowRun = {
        id: 'run_fail',
        gateId: 'gate_abc123',
        status: 'rejected',
        input: { amount: -5 },
        errors: [
          { field: 'amount', rule: 'min', message: 'Amount must be positive' },
          { message: 'General validation failure' },
        ],
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:00:05Z',
      };

      expect(run.errors).toHaveLength(2);
      expect(run.errors![0].field).toBe('amount');
      expect(run.errors![1].message).toBe('General validation failure');
    });
  });

  describe('FlowValidationError', () => {
    it('should accept an error with only the required message field', () => {
      const error: FlowValidationError = {
        message: 'Something went wrong',
      };

      expect(error.message).toBe('Something went wrong');
      expect(error.field).toBeUndefined();
      expect(error.rule).toBeUndefined();
    });

    it('should accept an error with all fields', () => {
      const error: FlowValidationError = {
        field: 'email',
        rule: 'format',
        message: 'Invalid email format',
      };

      expect(error.field).toBe('email');
      expect(error.rule).toBe('format');
      expect(error.message).toBe('Invalid email format');
    });
  });

  describe('SubmitRunOptions', () => {
    it('should accept options with only required input', () => {
      const options: SubmitRunOptions = {
        input: { name: 'Test', value: 42 },
      };

      expect(options.input.name).toBe('Test');
      expect(options.metadata).toBeUndefined();
      expect(options.webhookUrl).toBeUndefined();
    });

    it('should accept options with all optional fields', () => {
      const options: SubmitRunOptions = {
        input: { name: 'Test' },
        metadata: { correlationId: 'corr_001', source: 'api' },
        webhookUrl: 'https://example.com/webhook',
      };

      expect(options.metadata?.correlationId).toBe('corr_001');
      expect(options.webhookUrl).toBe('https://example.com/webhook');
    });
  });

  describe('SubmitRunResponse', () => {
    it('should accept a valid submit response', () => {
      const response: SubmitRunResponse = {
        id: 'run_new123',
        status: 'pending',
        gateId: 'gate_abc',
        createdAt: '2026-02-01T09:00:00Z',
      };

      expect(response.id).toBe('run_new123');
      expect(response.status).toBe('pending');
      expect(response.gateId).toBe('gate_abc');
    });
  });

  describe('WaitForRunOptions', () => {
    it('should accept an empty options object for defaults', () => {
      const options: WaitForRunOptions = {};
      expect(options.pollInterval).toBeUndefined();
      expect(options.timeout).toBeUndefined();
    });

    it('should accept custom poll interval and timeout', () => {
      const options: WaitForRunOptions = {
        pollInterval: 2000,
        timeout: 120000,
      };

      expect(options.pollInterval).toBe(2000);
      expect(options.timeout).toBe(120000);
    });
  });

  describe('ListRunsOptions', () => {
    it('should accept an empty options object', () => {
      const options: ListRunsOptions = {};
      expect(options.limit).toBeUndefined();
    });

    it('should accept all filter options', () => {
      const options: ListRunsOptions = {
        limit: 10,
        page: 3,
        status: 'approved',
      };

      expect(options.limit).toBe(10);
      expect(options.page).toBe(3);
      expect(options.status).toBe('approved');
    });
  });
});

describe('Approvals', () => {
  describe('FlowApproval', () => {
    it('should accept a pending approval with required fields', () => {
      const approval: FlowApproval = {
        id: 'approval_abc123',
        runId: 'run_def456',
        gateId: 'gate_ghi789',
        status: 'pending',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z',
      };

      expect(approval.id).toBe('approval_abc123');
      expect(approval.runId).toBe('run_def456');
      expect(approval.status).toBe('pending');
    });

    it('should accept an approved approval with all optional fields', () => {
      const approval: FlowApproval = {
        id: 'approval_xyz',
        runId: 'run_abc',
        gateId: 'gate_def',
        status: 'approved',
        reviewerEmail: 'reviewer@example.com',
        reviewerNote: 'Data looks correct, approved.',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:05:00Z',
        resolvedAt: '2026-02-01T09:05:00Z',
      };

      expect(approval.reviewerEmail).toBe('reviewer@example.com');
      expect(approval.reviewerNote).toBe('Data looks correct, approved.');
      expect(approval.resolvedAt).toBeDefined();
    });

    it('should accept all valid approval statuses', () => {
      const pending: FlowApproval = { id: '1', runId: 'r1', gateId: 'g1', status: 'pending', createdAt: '', updatedAt: '' };
      const approved: FlowApproval = { id: '2', runId: 'r2', gateId: 'g2', status: 'approved', createdAt: '', updatedAt: '' };
      const rejected: FlowApproval = { id: '3', runId: 'r3', gateId: 'g3', status: 'rejected', createdAt: '', updatedAt: '' };

      expect(pending.status).toBe('pending');
      expect(approved.status).toBe('approved');
      expect(rejected.status).toBe('rejected');
    });
  });

  describe('ListApprovalsOptions', () => {
    it('should accept an empty options object', () => {
      const options: ListApprovalsOptions = {};
      expect(options.limit).toBeUndefined();
      expect(options.status).toBeUndefined();
    });

    it('should accept all filter options', () => {
      const options: ListApprovalsOptions = {
        limit: 25,
        page: 1,
        status: 'pending',
      };

      expect(options.limit).toBe(25);
      expect(options.status).toBe('pending');
    });
  });

  describe('ApproveOptions', () => {
    it('should accept an empty options object', () => {
      const options: ApproveOptions = {};
      expect(options.note).toBeUndefined();
    });

    it('should accept a note', () => {
      const options: ApproveOptions = {
        note: 'Verified and approved by finance team.',
      };

      expect(options.note).toBe('Verified and approved by finance team.');
    });
  });

  describe('RejectOptions', () => {
    it('should accept an empty options object', () => {
      const options: RejectOptions = {};
      expect(options.reason).toBeUndefined();
    });

    it('should accept a reason', () => {
      const options: RejectOptions = {
        reason: 'Amount exceeds the approved limit.',
      };

      expect(options.reason).toBe('Amount exceeds the approved limit.');
    });
  });
});

describe('Deliveries', () => {
  describe('FlowDelivery', () => {
    it('should accept a pending delivery with required fields', () => {
      const delivery: FlowDelivery = {
        id: 'delivery_abc123',
        runId: 'run_def456',
        status: 'pending',
        attempts: 0,
        createdAt: '2026-02-01T09:00:00Z',
      };

      expect(delivery.id).toBe('delivery_abc123');
      expect(delivery.runId).toBe('run_def456');
      expect(delivery.status).toBe('pending');
      expect(delivery.attempts).toBe(0);
    });

    it('should accept a delivered delivery with all optional fields', () => {
      const delivery: FlowDelivery = {
        id: 'delivery_xyz',
        runId: 'run_abc',
        status: 'delivered',
        url: 'https://example.com/webhook/receive',
        httpStatus: 200,
        attempts: 1,
        lastAttemptAt: '2026-02-01T09:01:00Z',
        createdAt: '2026-02-01T09:00:00Z',
      };

      expect(delivery.url).toBe('https://example.com/webhook/receive');
      expect(delivery.httpStatus).toBe(200);
      expect(delivery.attempts).toBe(1);
      expect(delivery.lastAttemptAt).toBeDefined();
    });

    it('should accept a failed delivery with error details', () => {
      const delivery: FlowDelivery = {
        id: 'delivery_fail',
        runId: 'run_abc',
        status: 'failed',
        url: 'https://example.com/webhook/receive',
        httpStatus: 503,
        attempts: 3,
        lastAttemptAt: '2026-02-01T09:10:00Z',
        error: 'Service Unavailable after 3 attempts',
        createdAt: '2026-02-01T09:00:00Z',
      };

      expect(delivery.status).toBe('failed');
      expect(delivery.httpStatus).toBe(503);
      expect(delivery.attempts).toBe(3);
      expect(delivery.error).toBe('Service Unavailable after 3 attempts');
    });

    it('should accept all valid delivery statuses', () => {
      const pending: FlowDelivery = { id: '1', runId: 'r1', status: 'pending', attempts: 0, createdAt: '' };
      const delivered: FlowDelivery = { id: '2', runId: 'r2', status: 'delivered', attempts: 1, createdAt: '' };
      const failed: FlowDelivery = { id: '3', runId: 'r3', status: 'failed', attempts: 3, createdAt: '' };

      expect(pending.status).toBe('pending');
      expect(delivered.status).toBe('delivered');
      expect(failed.status).toBe('failed');
    });
  });

  describe('ListDeliveriesOptions', () => {
    it('should accept an empty options object', () => {
      const options: ListDeliveriesOptions = {};
      expect(options.limit).toBeUndefined();
      expect(options.page).toBeUndefined();
    });

    it('should accept pagination options', () => {
      const options: ListDeliveriesOptions = {
        limit: 10,
        page: 2,
      };

      expect(options.limit).toBe(10);
      expect(options.page).toBe(2);
    });
  });
});
