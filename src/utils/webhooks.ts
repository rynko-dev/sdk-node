/**
 * Webhook Signature Verification Utilities
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { WebhookEvent } from '../types';

export interface VerifyWebhookOptions {
  /** Raw request body as string */
  payload: string;
  /** Signature from X-Rynko-Signature header */
  signature: string;
  /** Webhook secret from your subscription */
  secret: string;
  /** Timestamp tolerance in seconds (default: 300 = 5 minutes) */
  tolerance?: number;
}

export interface ParsedWebhookSignature {
  timestamp: number;
  signature: string;
}

/**
 * Parse the webhook signature header
 */
export function parseSignatureHeader(header: string): ParsedWebhookSignature {
  const parts = header.split(',');
  const parsed: Partial<ParsedWebhookSignature> = {};

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      parsed.timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      parsed.signature = value;
    }
  }

  if (!parsed.timestamp || !parsed.signature) {
    throw new WebhookSignatureError('Invalid signature header format');
  }

  return parsed as ParsedWebhookSignature;
}

/**
 * Compute the expected signature for a webhook payload
 */
export function computeSignature(
  timestamp: number,
  payload: string,
  secret: string
): string {
  const signedPayload = `${timestamp}.${payload}`;
  return createHmac('sha256', secret).update(signedPayload).digest('hex');
}

/**
 * Verify a webhook signature
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@rynko/sdk';
 *
 * app.post('/webhooks/rynko', (req, res) => {
 *   const signature = req.headers['x-rynko-signature'];
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
export function verifyWebhookSignature(options: VerifyWebhookOptions): WebhookEvent {
  const { payload, signature, secret, tolerance = 300 } = options;

  // Parse the signature header
  const { timestamp, signature: expectedSig } = parseSignatureHeader(signature);

  // Check timestamp is within tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new WebhookSignatureError(
      'Webhook timestamp outside tolerance window'
    );
  }

  // Compute expected signature
  const computedSig = computeSignature(timestamp, payload, secret);

  // Compare signatures using timing-safe comparison
  const sigBuffer = Buffer.from(expectedSig, 'hex');
  const computedBuffer = Buffer.from(computedSig, 'hex');

  if (sigBuffer.length !== computedBuffer.length) {
    throw new WebhookSignatureError('Invalid signature');
  }

  if (!timingSafeEqual(sigBuffer, computedBuffer)) {
    throw new WebhookSignatureError('Invalid signature');
  }

  // Parse and return the event
  try {
    return JSON.parse(payload) as WebhookEvent;
  } catch {
    throw new WebhookSignatureError('Invalid webhook payload');
  }
}

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}
