"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DocumentsResource: () => DocumentsResource,
  Rynko: () => Rynko,
  RynkoError: () => RynkoError,
  TemplatesResource: () => TemplatesResource,
  WebhookSignatureError: () => WebhookSignatureError,
  WebhooksResource: () => WebhooksResource,
  computeSignature: () => computeSignature,
  createClient: () => createClient,
  parseSignatureHeader: () => parseSignatureHeader,
  verifyWebhookSignature: () => verifyWebhookSignature
});
module.exports = __toCommonJS(index_exports);

// src/utils/http.ts
var DEFAULT_RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1e3,
  maxDelayMs: 3e4,
  maxJitterMs: 1e3,
  retryableStatuses: [429, 503, 504]
};
var HttpClient = class {
  constructor(config) {
    this.config = config;
    if (config.retry === false) {
      this.retryConfig = null;
    } else {
      this.retryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...config.retry
      };
    }
  }
  /**
   * Calculate delay for exponential backoff with jitter
   */
  calculateDelay(attempt, retryAfterMs) {
    if (!this.retryConfig) return 0;
    if (retryAfterMs !== void 0) {
      const jitter2 = Math.random() * this.retryConfig.maxJitterMs;
      return Math.min(retryAfterMs + jitter2, this.retryConfig.maxDelayMs);
    }
    const exponentialDelay = this.retryConfig.initialDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * this.retryConfig.maxJitterMs;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
  }
  /**
   * Parse Retry-After header value to milliseconds
   */
  parseRetryAfter(retryAfter) {
    if (!retryAfter) return void 0;
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1e3;
    }
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      const delayMs = date.getTime() - Date.now();
      return delayMs > 0 ? delayMs : void 0;
    }
    return void 0;
  }
  /**
   * Check if the status code should trigger a retry
   */
  shouldRetry(statusCode) {
    if (!this.retryConfig) return false;
    return this.retryConfig.retryableStatuses.includes(statusCode);
  }
  /**
   * Sleep for the specified duration
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async request(method, path, options = {}) {
    const url = new URL(path, this.config.baseUrl);
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          if (value instanceof Date) {
            url.searchParams.append(key, value.toISOString());
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      "User-Agent": "@rynko/sdk/1.0.0",
      ...this.config.headers
    };
    const maxAttempts = this.retryConfig?.maxAttempts ?? 1;
    let lastError = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : void 0,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok && this.shouldRetry(response.status)) {
          const retryAfterMs = this.parseRetryAfter(response.headers.get("Retry-After"));
          const delay = this.calculateDelay(attempt, retryAfterMs);
          const data2 = await response.json().catch(() => ({}));
          const error = data2;
          lastError = new RynkoError(
            error.message || `HTTP ${response.status}`,
            error.error || "ApiError",
            response.status
          );
          if (attempt < maxAttempts - 1) {
            await this.sleep(delay);
            continue;
          }
        }
        const data = await response.json();
        if (!response.ok) {
          const error = data;
          throw new RynkoError(
            error.message || `HTTP ${response.status}`,
            error.error || "ApiError",
            response.status
          );
        }
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof RynkoError) {
          if (!this.shouldRetry(error.statusCode) || attempt >= maxAttempts - 1) {
            throw error;
          }
          lastError = error;
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          continue;
        }
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new RynkoError("Request timeout", "TimeoutError", 408);
          }
          throw new RynkoError(error.message, "NetworkError", 0);
        }
        throw new RynkoError("Unknown error", "UnknownError", 0);
      }
    }
    if (lastError) {
      throw lastError;
    }
    throw new RynkoError("Request failed after retries", "RetryExhausted", 0);
  }
  async get(path, query) {
    return this.request("GET", path, { query });
  }
  async post(path, body) {
    return this.request("POST", path, { body });
  }
  async put(path, body) {
    return this.request("PUT", path, { body });
  }
  async patch(path, body) {
    return this.request("PATCH", path, { body });
  }
  async delete(path) {
    return this.request("DELETE", path);
  }
};
var RynkoError = class extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = "RynkoError";
    this.code = code;
    this.statusCode = statusCode;
  }
};

// src/resources/documents.ts
var DocumentsResource = class {
  constructor(http) {
    this.http = http;
  }
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
   *   // Optional: attach metadata for tracking
   *   metadata: {
   *     orderId: 'ord_12345',
   *     customerId: 'cust_67890',
   *   },
   * });
   * console.log('Job ID:', result.jobId);
   *
   * // Metadata is returned in job status and webhook payloads
   * const job = await rynko.documents.waitForCompletion(result.jobId);
   * console.log('Download URL:', job.downloadUrl);
   * console.log('Metadata:', job.metadata); // { orderId: 'ord_12345', ... }
   * ```
   */
  async generate(options) {
    return this.http.post(
      "/api/v1/documents/generate",
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
  async generatePdf(options) {
    return this.generate({ ...options, format: "pdf" });
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
  async generateExcel(options) {
    return this.generate({ ...options, format: "excel" });
  }
  /**
   * Generate multiple documents in a batch
   *
   * @example
   * ```typescript
   * const result = await rynko.documents.generateBatch({
   *   templateId: 'tmpl_invoice',
   *   format: 'pdf',
   *   // Optional: batch-level metadata
   *   metadata: {
   *     batchRunId: 'run_20250115',
   *     triggeredBy: 'scheduled_job',
   *   },
   *   documents: [
   *     {
   *       variables: { invoiceNumber: 'INV-001', total: 99.99 },
   *       metadata: { rowNumber: 1 },  // per-document metadata
   *     },
   *     {
   *       variables: { invoiceNumber: 'INV-002', total: 149.99 },
   *       metadata: { rowNumber: 2 },
   *     },
   *   ],
   * });
   * console.log('Batch ID:', result.batchId);
   * ```
   */
  async generateBatch(options) {
    return this.http.post(
      "/api/v1/documents/generate/batch",
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
  async getJob(jobId) {
    return this.http.get(`/api/v1/documents/jobs/${jobId}`);
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
  async listJobs(options = {}) {
    const response = await this.http.get(
      "/api/v1/documents/jobs",
      {
        status: options.status,
        templateId: options.templateId,
        workspaceId: options.workspaceId,
        limit: options.limit,
        offset: options.offset ?? ((options.page ?? 1) - 1) * (options.limit ?? 20)
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
        totalPages: Math.ceil(response.total / limit)
      }
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
  async waitForCompletion(jobId, options = {}) {
    const pollInterval = options.pollInterval || 1e3;
    const timeout = options.timeout || 3e4;
    const startTime = Date.now();
    while (true) {
      const job = await this.getJob(jobId);
      if (job.status === "completed" || job.status === "failed") {
        return job;
      }
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for job ${jobId} to complete`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
};

// src/resources/templates.ts
var TemplatesResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get a template by ID
   *
   * @example
   * ```typescript
   * const template = await rynko.templates.get('tmpl_abc123');
   * console.log('Template:', template.name);
   * console.log('Variables:', template.variables);
   * ```
   */
  async get(id) {
    return this.http.get(`/api/templates/${id}`);
  }
  /**
   * List templates with optional filters
   *
   * @example
   * ```typescript
   * // List all templates
   * const { data } = await rynko.templates.list();
   *
   * // List with pagination
   * const { data, meta } = await rynko.templates.list({ page: 1, limit: 10 });
   * ```
   */
  async list(options = {}) {
    const response = await this.http.get(
      "/api/templates/attachment",
      {
        limit: options.limit,
        page: options.page,
        search: options.search
      }
    );
    return {
      data: response.data,
      meta: {
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      }
    };
  }
  /**
   * List only PDF templates
   *
   * Note: Filtering by type is done client-side based on outputFormats.
   *
   * @example
   * ```typescript
   * const { data } = await rynko.templates.listPdf();
   * ```
   */
  async listPdf(options = {}) {
    const result = await this.list(options);
    result.data = result.data.filter(
      (t) => t.outputFormats?.includes("pdf")
    );
    return result;
  }
  /**
   * List only Excel templates
   *
   * Note: Filtering by type is done client-side based on outputFormats.
   *
   * @example
   * ```typescript
   * const { data } = await rynko.templates.listExcel();
   * ```
   */
  async listExcel(options = {}) {
    const result = await this.list(options);
    result.data = result.data.filter(
      (t) => t.outputFormats?.includes("xlsx") || t.outputFormats?.includes("excel")
    );
    return result;
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get a webhook subscription by ID
   *
   * @example
   * ```typescript
   * const webhook = await rynko.webhooks.get('wh_abc123');
   * console.log('Events:', webhook.events);
   * ```
   */
  async get(id) {
    return this.http.get(
      `/api/v1/webhook-subscriptions/${id}`
    );
  }
  /**
   * List all webhook subscriptions
   *
   * @example
   * ```typescript
   * const { data } = await rynko.webhooks.list();
   * console.log('Active webhooks:', data.filter(w => w.isActive).length);
   * ```
   */
  async list() {
    const response = await this.http.get(
      "/api/v1/webhook-subscriptions"
    );
    return {
      data: response.data,
      meta: {
        total: response.total,
        page: 1,
        limit: response.data.length,
        totalPages: 1
      }
    };
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.rynko.dev";
var DEFAULT_TIMEOUT = 3e4;
var Rynko = class {
  /**
   * Create a new Rynko client
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
   * ```
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }
    this.http = new HttpClient({
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      apiKey: config.apiKey,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: config.headers,
      retry: config.retry
    });
    this.documents = new DocumentsResource(this.http);
    this.templates = new TemplatesResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
  }
  /**
   * Get the current authenticated user
   *
   * @example
   * ```typescript
   * const user = await rynko.me();
   * console.log('Authenticated as:', user.email);
   * ```
   */
  async me() {
    return this.http.get("/api/auth/verify");
  }
  /**
   * Verify the API key is valid
   *
   * @example
   * ```typescript
   * const isValid = await rynko.verifyApiKey();
   * if (!isValid) {
   *   throw new Error('Invalid API key');
   * }
   * ```
   */
  async verifyApiKey() {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  }
};
function createClient(config) {
  return new Rynko(config);
}

// src/utils/webhooks.ts
var import_crypto = require("crypto");
function parseSignatureHeader(header) {
  const parts = header.split(",");
  const parsed = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") {
      parsed.timestamp = parseInt(value, 10);
    } else if (key === "v1") {
      parsed.signature = value;
    }
  }
  if (!parsed.timestamp || !parsed.signature) {
    throw new WebhookSignatureError("Invalid signature header format");
  }
  return parsed;
}
function computeSignature(timestamp, payload, secret) {
  const signedPayload = `${timestamp}.${payload}`;
  return (0, import_crypto.createHmac)("sha256", secret).update(signedPayload).digest("hex");
}
function verifyWebhookSignature(options) {
  const { payload, signature, secret, tolerance = 300 } = options;
  const { timestamp, signature: expectedSig } = parseSignatureHeader(signature);
  const now = Math.floor(Date.now() / 1e3);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new WebhookSignatureError(
      "Webhook timestamp outside tolerance window"
    );
  }
  const computedSig = computeSignature(timestamp, payload, secret);
  const sigBuffer = Buffer.from(expectedSig, "hex");
  const computedBuffer = Buffer.from(computedSig, "hex");
  if (sigBuffer.length !== computedBuffer.length) {
    throw new WebhookSignatureError("Invalid signature");
  }
  if (!(0, import_crypto.timingSafeEqual)(sigBuffer, computedBuffer)) {
    throw new WebhookSignatureError("Invalid signature");
  }
  try {
    return JSON.parse(payload);
  } catch {
    throw new WebhookSignatureError("Invalid webhook payload");
  }
}
var WebhookSignatureError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "WebhookSignatureError";
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DocumentsResource,
  Rynko,
  RynkoError,
  TemplatesResource,
  WebhookSignatureError,
  WebhooksResource,
  computeSignature,
  createClient,
  parseSignatureHeader,
  verifyWebhookSignature
});
