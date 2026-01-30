/**
 * Batch Document Generation Example
 *
 * This example shows how to generate multiple documents in a single request.
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

  // Generate multiple documents
  const batch = await client.documents.generateBatch({
    templateId: template.id,
    format: 'pdf',
    documents: [
      { invoiceNumber: 'INV-001', customerName: 'Alice', total: 150.0 },
      { invoiceNumber: 'INV-002', customerName: 'Bob', total: 275.5 },
      { invoiceNumber: 'INV-003', customerName: 'Charlie', total: 89.99 },
    ],
  });

  console.log(`Batch queued: ${batch.batchId}`);
  console.log(`Total jobs: ${batch.totalJobs}`);
  console.log(`Status: ${batch.status}`);
  console.log(`Estimated wait: ${batch.estimatedWaitSeconds} seconds`);

  // Note: Use webhooks to get notified when batch completes
  // Or poll the individual job statuses
}

main().catch(console.error);
