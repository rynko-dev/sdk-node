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
  Renderbase: () => Renderbase,
  RenderbaseError: () => RenderbaseError,
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
var HttpClient = class {
  constructor(config) {
    this.config = config;
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
      "User-Agent": "@renderbase/sdk/1.0.0",
      ...this.config.headers
    };
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
      const data = await response.json();
      if (!response.ok) {
        const error = data;
        throw new RenderbaseError(
          error.message || `HTTP ${response.status}`,
          error.error || "ApiError",
          response.status
        );
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof RenderbaseError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new RenderbaseError("Request timeout", "TimeoutError", 408);
        }
        throw new RenderbaseError(error.message, "NetworkError", 0);
      }
      throw new RenderbaseError("Unknown error", "UnknownError", 0);
    }
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
var RenderbaseError = class extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = "RenderbaseError";
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
  async generate(options) {
    const response = await this.http.post(
      "/api/v1/documents/generate",
      options
    );
    return response.data;
  }
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
  async generatePdf(options) {
    return this.generate({ ...options, format: "pdf" });
  }
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
  async generateExcel(options) {
    return this.generate({ ...options, format: "excel" });
  }
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
  async generateBatch(options) {
    const response = await this.http.post(
      "/api/v1/documents/generate/batch",
      options
    );
    return response.data;
  }
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
  async getJob(jobId) {
    const response = await this.http.get(
      `/api/v1/documents/jobs/${jobId}`
    );
    return response.data;
  }
  /**
   * List document jobs with optional filters
   *
   * @example
   * ```typescript
   * const { data, meta } = await renderbase.documents.listJobs({
   *   status: 'completed',
   *   format: 'pdf',
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
        format: options.format,
        templateId: options.templateId,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        limit: options.limit,
        page: options.page
      }
    );
    return {
      data: response.data,
      meta: response.meta
    };
  }
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
   * const template = await renderbase.templates.get('tmpl_abc123');
   * console.log('Template:', template.name);
   * console.log('Variables:', template.variables);
   * ```
   */
  async get(id) {
    const response = await this.http.get(
      `/api/templates/attachment/${id}`
    );
    return response.data;
  }
  /**
   * List templates with optional filters
   *
   * @example
   * ```typescript
   * // List all PDF templates
   * const { data } = await renderbase.templates.list({ type: 'pdf' });
   *
   * // List all Excel templates
   * const { data: excelTemplates } = await renderbase.templates.list({ type: 'excel' });
   * ```
   */
  async list(options = {}) {
    const response = await this.http.get(
      "/api/templates/attachment",
      {
        type: options.type,
        limit: options.limit,
        page: options.page
      }
    );
    return {
      data: response.data,
      meta: response.meta
    };
  }
  /**
   * List only PDF templates
   *
   * @example
   * ```typescript
   * const { data } = await renderbase.templates.listPdf();
   * ```
   */
  async listPdf(options = {}) {
    return this.list({ ...options, type: "pdf" });
  }
  /**
   * List only Excel templates
   *
   * @example
   * ```typescript
   * const { data } = await renderbase.templates.listExcel();
   * ```
   */
  async listExcel(options = {}) {
    return this.list({ ...options, type: "excel" });
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  constructor(http) {
    this.http = http;
  }
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
  async create(options) {
    const response = await this.http.post(
      "/api/v1/webhook-subscriptions",
      options
    );
    return response.data;
  }
  /**
   * Get a webhook subscription by ID
   *
   * @example
   * ```typescript
   * const webhook = await renderbase.webhooks.get('wh_abc123');
   * console.log('Events:', webhook.events);
   * ```
   */
  async get(id) {
    const response = await this.http.get(
      `/api/v1/webhook-subscriptions/${id}`
    );
    return response.data;
  }
  /**
   * List all webhook subscriptions
   *
   * @example
   * ```typescript
   * const { data } = await renderbase.webhooks.list();
   * console.log('Active webhooks:', data.filter(w => w.active).length);
   * ```
   */
  async list() {
    const response = await this.http.get(
      "/api/v1/webhook-subscriptions"
    );
    return {
      data: response.data,
      meta: response.meta
    };
  }
  /**
   * Delete a webhook subscription
   *
   * @example
   * ```typescript
   * await renderbase.webhooks.delete('wh_abc123');
   * console.log('Webhook deleted');
   * ```
   */
  async delete(id) {
    await this.http.delete(`/api/v1/webhook-subscriptions/${id}`);
  }
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
  async update(id, options) {
    const response = await this.http.patch(
      `/api/v1/webhook-subscriptions/${id}`,
      options
    );
    return response.data;
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.renderbase.dev";
var DEFAULT_TIMEOUT = 3e4;
var Renderbase = class {
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
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }
    this.http = new HttpClient({
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      apiKey: config.apiKey,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: config.headers
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
   * const user = await renderbase.me();
   * console.log('Authenticated as:', user.email);
   * ```
   */
  async me() {
    const response = await this.http.get("/api/auth/verify");
    return response.data;
  }
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
  return new Renderbase(config);
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
  Renderbase,
  RenderbaseError,
  TemplatesResource,
  WebhookSignatureError,
  WebhooksResource,
  computeSignature,
  createClient,
  parseSignatureHeader,
  verifyWebhookSignature
});
