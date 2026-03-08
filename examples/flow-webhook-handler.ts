/**
 * Flow Webhook Handler Example
 *
 * This example shows how to verify and handle Flow-specific webhook events
 * using an Express server. Flow events notify you about run status changes,
 * approvals, and delivery outcomes.
 *
 * Usage:
 *   WEBHOOK_SECRET=your_secret npx tsx examples/flow-webhook-handler.ts
 *
 * Then configure your gate's webhook URL to point to:
 *   http://your-server:3000/webhooks/flow
 *
 * Test with curl:
 *   curl -X POST http://localhost:3000/webhooks/flow \
 *     -H "Content-Type: application/json" \
 *     -H "X-Rynko-Signature: t=...,v1=..." \
 *     -d '{"type":"flow.run.completed","id":"evt_123",...}'
 */

import express from 'express';
import {
  verifyWebhookSignature,
  WebhookSignatureError,
} from '../src';

const app = express();
const port = process.env.PORT || 3000;

// Use raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

app.post('/webhooks/flow', (req, res) => {
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
      case 'flow.run.completed': {
        // A run finished validation (approved or rejected)
        const data = event.data as Record<string, any>;
        console.log('Run completed!');
        console.log(`  Run ID: ${data.runId}`);
        console.log(`  Gate ID: ${data.gateId}`);
        console.log(`  Status: ${data.status}`);

        if (data.status === 'approved') {
          console.log('  Result: Data passed validation');
          if (data.output) {
            console.log(`  Output: ${JSON.stringify(data.output)}`);
          }
        } else if (data.status === 'rejected') {
          console.log('  Result: Data failed validation');
          if (data.errors) {
            for (const error of data.errors) {
              const fieldPrefix = error.field ? `[${error.field}] ` : '';
              console.log(`  Error: ${fieldPrefix}${error.message}`);
            }
          }
        }

        // Access metadata to correlate with your system
        if (data.metadata) {
          console.log(`  Metadata: ${JSON.stringify(data.metadata)}`);
          console.log(`  Order ID: ${data.metadata.orderId}`);
        }
        break;
      }

      case 'flow.run.approved': {
        // A run was explicitly approved (possibly after manual review)
        const data = event.data as Record<string, any>;
        console.log('Run approved!');
        console.log(`  Run ID: ${data.runId}`);
        console.log(`  Gate ID: ${data.gateId}`);

        if (data.reviewerEmail) {
          console.log(`  Approved by: ${data.reviewerEmail}`);
        }
        if (data.reviewerNote) {
          console.log(`  Note: ${data.reviewerNote}`);
        }

        if (data.metadata) {
          console.log(`  Metadata: ${JSON.stringify(data.metadata)}`);
        }

        // Proceed with the approved data in your workflow
        // e.g., create an order, send a confirmation, etc.
        break;
      }

      case 'flow.run.rejected': {
        // A run was rejected
        const data = event.data as Record<string, any>;
        console.error('Run rejected!');
        console.error(`  Run ID: ${data.runId}`);
        console.error(`  Gate ID: ${data.gateId}`);

        if (data.errors) {
          console.error('  Validation errors:');
          for (const error of data.errors) {
            const fieldPrefix = error.field ? `[${error.field}] ` : '';
            console.error(`    - ${fieldPrefix}${error.message}`);
          }
        }

        if (data.reason) {
          console.error(`  Rejection reason: ${data.reason}`);
        }

        if (data.metadata) {
          console.error(`  Metadata: ${JSON.stringify(data.metadata)}`);
          // Use metadata to identify which request failed
          // e.g., notify the user, log the failure, etc.
        }
        break;
      }

      case 'flow.delivery.failed': {
        // A delivery webhook failed (your endpoint did not respond)
        const data = event.data as Record<string, any>;
        console.error('Delivery failed!');
        console.error(`  Delivery ID: ${data.deliveryId}`);
        console.error(`  Run ID: ${data.runId}`);
        console.error(`  URL: ${data.url}`);
        console.error(`  HTTP Status: ${data.httpStatus}`);
        console.error(`  Attempts: ${data.attempts}`);

        if (data.error) {
          console.error(`  Error: ${data.error}`);
        }

        // You can retry the delivery using the SDK:
        // await client.flow.retryDelivery(data.deliveryId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
  console.log(`Flow webhook server listening on http://localhost:${port}`);
  console.log(`Endpoint: POST /webhooks/flow`);
  console.log();
  console.log('Supported event types:');
  console.log('  - flow.run.completed:    Run finished validation');
  console.log('  - flow.run.approved:     Run was approved');
  console.log('  - flow.run.rejected:     Run was rejected');
  console.log('  - flow.delivery.failed:  Delivery webhook failed');
});
