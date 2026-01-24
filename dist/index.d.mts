/**
 * HTTP Client for Renderbase SDK
 */
interface HttpClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    headers?: Record<string, string>;
}
declare class HttpClient {
    private config;
    constructor(config: HttpClientConfig);
    private request;
    get<T>(path: string, query?: Record<string, unknown>): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
}
declare class RenderbaseError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode: number);
}

/**
 * Renderbase SDK Types
 */
interface RenderbaseConfig {
    /** API Key for authentication */
    apiKey: string;
    /** Base URL for the API (default: https://api.renderbase.dev) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Custom headers to include in requests */
    headers?: Record<string, string>;
}
interface GenerateDocumentOptions {
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
interface GenerateBatchOptions {
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
interface GenerateDocumentResponse {
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
interface GenerateBatchResponse {
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
interface DocumentJob {
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
type DocumentJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
interface ListDocumentJobsOptions {
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
interface Template {
    id: string;
    name: string;
    type: 'pdf' | 'excel';
    description?: string;
    variables?: TemplateVariable[];
    createdAt: string;
    updatedAt: string;
}
interface TemplateVariable {
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: unknown;
}
interface ListTemplatesOptions {
    /** Number of results per page (default: 20) */
    limit?: number;
    /** Page number (default: 1) */
    page?: number;
    /** Search by template name */
    search?: string;
}
interface WebhookSubscription {
    id: string;
    url: string;
    events: WebhookEventType[];
    description?: string;
    isActive: boolean;
    secret?: string;
    createdAt: string;
    updatedAt: string;
}
type WebhookEventType = 'document.generated' | 'document.failed' | 'document.downloaded';
interface CreateWebhookOptions {
    /** URL to receive webhook events */
    url: string;
    /** Event types to subscribe to */
    events: WebhookEventType[];
    /** Webhook description (optional) */
    description?: string;
}
interface WebhookEvent {
    id: string;
    type: WebhookEventType;
    timestamp: string;
    data: Record<string, unknown>;
}
interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: PaginationMeta;
}
interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
interface ApiError {
    success: false;
    error: string;
    message: string;
    statusCode: number;
}
interface User {
    id: string;
    email: string;
    name?: string;
    teamId?: string;
    teamName?: string;
    workspaceId?: string;
    workspaceName?: string;
}

/**
 * Documents Resource
 */

declare class DocumentsResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Generate a document from a template
     *
     * @example
     * ```typescript
     * const result = await renderbase.documents.generate({
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
    generate(options: GenerateDocumentOptions): Promise<GenerateDocumentResponse>;
    /**
     * Generate a PDF document from a template
     *
     * @example
     * ```typescript
     * const result = await renderbase.documents.generatePdf({
     *   templateId: 'tmpl_invoice',
     *   variables: {
     *     invoiceNumber: 'INV-001',
     *     total: 99.99,
     *   },
     * });
     * ```
     */
    generatePdf(options: Omit<GenerateDocumentOptions, 'format'>): Promise<GenerateDocumentResponse>;
    /**
     * Generate an Excel document from a template
     *
     * @example
     * ```typescript
     * const result = await renderbase.documents.generateExcel({
     *   templateId: 'tmpl_report',
     *   variables: {
     *     reportDate: '2025-01-15',
     *     data: [{ name: 'Item 1', value: 100 }],
     *   },
     * });
     * ```
     */
    generateExcel(options: Omit<GenerateDocumentOptions, 'format'>): Promise<GenerateDocumentResponse>;
    /**
     * Generate multiple documents in a batch
     *
     * @example
     * ```typescript
     * const result = await renderbase.documents.generateBatch({
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
    generateBatch(options: GenerateBatchOptions): Promise<GenerateBatchResponse>;
    /**
     * Get a document job by ID
     *
     * @example
     * ```typescript
     * const job = await renderbase.documents.getJob('job_abc123');
     * console.log('Status:', job.status);
     * if (job.status === 'completed') {
     *   console.log('Download:', job.downloadUrl);
     * }
     * ```
     */
    getJob(jobId: string): Promise<DocumentJob>;
    /**
     * List document jobs with optional filters
     *
     * @example
     * ```typescript
     * const { data, meta } = await renderbase.documents.listJobs({
     *   status: 'completed',
     *   limit: 10,
     * });
     * console.log(`Found ${meta.total} jobs`);
     * ```
     */
    listJobs(options?: ListDocumentJobsOptions): Promise<{
        data: DocumentJob[];
        meta: PaginationMeta;
    }>;
    /**
     * Wait for a document job to complete
     *
     * @example
     * ```typescript
     * const result = await renderbase.documents.generate({
     *   templateId: 'tmpl_invoice',
     *   format: 'pdf',
     *   variables: { invoiceNumber: 'INV-001' },
     * });
     *
     * // Wait for completion (polls every 1 second, max 30 seconds)
     * const completedJob = await renderbase.documents.waitForCompletion(result.jobId);
     * console.log('Download URL:', completedJob.downloadUrl);
     * ```
     */
    waitForCompletion(jobId: string, options?: {
        pollInterval?: number;
        timeout?: number;
    }): Promise<DocumentJob>;
}

/**
 * Templates Resource
 */

declare class TemplatesResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get a template by ID
     *
     * @example
     * ```typescript
     * const template = await renderbase.templates.get('tmpl_abc123');
     * console.log('Template:', template.name);
     * console.log('Variables:', template.variables);
     * ```
     */
    get(id: string): Promise<Template>;
    /**
     * List templates with optional filters
     *
     * @example
     * ```typescript
     * // List all templates
     * const { data } = await renderbase.templates.list();
     *
     * // List with pagination
     * const { data, meta } = await renderbase.templates.list({ page: 1, limit: 10 });
     * ```
     */
    list(options?: ListTemplatesOptions): Promise<{
        data: Template[];
        meta: PaginationMeta;
    }>;
    /**
     * List only PDF templates
     *
     * Note: Filtering by type is done client-side based on outputFormats.
     *
     * @example
     * ```typescript
     * const { data } = await renderbase.templates.listPdf();
     * ```
     */
    listPdf(options?: Omit<ListTemplatesOptions, 'type'>): Promise<{
        data: Template[];
        meta: PaginationMeta;
    }>;
    /**
     * List only Excel templates
     *
     * Note: Filtering by type is done client-side based on outputFormats.
     *
     * @example
     * ```typescript
     * const { data } = await renderbase.templates.listExcel();
     * ```
     */
    listExcel(options?: Omit<ListTemplatesOptions, 'type'>): Promise<{
        data: Template[];
        meta: PaginationMeta;
    }>;
}

/**
 * Webhooks Resource
 */

declare class WebhooksResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Create a webhook subscription
     *
     * @example
     * ```typescript
     * const webhook = await renderbase.webhooks.create({
     *   url: 'https://your-app.com/webhooks/renderbase',
     *   events: ['document.generated', 'document.failed'],
     *   description: 'My Webhook',
     * });
     * console.log('Webhook ID:', webhook.id);
     * console.log('Secret:', webhook.secret); // Save this for verification!
     * ```
     */
    create(options: CreateWebhookOptions): Promise<WebhookSubscription>;
    /**
     * Get a webhook subscription by ID
     *
     * @example
     * ```typescript
     * const webhook = await renderbase.webhooks.get('wh_abc123');
     * console.log('Events:', webhook.events);
     * ```
     */
    get(id: string): Promise<WebhookSubscription>;
    /**
     * List all webhook subscriptions
     *
     * @example
     * ```typescript
     * const { data } = await renderbase.webhooks.list();
     * console.log('Active webhooks:', data.filter(w => w.isActive).length);
     * ```
     */
    list(): Promise<{
        data: WebhookSubscription[];
        meta: PaginationMeta;
    }>;
    /**
     * Delete a webhook subscription
     *
     * @example
     * ```typescript
     * await renderbase.webhooks.delete('wh_abc123');
     * console.log('Webhook deleted');
     * ```
     */
    delete(id: string): Promise<void>;
    /**
     * Update a webhook subscription
     *
     * @example
     * ```typescript
     * const updated = await renderbase.webhooks.update('wh_abc123', {
     *   events: ['document.generated', 'document.failed'],
     *   isActive: true,
     * });
     * ```
     */
    update(id: string, options: Partial<CreateWebhookOptions> & {
        isActive?: boolean;
    }): Promise<WebhookSubscription>;
}

/**
 * Renderbase SDK Client
 */

declare class Renderbase {
    private http;
    /** Document generation operations */
    documents: DocumentsResource;
    /** Template operations */
    templates: TemplatesResource;
    /** Webhook operations */
    webhooks: WebhooksResource;
    /**
     * Create a new Renderbase client
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
     * ```
     */
    constructor(config: RenderbaseConfig);
    /**
     * Get the current authenticated user
     *
     * @example
     * ```typescript
     * const user = await renderbase.me();
     * console.log('Authenticated as:', user.email);
     * ```
     */
    me(): Promise<User>;
    /**
     * Verify the API key is valid
     *
     * @example
     * ```typescript
     * const isValid = await renderbase.verifyApiKey();
     * if (!isValid) {
     *   throw new Error('Invalid API key');
     * }
     * ```
     */
    verifyApiKey(): Promise<boolean>;
}
/**
 * Create a Renderbase client
 *
 * @example
 * ```typescript
 * import { createClient } from '@renderbase/sdk';
 *
 * const renderbase = createClient({
 *   apiKey: process.env.RENDERBASE_API_KEY!,
 * });
 * ```
 */
declare function createClient(config: RenderbaseConfig): Renderbase;

/**
 * Webhook Signature Verification Utilities
 */

interface VerifyWebhookOptions {
    /** Raw request body as string */
    payload: string;
    /** Signature from X-Renderbase-Signature header */
    signature: string;
    /** Webhook secret from your subscription */
    secret: string;
    /** Timestamp tolerance in seconds (default: 300 = 5 minutes) */
    tolerance?: number;
}
interface ParsedWebhookSignature {
    timestamp: number;
    signature: string;
}
/**
 * Parse the webhook signature header
 */
declare function parseSignatureHeader(header: string): ParsedWebhookSignature;
/**
 * Compute the expected signature for a webhook payload
 */
declare function computeSignature(timestamp: number, payload: string, secret: string): string;
/**
 * Verify a webhook signature
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@renderbase/sdk';
 *
 * app.post('/webhooks/renderbase', (req, res) => {
 *   const signature = req.headers['x-renderbase-signature'];
 *
 *   try {
 *     const event = verifyWebhookSignature({
 *       payload: req.body, // raw body string
 *       signature,
 *       secret: process.env.WEBHOOK_SECRET,
 *     });
 *
 *     // Process the verified event
 *     console.log('Received event:', event.type);
 *     res.status(200).send('OK');
 *   } catch (error) {
 *     console.error('Invalid signature:', error);
 *     res.status(400).send('Invalid signature');
 *   }
 * });
 * ```
 */
declare function verifyWebhookSignature(options: VerifyWebhookOptions): WebhookEvent;
declare class WebhookSignatureError extends Error {
    constructor(message: string);
}

export { type ApiError, type ApiResponse, type CreateWebhookOptions, type DocumentJob, type DocumentJobStatus, DocumentsResource, type GenerateBatchOptions, type GenerateBatchResponse, type GenerateDocumentOptions, type GenerateDocumentResponse, type ListDocumentJobsOptions, type ListTemplatesOptions, type PaginationMeta, Renderbase, type RenderbaseConfig, RenderbaseError, type Template, type TemplateVariable, TemplatesResource, type User, type VerifyWebhookOptions, type WebhookEvent, type WebhookEventType, WebhookSignatureError, type WebhookSubscription, WebhooksResource, computeSignature, createClient, parseSignatureHeader, verifyWebhookSignature };
