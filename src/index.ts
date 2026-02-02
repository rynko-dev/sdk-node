/**
 * Rynko Node.js SDK
 *
 * Official SDK for the Rynko document generation platform.
 *
 * @example
 * ```typescript
 * import { Rynko } from '@rynko/sdk';
 *
 * const rynko = new Rynko({
 *   apiKey: process.env.RYNKO_API_KEY!,
 * });
 *
 * // Generate a PDF
 * const result = await rynko.documents.generate({
 *   templateId: 'tmpl_invoice',
 *   format: 'pdf',
 *   variables: { invoiceNumber: 'INV-001' },
 * });
 *
 * // Generate an Excel file
 * const report = await rynko.documents.generateExcel({
 *   templateId: 'tmpl_report',
 *   variables: { reportDate: '2025-01-15' },
 * });
 *
 * // List templates
 * const { data: templates } = await rynko.templates.list({ type: 'pdf' });
 *
 * // Verify webhook signature
 * import { verifyWebhookSignature } from '@rynko/sdk';
 *
 * const event = verifyWebhookSignature({
 *   payload: requestBody,
 *   signature: headers['x-rynko-signature'],
 *   secret: process.env.WEBHOOK_SECRET!,
 * });
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { Rynko, createClient } from './client';

// Resources
export { DocumentsResource } from './resources/documents';
export { TemplatesResource } from './resources/templates';
export { WebhooksResource } from './resources/webhooks';

// Utilities
export { RynkoError } from './utils/http';
export {
  verifyWebhookSignature,
  parseSignatureHeader,
  computeSignature,
  WebhookSignatureError,
} from './utils/webhooks';

// Types
export type {
  RynkoConfig,
  RetryConfig,
  // Document types
  GenerateDocumentOptions,
  GenerateBatchOptions,
  GenerateDocumentResponse,
  GenerateBatchResponse,
  DocumentJob,
  DocumentJobStatus,
  ListDocumentJobsOptions,
  BatchDocumentSpec,
  // Metadata types
  MetadataValue,
  DocumentMetadata,
  // Template types
  Template,
  TemplateVariable,
  ListTemplatesOptions,
  // Webhook types
  WebhookSubscription,
  WebhookEventType,
  WebhookEvent,
  DocumentWebhookData,
  BatchWebhookData,
  // Response types
  ApiResponse,
  PaginationMeta,
  ApiError,
  // User types
  User,
} from './types';

export type { VerifyWebhookOptions } from './utils/webhooks';
