/**
 * Basic Document Generation Example
 *
 * This example shows how to generate a PDF document and wait for completion.
 *
 * Usage:
 *   RYNKO_API_KEY=your_key npx tsx examples/basic-generate.ts
 */

import { Rynko } from '../src';

async function main() {
  const client = new Rynko({
    apiKey: process.env.RYNKO_API_KEY!,
  });

  // Verify authentication
  const user = await client.me();
  console.log(`Authenticated as: ${user.email}`);

  // Get first available template
  const { data: templates } = await client.templates.list({ limit: 1 });
  if (templates.length === 0) {
    console.error('No templates found. Create a template first.');
    process.exit(1);
  }

  const template = templates[0];
  console.log(`Using template: ${template.name} (${template.id})`);

  // Queue document generation
  const job = await client.documents.generatePdf({
    templateId: template.id,
    variables: {
      // Use template's default values or provide your own
      title: 'Example Document',
      date: new Date().toISOString().split('T')[0],
    },
  });

  console.log(`Job queued: ${job.jobId}`);
  console.log(`Status: ${job.status}`);

  // Wait for completion
  console.log('Waiting for completion...');
  const completed = await client.documents.waitForCompletion(job.jobId, {
    pollInterval: 1000,
    timeout: 60000,
  });

  if (completed.status === 'completed') {
    console.log('Document generated successfully!');
    console.log(`Download URL: ${completed.downloadUrl}`);
  } else {
    console.error(`Generation failed: ${completed.errorMessage}`);
  }
}

main().catch(console.error);
