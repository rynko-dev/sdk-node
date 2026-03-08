/**
 * Flow Submit and Wait Example
 *
 * This example shows the core Flow workflow: submit data to a gate
 * for validation, wait for the result, and handle the outcome.
 *
 * Usage:
 *   RYNKO_API_KEY=your_key npx tsx examples/flow-submit-and-wait.ts
 */

import { Rynko } from '../src';

async function main() {
  const client = new Rynko({
    apiKey: process.env.RYNKO_API_KEY!,
  });

  // Step 1: List gates and pick the first published one
  const { data: gates } = await client.flow.listGates({ status: 'published' });
  if (gates.length === 0) {
    console.error('No published gates found. Create and publish a gate first.');
    process.exit(1);
  }

  const gate = gates[0];
  console.log(`Using gate: ${gate.name} (${gate.id})`);

  // Step 2: Submit a run with sample input and metadata
  console.log('\nSubmitting run...');
  const submitted = await client.flow.submitRun(gate.id, {
    input: {
      customerName: 'Jane Smith',
      email: 'jane.smith@example.com',
      orderTotal: 249.99,
      currency: 'USD',
      items: [
        { name: 'Widget Pro', quantity: 2, price: 99.99 },
        { name: 'Gadget Lite', quantity: 1, price: 50.01 },
      ],
    },
    metadata: {
      orderId: 'ord_20260307_001',
      source: 'sdk-example',
      timestamp: new Date().toISOString(),
    },
  });

  console.log(`Run ID: ${submitted.id}`);
  console.log(`Status: ${submitted.status}`);

  // Step 3: Wait for the run to reach a terminal state
  console.log('\nWaiting for validation result...');
  const result = await client.flow.waitForRun(submitted.id, {
    pollInterval: 1000,
    timeout: 60000,
  });

  console.log(`\nFinal status: ${result.status}`);

  // Step 4: Handle the outcome
  switch (result.status) {
    case 'approved':
    case 'completed':
    case 'delivered':
      console.log('Run passed validation!');
      if (result.output) {
        console.log('Output:', JSON.stringify(result.output, null, 2));
      }
      break;

    case 'rejected':
      console.log('Run was rejected.');
      if (result.errors && result.errors.length > 0) {
        console.log('Validation errors:');
        for (const error of result.errors) {
          const fieldPrefix = error.field ? `[${error.field}] ` : '';
          console.log(`  - ${fieldPrefix}${error.message}`);
        }
      }
      break;

    case 'review_required':
      console.log('Run requires manual review.');
      console.log('A reviewer will need to approve or reject this run.');
      break;

    case 'validation_failed':
      console.log('Validation failed due to an internal error.');
      if (result.errors && result.errors.length > 0) {
        for (const error of result.errors) {
          console.log(`  - ${error.message}`);
        }
      }
      break;

    case 'render_failed':
      console.log('Rendering failed after validation passed.');
      break;

    case 'delivery_failed':
      console.log('Delivery failed after validation passed.');
      console.log('You can retry delivery using client.flow.retryDelivery().');
      break;

    default:
      console.log(`Unexpected status: ${result.status}`);
  }

  // Print metadata if present
  if (result.metadata) {
    console.log('\nMetadata:', JSON.stringify(result.metadata, null, 2));
  }
}

main().catch(console.error);
