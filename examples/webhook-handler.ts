/**
 * Webhook Handler Example
 *
 * This example shows how to verify and handle Rynko webhook events.
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
import { verifyWebhookSignature, WebhookSignatureError } from '../src';

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
      case 'document.generated':
        const generated = event.data as { jobId: string; downloadUrl: string };
        console.log(`Document ready: ${generated.downloadUrl}`);
        break;

      case 'document.failed':
        const failed = event.data as { jobId: string; error: string };
        console.error(`Document failed: ${failed.error}`);
        break;

      case 'document.downloaded':
        const downloaded = event.data as { jobId: string };
        console.log(`Document downloaded: ${downloaded.jobId}`);
        break;
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
});
