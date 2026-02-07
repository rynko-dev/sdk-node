/**
 * Batch Document Generation Example
 *
 * This example shows how to generate multiple documents in a single request,
 * with both batch-level and per-document metadata for tracking.
 *
 * Usage:
 *   RYNKO_API_KEY=your_key npx tsx examples/batch-generate.ts
 */

import { Rynko } from '../src';

async function main() {
  const client = new Rynko({
    apiKey: process.env.RYNKO_API_KEY!,
  });

  // Get first available template
  const { data: templates } = await client.templates.list({ limit: 1 });
  if (templates.length === 0) {
    console.error('No templates found. Create a template first.');
    process.exit(1);
  }

  const template = templates[0];
  console.log(`Using template: ${template.name}`);

  // Generate multiple documents with metadata
  const batch = await client.documents.generateBatch({
    templateId: template.id,
    format: 'pdf',
    // Batch-level metadata (applies to the entire batch)
    metadata: {
      batchRunId: 'run_20250202',
      triggeredBy: 'scheduled_job',
    },
    // Each document can have its own variables and metadata
    documents: [
      {
        variables: { invoiceNumber: 'INV-001', customerName: 'Alice', total: 150.0 },
        metadata: { orderId: 'ord_001', customerId: 'cust_alice' },
      },
      {
        variables: { invoiceNumber: 'INV-002', customerName: 'Bob', total: 275.5 },
        metadata: { orderId: 'ord_002', customerId: 'cust_bob' },
      },
      {
        variables: { invoiceNumber: 'INV-003', customerName: 'Charlie', total: 89.99 },
        metadata: { orderId: 'ord_003', customerId: 'cust_charlie' },
      },
    ],
  });

  console.log(`Batch queued: ${batch.batchId}`);
  console.log(`Total jobs: ${batch.totalJobs}`);
  console.log(`Status: ${batch.status}`);
  console.log(`Estimated wait: ${batch.estimatedWaitSeconds} seconds`);
  console.log();
  console.log('Metadata will be returned in webhook payloads:');
  console.log('  - Batch-level metadata in batch.completed event');
  console.log('  - Per-document metadata in each document.generated/failed event');
  console.log();
  console.log('Use metadata to correlate webhook events with your orders.');
}

main().catch(console.error);
