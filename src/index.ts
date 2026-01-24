/**
 * Renderbase Node.js SDK
 *
 * Official SDK for the Renderbase document generation platform.
 *
 * @example
 * ```typescript
 * import { Renderbase } from '@renderbase/sdk';
 *
 * const renderbase = new Renderbase({
 *   apiKey: process.env.RENDERBASE_API_KEY!,
 * });
 *
 * // Generate a PDF
 * const result = await renderbase.documents.generate({
 *   templateId: 'tmpl_invoice',
 *   format: 'pdf',
 *   variables: { invoiceNumber: 'INV-001' },
 * });
 *
 * // Generate an Excel file
 * const report = await renderbase.documents.generateExcel({
 *   templateId: 'tmpl_report',
 *   variables: { reportDate: '2025-01-15' },
 * });
 *
 * // List templates
 * const { data: templates } = await renderbase.templates.list({ type: 'pdf' });
 *
 * // Verify webhook signature
 * import { verifyWebhookSignature } from '@renderbase/sdk';
 *
 * const event = verifyWebhookSignature({
 *   payload: requestBody,
 *   signature: headers['x-renderbase-signature'],
 *   secret: process.env.WEBHOOK_SECRET!,
 * });
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { Renderbase, createClient } from './client';

// Resources
export { DocumentsResource } from './resources/documents';
export { TemplatesResource } from './resources/templates';
export { WebhooksResource } from './resources/webhooks';

// Utilities
export { RenderbaseError } from './utils/http';
export {
  verifyWebhookSignature,
  parseSignatureHeader,
  computeSignature,
  WebhookSignatureError,
} from './utils/webhooks';

// Types
export type {
  RenderbaseConfig,
  // Document types
  GenerateDocumentOptions,
  GenerateBatchOptions,
  GenerateDocumentResponse,
  GenerateBatchResponse,
  DocumentJob,
  DocumentJobStatus,
  ListDocumentJobsOptions,
  // Template types
  Template,
  TemplateVariable,
  ListTemplatesOptions,
  // Webhook types
  WebhookSubscription,
  WebhookEventType,
  WebhookEvent,
  // Response types
  ApiResponse,
  PaginationMeta,
  ApiError,
  // User types
  User,
} from './types';

export type { VerifyWebhookOptions } from './utils/webhooks';
