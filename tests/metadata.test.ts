/**
 * Metadata Unit Tests
 *
 * Tests for metadata type definitions and webhook event parsing.
 * These tests don't require a live API.
 */

import {
  verifyWebhookSignature,
  WebhookSignatureError,
  type DocumentWebhookData,
  type BatchWebhookData,
  type MetadataValue,
  type DocumentMetadata,
  type GenerateDocumentOptions,
  type BatchDocumentSpec,
} from '../src';
import { createHmac } from 'crypto';

describe('Metadata Types', () => {
  describe('MetadataValue', () => {
    it('should accept string values', () => {
      const value: MetadataValue = 'hello';
      expect(value).toBe('hello');
    });

    it('should accept number values', () => {
      const intValue: MetadataValue = 42;
      const floatValue: MetadataValue = 3.14;
      expect(intValue).toBe(42);
      expect(floatValue).toBe(3.14);
    });

    it('should accept boolean values', () => {
      const trueValue: MetadataValue = true;
      const falseValue: MetadataValue = false;
      expect(trueValue).toBe(true);
      expect(falseValue).toBe(false);
    });

    it('should accept null values', () => {
      const nullValue: MetadataValue = null;
      expect(nullValue).toBeNull();
    });
  });

  describe('DocumentMetadata', () => {
    it('should accept a flat object with valid values', () => {
      const metadata: DocumentMetadata = {
        orderId: 'ord_12345',
        customerId: 'cust_67890',
        priority: 1,
        isUrgent: true,
        discount: null,
      };

      expect(metadata.orderId).toBe('ord_12345');
      expect(metadata.customerId).toBe('cust_67890');
      expect(metadata.priority).toBe(1);
      expect(metadata.isUrgent).toBe(true);
      expect(metadata.discount).toBeNull();
    });
  });

  describe('GenerateDocumentOptions', () => {
    it('should accept metadata in generate options', () => {
      const options: GenerateDocumentOptions = {
        templateId: 'tmpl_test',
        format: 'pdf',
        variables: { invoiceNumber: 'INV-001' },
        metadata: {
          orderId: 'ord_123',
          customerId: 'cust_456',
        },
      };

      expect(options.metadata?.orderId).toBe('ord_123');
      expect(options.metadata?.customerId).toBe('cust_456');
    });

    it('should work without metadata', () => {
      const options: GenerateDocumentOptions = {
        templateId: 'tmpl_test',
        format: 'pdf',
      };

      expect(options.metadata).toBeUndefined();
    });
  });

  describe('BatchDocumentSpec', () => {
    it('should accept per-document metadata', () => {
      const doc: BatchDocumentSpec = {
        variables: { invoiceNumber: 'INV-001' },
        metadata: { rowNumber: 1 },
      };

      expect(doc.metadata?.rowNumber).toBe(1);
    });
  });
});

describe('Webhook Event Parsing', () => {
  const TEST_SECRET = 'whsec_test_secret';

  function createSignature(payload: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = createHmac('sha256', TEST_SECRET)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  describe('Document Events', () => {
    it('should parse document.completed event with metadata', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        id: 'evt_123',
        type: 'document.completed',
        timestamp: '2025-02-02T12:00:00Z',
        data: {
          jobId: 'job_456',
          status: 'completed',
          templateId: 'tmpl_789',
          format: 'pdf',
          downloadUrl: 'https://example.com/download',
          fileSize: 12345,
          metadata: {
            orderId: 'ord_abc',
            customerId: 'cust_def',
            priority: 1,
          },
        },
      });

      const signature = createSignature(payload, timestamp);
      const event = verifyWebhookSignature({
        payload,
        signature,
        secret: TEST_SECRET,
      });

      expect(event.id).toBe('evt_123');
      expect(event.type).toBe('document.completed');

      const data = event.data as DocumentWebhookData;
      expect(data.jobId).toBe('job_456');
      expect(data.status).toBe('completed');
      expect(data.downloadUrl).toBe('https://example.com/download');
      expect(data.metadata).toBeDefined();
      expect(data.metadata?.orderId).toBe('ord_abc');
      expect(data.metadata?.customerId).toBe('cust_def');
      expect(data.metadata?.priority).toBe(1);
    });

    it('should parse document.failed event with error and metadata', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        id: 'evt_fail',
        type: 'document.failed',
        timestamp: '2025-02-02T12:00:00Z',
        data: {
          jobId: 'job_fail',
          status: 'failed',
          templateId: 'tmpl_789',
          format: 'pdf',
          errorMessage: 'Template not found',
          errorCode: 'ERR_TMPL_001',
          metadata: {
            orderId: 'ord_failed',
          },
        },
      });

      const signature = createSignature(payload, timestamp);
      const event = verifyWebhookSignature({
        payload,
        signature,
        secret: TEST_SECRET,
      });

      expect(event.type).toBe('document.failed');

      const data = event.data as DocumentWebhookData;
      expect(data.status).toBe('failed');
      expect(data.errorMessage).toBe('Template not found');
      expect(data.errorCode).toBe('ERR_TMPL_001');
      expect(data.downloadUrl).toBeUndefined();
      expect(data.metadata?.orderId).toBe('ord_failed');
    });

    it('should parse event without metadata', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        id: 'evt_no_meta',
        type: 'document.completed',
        timestamp: '2025-02-02T12:00:00Z',
        data: {
          jobId: 'job_789',
          status: 'completed',
          templateId: 'tmpl_abc',
          format: 'pdf',
          downloadUrl: 'https://example.com/dl',
        },
      });

      const signature = createSignature(payload, timestamp);
      const event = verifyWebhookSignature({
        payload,
        signature,
        secret: TEST_SECRET,
      });

      const data = event.data as DocumentWebhookData;
      expect(data.jobId).toBe('job_789');
      expect(data.metadata).toBeUndefined();
    });
  });

  describe('Batch Events', () => {
    it('should parse batch.completed event with metadata', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        id: 'evt_batch',
        type: 'batch.completed',
        timestamp: '2025-02-02T12:00:00Z',
        data: {
          batchId: 'batch_123',
          status: 'completed',
          templateId: 'tmpl_456',
          format: 'pdf',
          totalJobs: 10,
          completedJobs: 8,
          failedJobs: 2,
          metadata: {
            batchRunId: 'run_001',
            triggeredBy: 'scheduled_job',
          },
        },
      });

      const signature = createSignature(payload, timestamp);
      const event = verifyWebhookSignature({
        payload,
        signature,
        secret: TEST_SECRET,
      });

      expect(event.type).toBe('batch.completed');

      const data = event.data as BatchWebhookData;
      expect(data.batchId).toBe('batch_123');
      expect(data.totalJobs).toBe(10);
      expect(data.completedJobs).toBe(8);
      expect(data.failedJobs).toBe(2);
      expect(data.metadata?.batchRunId).toBe('run_001');
      expect(data.metadata?.triggeredBy).toBe('scheduled_job');
    });
  });
});
