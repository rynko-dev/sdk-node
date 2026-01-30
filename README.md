# @rynko/sdk

Official Node.js SDK for [Rynko](https://rynko.dev) - the document generation platform with unified template design for PDF and Excel documents.

[![npm version](https://img.shields.io/npm/v/@rynko/sdk.svg)](https://www.npmjs.com/package/@rynko/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Authentication](#authentication)
- [Document Generation](#document-generation)
  - [Generate PDF](#generate-pdf)
  - [Generate Excel](#generate-excel)
  - [Generate with Options](#generate-with-options)
  - [Batch Generation](#batch-generation)
  - [Wait for Completion](#wait-for-completion)
- [Document Jobs](#document-jobs)
  - [Get Job Status](#get-job-status)
  - [List Jobs](#list-jobs)
- [Templates](#templates)
  - [List Templates](#list-templates)
  - [Get Template Details](#get-template-details)
- [Webhooks](#webhooks)
  - [List Webhooks](#list-webhooks)
  - [Verify Webhook Signatures](#verify-webhook-signatures)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [API Reference](#api-reference)
- [Requirements](#requirements)
- [Support](#support)

## Installation

```bash
npm install @rynko/sdk
# or
yarn add @rynko/sdk
# or
pnpm add @rynko/sdk
```

## Quick Start

```typescript
import { Rynko } from '@rynko/sdk';

const rynko = new Rynko({
  apiKey: process.env.RYNKO_API_KEY!,
});

// Generate a PDF document (async - returns job info immediately)
const job = await rynko.documents.generatePdf({
  templateId: 'tmpl_invoice',
  variables: {
    customerName: 'John Doe',
    invoiceNumber: 'INV-001',
    total: 150.00,
  },
});

console.log('Job ID:', job.jobId);
console.log('Status:', job.status);  // 'queued'

// Wait for completion to get the download URL
const completed = await rynko.documents.waitForCompletion(job.jobId);
console.log('Download URL:', completed.downloadUrl);
```

## Features

- **Full TypeScript support** with comprehensive type definitions
- **Promise-based API** for modern async/await usage
- **PDF generation** - Generate PDF documents from templates
- **Excel generation** - Generate Excel spreadsheets from templates
- **Batch generation** - Generate multiple documents in a single request
- **Workspace support** - Generate documents in specific workspaces
- **Webhook verification** - Secure HMAC signature verification for incoming webhooks
- **Polling utility** - Built-in `waitForCompletion()` method with configurable timeout
- **Automatic retries** - Configurable retry logic for transient failures

## Authentication

### Get an API Key

1. Log in to your [Rynko Dashboard](https://app.rynko.dev)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Copy the key and store it securely (it won't be shown again)

### Initialize the Client

```typescript
import { Rynko } from '@rynko/sdk';

// Using environment variable (recommended)
const rynko = new Rynko({
  apiKey: process.env.RYNKO_API_KEY!,
});

// Verify authentication
const user = await rynko.me();
console.log('Authenticated as:', user.email);
console.log('Team:', user.teamName);
```

### Verify API Key

```typescript
// Check if API key is valid
const isValid = await rynko.verifyApiKey();
console.log('API Key valid:', isValid);
```

## Document Generation

Document generation in Rynko is **asynchronous**. When you call a generate method, the job is queued for processing and you receive a job ID immediately. Use `waitForCompletion()` to poll until the document is ready.

### Generate PDF

```typescript
// Queue PDF generation
const job = await rynko.documents.generatePdf({
  templateId: 'tmpl_invoice',
  variables: {
    invoiceNumber: 'INV-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    items: [
      { description: 'Product A', quantity: 2, price: 50.00 },
      { description: 'Product B', quantity: 1, price: 50.00 },
    ],
    subtotal: 150.00,
    tax: 15.00,
    total: 165.00,
  },
});

console.log('Job queued:', job.jobId);
console.log('Status:', job.status);  // 'queued'

// Wait for completion
const completed = await rynko.documents.waitForCompletion(job.jobId);
console.log('Download URL:', completed.downloadUrl);
```

### Generate Excel

```typescript
const job = await rynko.documents.generateExcel({
  templateId: 'tmpl_sales_report',
  variables: {
    reportTitle: 'Q1 2026 Sales Report',
    reportDate: '2026-03-31',
    salesData: [
      { region: 'North', q1: 125000, q2: 0, q3: 0, q4: 0 },
      { region: 'South', q1: 98000, q2: 0, q3: 0, q4: 0 },
      { region: 'East', q1: 145000, q2: 0, q3: 0, q4: 0 },
      { region: 'West', q1: 112000, q2: 0, q3: 0, q4: 0 },
    ],
    totalSales: 480000,
  },
});

const completed = await rynko.documents.waitForCompletion(job.jobId);
console.log('Excel file ready:', completed.downloadUrl);
```

### Generate with Options

The `generate()` method supports all document formats and advanced options:

```typescript
const job = await rynko.documents.generate({
  // Required
  templateId: 'tmpl_contract',
  format: 'pdf',  // 'pdf' | 'excel' | 'csv'

  // Template variables
  variables: {
    contractNumber: 'CTR-2026-001',
    clientName: 'Acme Corporation',
    startDate: '2026-02-01',
    endDate: '2027-01-31',
  },

  // Optional settings
  filename: 'contract-acme-2026',  // Custom filename (without extension)
  workspaceId: 'ws_abc123',        // Generate in specific workspace
  webhookUrl: 'https://your-app.com/webhooks/document-ready',  // Webhook notification
  metadata: {                       // Custom metadata (passed to webhook)
    orderId: 'ORD-12345',
    userId: 'user_abc',
  },
  useDraft: false,                  // Use draft template version (for testing)
  useCredit: false,                 // Force use of purchased credits
});
```

### Batch Generation

Generate multiple documents from a single template:

```typescript
// Each object in the documents array contains variables for one document
const batch = await rynko.documents.generateBatch({
  templateId: 'tmpl_invoice',
  format: 'pdf',
  documents: [
    {
      invoiceNumber: 'INV-001',
      customerName: 'John Doe',
      total: 150.00,
    },
    {
      invoiceNumber: 'INV-002',
      customerName: 'Jane Smith',
      total: 275.50,
    },
    {
      invoiceNumber: 'INV-003',
      customerName: 'Bob Wilson',
      total: 89.99,
    },
  ],
  webhookUrl: 'https://your-app.com/webhooks/batch-complete',
});

console.log('Batch ID:', batch.batchId);
console.log('Total jobs:', batch.totalJobs);  // 3
console.log('Status:', batch.status);  // 'queued'
console.log('Estimated wait:', batch.estimatedWaitSeconds, 'seconds');
```

### Wait for Completion

The `waitForCompletion()` method polls the job status until it completes or fails:

```typescript
// Default settings (1 second interval, 30 second timeout)
const completed = await rynko.documents.waitForCompletion(job.jobId);

// Custom polling settings
const completed = await rynko.documents.waitForCompletion(job.jobId, {
  pollInterval: 2000,   // Check every 2 seconds
  timeout: 60000,       // Wait up to 60 seconds
});

// Check result
if (completed.status === 'completed') {
  console.log('Download URL:', completed.downloadUrl);
  console.log('File size:', completed.fileSize, 'bytes');
  console.log('Expires at:', completed.downloadUrlExpiresAt);
} else if (completed.status === 'failed') {
  console.error('Generation failed:', completed.errorMessage);
  console.error('Error code:', completed.errorCode);
}
```

## Document Jobs

### Get Job Status

```typescript
const job = await rynko.documents.getJob('job_abc123');

console.log('Status:', job.status);
// Possible values: 'queued' | 'processing' | 'completed' | 'failed'

console.log('Template:', job.templateName);
console.log('Format:', job.format);
console.log('Created:', job.createdAt);

if (job.status === 'completed') {
  console.log('Download URL:', job.downloadUrl);
  console.log('File size:', job.fileSize);
  console.log('URL expires:', job.downloadUrlExpiresAt);
}

if (job.status === 'failed') {
  console.log('Error:', job.errorMessage);
  console.log('Error code:', job.errorCode);
}
```

### List Jobs

```typescript
// List recent jobs with pagination
const { data: jobs, meta } = await rynko.documents.listJobs({
  limit: 20,
  page: 1,
});

console.log('Total jobs:', meta.total);
console.log('Pages:', meta.totalPages);

for (const job of jobs) {
  console.log(`${job.jobId}: ${job.status} - ${job.templateName}`);
}

// Filter by status
const { data: completedJobs } = await rynko.documents.listJobs({
  status: 'completed',
});

// Filter by format
const { data: pdfJobs } = await rynko.documents.listJobs({
  format: 'pdf',
});

// Filter by template
const { data: invoiceJobs } = await rynko.documents.listJobs({
  templateId: 'tmpl_invoice',
});

// Filter by workspace
const { data: workspaceJobs } = await rynko.documents.listJobs({
  workspaceId: 'ws_abc123',
});

// Filter by date range
const { data: recentJobs } = await rynko.documents.listJobs({
  dateFrom: new Date('2026-01-01'),
  dateTo: new Date('2026-01-31'),
});

// Combine filters
const { data: filteredJobs } = await rynko.documents.listJobs({
  status: 'completed',
  format: 'pdf',
  templateId: 'tmpl_invoice',
  limit: 50,
});
```

## Templates

### List Templates

```typescript
// List all templates
const { data: templates, meta } = await rynko.templates.list();

console.log('Total templates:', meta.total);

for (const template of templates) {
  console.log(`${template.id}: ${template.name} (${template.type})`);
}

// Paginated list
const { data: page2 } = await rynko.templates.list({
  page: 2,
  limit: 10,
});

// Search by name
const { data: invoiceTemplates } = await rynko.templates.list({
  search: 'invoice',
});

// List PDF templates only
const { data: pdfTemplates } = await rynko.templates.listPdf();

// List Excel templates only
const { data: excelTemplates } = await rynko.templates.listExcel();
```

### Get Template Details

```typescript
// Get template by ID (supports UUID, shortId, or slug)
const template = await rynko.templates.get('tmpl_invoice');

console.log('Template:', template.name);
console.log('Type:', template.type);  // 'pdf' | 'excel'
console.log('Description:', template.description);
console.log('Created:', template.createdAt);
console.log('Updated:', template.updatedAt);

// View template variables
if (template.variables) {
  console.log('\nVariables:');
  for (const variable of template.variables) {
    console.log(`  ${variable.name} (${variable.type})`);
    console.log(`    Required: ${variable.required ?? false}`);
    if (variable.defaultValue !== undefined) {
      console.log(`    Default: ${JSON.stringify(variable.defaultValue)}`);
    }
  }
}
```

## Webhooks

Webhook subscriptions are managed through the [Rynko Dashboard](https://app.rynko.dev). The SDK provides read-only access to view webhooks and utilities for signature verification.

### List Webhooks

```typescript
const { data: webhooks, meta } = await rynko.webhooks.list();

for (const webhook of webhooks) {
  console.log(`${webhook.id}: ${webhook.url}`);
  console.log(`  Events: ${webhook.events.join(', ')}`);
  console.log(`  Active: ${webhook.isActive}`);
  console.log(`  Created: ${webhook.createdAt}`);
}
```

### Get Webhook Details

```typescript
const webhook = await rynko.webhooks.get('wh_abc123');

console.log('URL:', webhook.url);
console.log('Events:', webhook.events);
console.log('Active:', webhook.isActive);
console.log('Description:', webhook.description);
```

### Verify Webhook Signatures

When receiving webhooks, always verify the signature to ensure the request came from Rynko:

```typescript
import { verifyWebhookSignature, WebhookSignatureError } from '@rynko/sdk';

// Express.js example
app.post('/webhooks/rynko', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-rynko-signature'] as string;
  const timestamp = req.headers['x-rynko-timestamp'] as string;

  try {
    const event = verifyWebhookSignature({
      payload: req.body.toString(),
      signature,
      timestamp,  // Optional but recommended for replay protection
      secret: process.env.WEBHOOK_SECRET!,
    });

    // Process the verified event
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Timestamp:', event.timestamp);

    switch (event.type) {
      case 'document.generated':
        const { jobId, downloadUrl, templateId } = event.data;
        console.log(`Document ${jobId} ready: ${downloadUrl}`);
        // Download or process the document
        break;

      case 'document.failed':
        const { jobId: failedJobId, error, errorCode } = event.data;
        console.error(`Document ${failedJobId} failed: ${error}`);
        // Handle failure (retry, notify user, etc.)
        break;

      case 'document.downloaded':
        const { jobId: downloadedJobId } = event.data;
        console.log(`Document ${downloadedJobId} was downloaded`);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.status(200).send('OK');
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      console.error('Invalid webhook signature:', error.message);
      res.status(401).send('Invalid signature');
    } else {
      console.error('Webhook processing error:', error);
      res.status(500).send('Internal error');
    }
  }
});
```

#### Webhook Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `document.generated` | Document successfully generated | `jobId`, `templateId`, `format`, `downloadUrl`, `fileSize` |
| `document.failed` | Document generation failed | `jobId`, `templateId`, `error`, `errorCode` |
| `document.downloaded` | Document was downloaded | `jobId`, `downloadedAt` |

#### Webhook Headers

Rynko sends these headers with each webhook request:

| Header | Description |
|--------|-------------|
| `X-Rynko-Signature` | HMAC-SHA256 signature (format: `v1=<hex>`) |
| `X-Rynko-Timestamp` | Unix timestamp when the webhook was sent |
| `X-Rynko-Event-Id` | Unique event identifier |
| `X-Rynko-Event-Type` | Event type (e.g., `document.generated`) |

#### Low-Level Signature Utilities

For advanced use cases, you can use the low-level signature utilities:

```typescript
import { parseSignatureHeader, computeSignature } from '@rynko/sdk';

// Parse the signature header
const { timestamp, signatures } = parseSignatureHeader(signatureHeader);

// Compute expected signature
const expectedSignature = computeSignature(timestamp, payload, secret);

// Compare signatures
const isValid = signatures.some(sig => sig === expectedSignature);
```

## Configuration

```typescript
const rynko = new Rynko({
  // Required: Your API key
  apiKey: process.env.RYNKO_API_KEY!,

  // Optional: Custom base URL (default: https://api.rynko.dev)
  baseUrl: 'https://api.rynko.dev',

  // Optional: Request timeout in milliseconds (default: 30000)
  timeout: 30000,

  // Optional: Custom headers for all requests
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Environment Variables

We recommend using environment variables for configuration:

```bash
# .env
RYNKO_API_KEY=your_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here
```

```typescript
import 'dotenv/config';
import { Rynko } from '@rynko/sdk';

const rynko = new Rynko({
  apiKey: process.env.RYNKO_API_KEY!,
});
```

## Error Handling

```typescript
import { Rynko, RynkoError } from '@rynko/sdk';

const rynko = new Rynko({ apiKey: 'your_api_key' });

try {
  const job = await rynko.documents.generatePdf({
    templateId: 'invalid_template',
    variables: {},
  });
} catch (error) {
  if (error instanceof RynkoError) {
    console.error('API Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Status Code:', error.statusCode);

    // Handle specific error codes
    switch (error.code) {
      case 'ERR_TMPL_001':
        console.error('Template not found');
        break;
      case 'ERR_TMPL_003':
        console.error('Template validation failed');
        break;
      case 'ERR_QUOTA_001':
        console.error('Document quota exceeded - upgrade your plan');
        break;
      case 'ERR_AUTH_001':
        console.error('Invalid API key');
        break;
      case 'ERR_AUTH_004':
        console.error('API key expired or revoked');
        break;
      default:
        console.error('Unknown error');
    }
  } else {
    // Network error or other non-API error
    throw error;
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `ERR_AUTH_001` | Invalid credentials / API key |
| `ERR_AUTH_004` | Token expired or revoked |
| `ERR_TMPL_001` | Template not found |
| `ERR_TMPL_003` | Template validation failed |
| `ERR_DOC_001` | Document job not found |
| `ERR_DOC_004` | Document generation failed |
| `ERR_QUOTA_001` | Document quota exceeded |
| `ERR_QUOTA_002` | Rate limit exceeded |

## TypeScript Support

This SDK is written in TypeScript and includes comprehensive type definitions:

```typescript
import {
  Rynko,
  RynkoError,
  verifyWebhookSignature,
  WebhookSignatureError,
} from '@rynko/sdk';

import type {
  // Configuration
  RynkoConfig,

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
} from '@rynko/sdk';

// Type-safe document generation
const options: GenerateDocumentOptions = {
  templateId: 'tmpl_invoice',
  format: 'pdf',
  variables: {
    invoiceNumber: 'INV-001',
    items: [{ name: 'Widget', price: 29.99 }],
  },
  workspaceId: 'ws_abc123',  // Optional
};

const result: GenerateDocumentResponse = await rynko.documents.generate(options);
```

## API Reference

### Client Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `me()` | `Promise<User>` | Get current authenticated user |
| `verifyApiKey()` | `Promise<boolean>` | Verify API key is valid |

### Documents Resource

| Method | Returns | Description |
|--------|---------|-------------|
| `generate(options)` | `Promise<GenerateDocumentResponse>` | Generate a document (PDF, Excel, or CSV) |
| `generatePdf(options)` | `Promise<GenerateDocumentResponse>` | Generate a PDF document |
| `generateExcel(options)` | `Promise<GenerateDocumentResponse>` | Generate an Excel document |
| `generateBatch(options)` | `Promise<GenerateBatchResponse>` | Generate multiple documents |
| `getJob(jobId)` | `Promise<DocumentJob>` | Get document job by ID |
| `listJobs(options?)` | `Promise<{ data: DocumentJob[]; meta: PaginationMeta }>` | List/search document jobs |
| `waitForCompletion(jobId, options?)` | `Promise<DocumentJob>` | Poll until job completes or fails |

### Templates Resource

| Method | Returns | Description |
|--------|---------|-------------|
| `get(templateId)` | `Promise<Template>` | Get template by ID (UUID, shortId, or slug) |
| `list(options?)` | `Promise<{ data: Template[]; meta: PaginationMeta }>` | List all templates |
| `listPdf(options?)` | `Promise<{ data: Template[]; meta: PaginationMeta }>` | List PDF templates only |
| `listExcel(options?)` | `Promise<{ data: Template[]; meta: PaginationMeta }>` | List Excel templates only |

### Webhooks Resource

| Method | Returns | Description |
|--------|---------|-------------|
| `get(webhookId)` | `Promise<WebhookSubscription>` | Get webhook subscription by ID |
| `list()` | `Promise<{ data: WebhookSubscription[]; meta: PaginationMeta }>` | List all webhook subscriptions |

### Utilities

| Function | Returns | Description |
|----------|---------|-------------|
| `verifyWebhookSignature(options)` | `WebhookEvent` | Verify signature and parse webhook event |
| `parseSignatureHeader(header)` | `{ timestamp: string; signatures: string[] }` | Parse signature header |
| `computeSignature(timestamp, payload, secret)` | `string` | Compute expected signature |

## Examples

See the [`examples/`](./examples) directory for runnable code samples:

- [basic-generate.ts](./examples/basic-generate.ts) - Generate a PDF and wait for completion
- [batch-generate.ts](./examples/batch-generate.ts) - Generate multiple documents
- [webhook-handler.ts](./examples/webhook-handler.ts) - Express webhook endpoint
- [error-handling.ts](./examples/error-handling.ts) - Handle API errors

For complete project templates with full setup, see the [developer-resources](https://github.com/rynko-dev/developer-resources) repository.

## Requirements

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm

## License

MIT

## Support

- **Documentation**: https://docs.rynko.dev/sdk/node
- **API Reference**: https://docs.rynko.dev/api
- **Examples**: https://github.com/rynko-dev/developer-resources
- **GitHub Issues**: https://github.com/rynko-dev/sdk-node/issues
- **Email**: support@rynko.dev
