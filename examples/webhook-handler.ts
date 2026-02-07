/**
 * Webhook Handler Example
 *
 * This example shows how to verify and handle Rynko webhook events,
 * including accessing custom metadata attached to documents.
 *
 * Usage:
 *   WEBHOOK_SECRET=your_secret npx tsx examples/webhook-handler.ts
 *
 * Then send a test webhook:
 *   curl -X POST http://localhost:3000/webhooks/rynko \
 *     -H "Content-Type: application/json" \
 *     -H "X-Rynko-Signature: t=...,v1=..." \
 *     -d '{"type":"document.generated","id":"evt_123",...}'
 */

import express from 'express';
import {
  verifyWebhookSignature,
  WebhookSignatureError,
  type DocumentWebhookData,
  type BatchWebhookData,
} from '../src';

const app = express();
const port = process.env.PORT || 3000;

// Use raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

app.post('/webhooks/rynko', (req, res) => {
  const signature = req.headers['x-rynko-signature'] as string;
  const payload = req.body.toString();

  try {
    const event = verifyWebhookSignature({
      payload,
      signature,
      secret: process.env.WEBHOOK_SECRET!,
    });

    console.log(`Received: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'document.generated': {
        // Use typed interface for document events
        const data = event.data as DocumentWebhookData;
        console.log(`Document ready!`);
        console.log(`  Job ID: ${data.jobId}`);
        console.log(`  Download URL: ${data.downloadUrl}`);

        // Access custom metadata passed in the generate request
        if (data.metadata) {
          console.log(`  Metadata:`, data.metadata);
          console.log(`  Order ID: ${data.metadata.orderId}`);
          console.log(`  Customer ID: ${data.metadata.customerId}`);
          // Use metadata to update your database, trigger workflows, etc.
        }
        break;
      }

      case 'document.failed': {
        const data = event.data as DocumentWebhookData;
        console.error(`Document generation failed!`);
        console.error(`  Job ID: ${data.jobId}`);
        console.error(`  Error: ${data.errorMessage}`);
        console.error(`  Error Code: ${data.errorCode}`);

        // Access metadata to identify which order/customer failed
        if (data.metadata) {
          console.error(`  Failed for order: ${data.metadata.orderId}`);
        }
        break;
      }

      case 'batch.completed': {
        // Use typed interface for batch events
        const data = event.data as BatchWebhookData;
        console.log(`Batch completed!`);
        console.log(`  Batch ID: ${data.batchId}`);
        console.log(`  Total: ${data.totalJobs}`);
        console.log(`  Completed: ${data.completedJobs}`);
        console.log(`  Failed: ${data.failedJobs}`);

        // Access batch-level metadata
        if (data.metadata) {
          console.log(`  Batch run ID: ${data.metadata.batchRunId}`);
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      console.error('Invalid signature:', error.message);
      res.status(401).json({ error: 'Invalid signature' });
    } else {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  }
});

app.listen(port, () => {
  console.log(`Webhook server listening on http://localhost:${port}`);
  console.log(`Endpoint: POST /webhooks/rynko`);
  console.log();
  console.log('Supported event types:');
  console.log('  - document.generated: Document was successfully generated');
  console.log('  - document.failed: Document generation failed');
  console.log('  - batch.completed: Batch of documents completed');
});
