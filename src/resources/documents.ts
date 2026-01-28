/**
 * Documents Resource
 */

import type { HttpClient } from '../utils/http';
import type {
  DocumentJob,
  GenerateDocumentOptions,
  GenerateDocumentResponse,
  GenerateBatchOptions,
  GenerateBatchResponse,
  ListDocumentJobsOptions,
  PaginationMeta,
} from '../types';

export class DocumentsResource {
  constructor(private http: HttpClient) {}

  /**
   * Generate a document from a template
   *
   * @example
   * ```typescript
   * const result = await rynko.documents.generate({
   *   templateId: 'tmpl_abc123',
   *   format: 'pdf',
   *   variables: {
   *     customerName: 'John Doe',
   *     invoiceNumber: 'INV-001',
   *     amount: 150.00,
   *   },
   * });
   * console.log('Job ID:', result.jobId);
   * console.log('Download URL:', result.downloadUrl);
   * ```
   */
  async generate(options: GenerateDocumentOptions): Promise<GenerateDocumentResponse> {
    // Backend returns response directly (not wrapped)
    return this.http.post<GenerateDocumentResponse>(
      '/api/v1/documents/generate',
      options
    );
  }

  /**
   * Generate a PDF document from a template
   *
   * @example
   * ```typescript
   * const result = await rynko.documents.generatePdf({
   *   templateId: 'tmpl_invoice',
   *   variables: {
   *     invoiceNumber: 'INV-001',
   *     total: 99.99,
   *   },
   * });
   * ```
   */
  async generatePdf(
    options: Omit<GenerateDocumentOptions, 'format'>
  ): Promise<GenerateDocumentResponse> {
    return this.generate({ ...options, format: 'pdf' });
  }

  /**
   * Generate an Excel document from a template
   *
   * @example
   * ```typescript
   * const result = await rynko.documents.generateExcel({
   *   templateId: 'tmpl_report',
   *   variables: {
   *     reportDate: '2025-01-15',
   *     data: [{ name: 'Item 1', value: 100 }],
   *   },
   * });
   * ```
   */
  async generateExcel(
    options: Omit<GenerateDocumentOptions, 'format'>
  ): Promise<GenerateDocumentResponse> {
    return this.generate({ ...options, format: 'excel' });
  }

  /**
   * Generate multiple documents in a batch
   *
   * @example
   * ```typescript
   * const result = await rynko.documents.generateBatch({
   *   templateId: 'tmpl_invoice',
   *   format: 'pdf',
   *   documents: [
   *     { variables: { invoiceNumber: 'INV-001', total: 99.99 } },
   *     { variables: { invoiceNumber: 'INV-002', total: 149.99 } },
   *   ],
   * });
   * console.log('Batch ID:', result.batchId);
   * ```
   */
  async generateBatch(options: GenerateBatchOptions): Promise<GenerateBatchResponse> {
    // Backend returns response directly (not wrapped)
    return this.http.post<GenerateBatchResponse>(
      '/api/v1/documents/generate/batch',
      options
    );
  }

  /**
   * Get a document job by ID
   *
   * @example
   * ```typescript
   * const job = await rynko.documents.getJob('job_abc123');
   * console.log('Status:', job.status);
   * if (job.status === 'completed') {
   *   console.log('Download:', job.downloadUrl);
   * }
   * ```
   */
  async getJob(jobId: string): Promise<DocumentJob> {
    // Backend returns job directly (not wrapped)
    return this.http.get<DocumentJob>(`/api/v1/documents/jobs/${jobId}`);
  }

  /**
   * List document jobs with optional filters
   *
   * @example
   * ```typescript
   * const { data, meta } = await rynko.documents.listJobs({
   *   status: 'completed',
   *   limit: 10,
   * });
   * console.log(`Found ${meta.total} jobs`);
   * ```
   */
  async listJobs(
    options: ListDocumentJobsOptions = {}
  ): Promise<{ data: DocumentJob[]; meta: PaginationMeta }> {
    // Backend returns { jobs: [], total: number }
    const response = await this.http.get<{ jobs: DocumentJob[]; total: number }>(
      '/api/v1/documents/jobs',
      {
        status: options.status,
        templateId: options.templateId,
        workspaceId: options.workspaceId,
        limit: options.limit,
        offset: options.offset ?? ((options.page ?? 1) - 1) * (options.limit ?? 20),
      }
    );

    const limit = options.limit ?? 20;
    const page = options.page ?? 1;

    return {
      data: response.jobs,
      meta: {
        total: response.total,
        page,
        limit,
        totalPages: Math.ceil(response.total / limit),
      },
    };
  }

  /**
   * Wait for a document job to complete
   *
   * @example
   * ```typescript
   * const result = await rynko.documents.generate({
   *   templateId: 'tmpl_invoice',
   *   format: 'pdf',
   *   variables: { invoiceNumber: 'INV-001' },
   * });
   *
   * // Wait for completion (polls every 1 second, max 30 seconds)
   * const completedJob = await rynko.documents.waitForCompletion(result.jobId);
   * console.log('Download URL:', completedJob.downloadUrl);
   * ```
   */
  async waitForCompletion(
    jobId: string,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<DocumentJob> {
    const pollInterval = options.pollInterval || 1000;
    const timeout = options.timeout || 30000;
    const startTime = Date.now();

    while (true) {
      const job = await this.getJob(jobId);

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for job ${jobId} to complete`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
}
