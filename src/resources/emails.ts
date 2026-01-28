/**
 * Emails Resource
 */

import type { HttpClient } from '../utils/http';
import type {
  ApiResponse,
  Email,
  SendEmailOptions,
  SendEmailResponse,
  SendBulkEmailOptions,
  SendBulkEmailResponse,
  ListEmailsOptions,
  PaginationMeta,
} from '../types';

export class EmailsResource {
  constructor(private http: HttpClient) {}

  /**
   * Send an email using a template
   *
   * @example
   * ```typescript
   * const result = await rynko.emails.send({
   *   templateId: 'tmpl_abc123',
   *   to: 'customer@example.com',
   *   toName: 'John Doe',
   *   variables: {
   *     firstName: 'John',
   *     orderId: '12345',
   *   },
   * });
   * console.log('Email sent:', result.id);
   * ```
   */
  async send(options: SendEmailOptions): Promise<SendEmailResponse> {
    const response = await this.http.post<ApiResponse<SendEmailResponse>>(
      '/api/v1/emails/send',
      options
    );
    return response.data;
  }

  /**
   * Send an email with a generated PDF attachment
   *
   * @example
   * ```typescript
   * const result = await rynko.emails.sendWithPdf({
   *   templateId: 'tmpl_email123',
   *   to: 'customer@example.com',
   *   variables: { invoiceNumber: 'INV-001' },
   *   attachments: [{
   *     type: 'pdf',
   *     templateId: 'tmpl_invoice_pdf',
   *     fileName: 'Invoice-001',
   *     variables: { invoiceNumber: 'INV-001', total: 99.99 },
   *   }],
   * });
   * ```
   */
  async sendWithPdf(
    options: Omit<SendEmailOptions, 'attachments'> & {
      pdfTemplateId: string;
      pdfFileName?: string;
      pdfVariables?: Record<string, unknown>;
    }
  ): Promise<SendEmailResponse> {
    const { pdfTemplateId, pdfFileName, pdfVariables, ...emailOptions } = options;

    return this.send({
      ...emailOptions,
      attachments: [
        {
          type: 'pdf',
          templateId: pdfTemplateId,
          fileName: pdfFileName,
          variables: pdfVariables,
        },
      ],
    });
  }

  /**
   * Send an email with a generated Excel attachment
   *
   * @example
   * ```typescript
   * const result = await rynko.emails.sendWithExcel({
   *   templateId: 'tmpl_email123',
   *   to: 'customer@example.com',
   *   variables: { reportDate: '2025-01-15' },
   *   excelTemplateId: 'tmpl_report_excel',
   *   excelFileName: 'Monthly-Report',
   * });
   * ```
   */
  async sendWithExcel(
    options: Omit<SendEmailOptions, 'attachments'> & {
      excelTemplateId: string;
      excelFileName?: string;
      excelVariables?: Record<string, unknown>;
    }
  ): Promise<SendEmailResponse> {
    const { excelTemplateId, excelFileName, excelVariables, ...emailOptions } = options;

    return this.send({
      ...emailOptions,
      attachments: [
        {
          type: 'excel',
          templateId: excelTemplateId,
          fileName: excelFileName,
          variables: excelVariables,
        },
      ],
    });
  }

  /**
   * Send bulk emails to multiple recipients
   *
   * @example
   * ```typescript
   * const result = await rynko.emails.sendBulk({
   *   templateId: 'tmpl_newsletter',
   *   recipients: [
   *     { email: 'user1@example.com', name: 'User 1', variables: { firstName: 'User' } },
   *     { email: 'user2@example.com', name: 'User 2', variables: { firstName: 'User' } },
   *   ],
   *   commonVariables: {
   *     companyName: 'Acme Corp',
   *   },
   * });
   * console.log('Batch ID:', result.batchId);
   * ```
   */
  async sendBulk(options: SendBulkEmailOptions): Promise<SendBulkEmailResponse> {
    const response = await this.http.post<ApiResponse<SendBulkEmailResponse>>(
      '/api/v1/emails/send-bulk',
      options
    );
    return response.data;
  }

  /**
   * Get an email by ID
   *
   * @example
   * ```typescript
   * const email = await rynko.emails.get('email_abc123');
   * console.log('Status:', email.status);
   * ```
   */
  async get(id: string): Promise<Email> {
    const response = await this.http.get<ApiResponse<Email>>(`/api/v1/emails/${id}`);
    return response.data;
  }

  /**
   * List emails with optional filters
   *
   * @example
   * ```typescript
   * const { data, meta } = await rynko.emails.list({
   *   recipient: 'customer@example.com',
   *   status: 'delivered',
   *   limit: 10,
   * });
   * console.log(`Found ${meta.total} emails`);
   * ```
   */
  async list(
    options: ListEmailsOptions = {}
  ): Promise<{ data: Email[]; meta: PaginationMeta }> {
    const response = await this.http.get<ApiResponse<Email[]>>('/api/v1/emails', {
      recipient: options.recipient,
      status: options.status,
      templateId: options.templateId,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      limit: options.limit,
      page: options.page,
    });

    return {
      data: response.data,
      meta: response.meta!,
    };
  }
}
