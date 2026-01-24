/**
 * Renderbase Node.js SDK Integration Tests
 *
 * Run these tests against a live API to verify SDK functionality.
 *
 * Prerequisites:
 * 1. Set RENDERBASE_API_KEY environment variable
 * 2. Set RENDERBASE_API_URL environment variable (optional, defaults to https://api.renderbase.dev)
 * 3. Have at least one template created in your workspace
 *
 * Usage:
 *   RENDERBASE_API_KEY=your_key npx ts-node tests/integration.test.ts
 *
 * Or with custom API URL:
 *   RENDERBASE_API_KEY=your_key RENDERBASE_API_URL=http://localhost:3000 npx ts-node tests/integration.test.ts
 */

import { Renderbase, RenderbaseError } from '../src';

// Configuration
const API_KEY = process.env.RENDERBASE_API_KEY;
const API_URL = process.env.RENDERBASE_API_URL || 'https://api.renderbase.dev';

if (!API_KEY) {
  console.error('❌ RENDERBASE_API_KEY environment variable is required');
  process.exit(1);
}

const client = new Renderbase({
  apiKey: API_KEY,
  baseUrl: API_URL,
});

// Test state
let templateId: string | null = null;
let templateVariables: Record<string, any> = {};
let jobId: string | null = null;
let webhookId: string | null = null;

/**
 * Build variables object from template variable definitions using default values
 */
function buildVariablesFromDefaults(variables: any[]): Record<string, any> {
  const result: Record<string, any> = {};

  if (!variables || !Array.isArray(variables)) {
    return result;
  }

  for (const variable of variables) {
    if (variable.name && variable.defaultValue !== undefined) {
      result[variable.name] = variable.defaultValue;
    }
  }

  return result;
}

// Test results tracking
const results: { name: string; passed: boolean; error?: string }[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.log(`❌ ${name}: ${message}`);
  }
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Renderbase Node.js SDK Integration Tests\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`API Key: ${API_KEY?.substring(0, 10)}...`);
  console.log('\n---\n');

  // ==========================================
  // Client Tests
  // ==========================================

  await test('client.me() - Get authenticated user', async () => {
    const user = await client.me();
    if (!user.id || !user.email) {
      throw new Error('Invalid user response');
    }
    console.log(`  User: ${user.email}`);
  });

  await test('client.verifyApiKey() - Verify API key is valid', async () => {
    const result = await client.verifyApiKey();
    if (!result) {
      throw new Error('API key verification failed');
    }
  });

  // ==========================================
  // Templates Tests
  // ==========================================

  await test('templates.list() - List all templates', async () => {
    const response = await client.templates.list();
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of templates');
    }
    console.log(`  Found ${response.data.length} templates`);

    // Save first template ID for later tests
    if (response.data.length > 0) {
      templateId = response.data[0].id;
      console.log(`  Using template: ${response.data[0].name} (${templateId})`);
    }
  });

  await test('templates.listPdf() - Filter PDF templates', async () => {
    const response = await client.templates.listPdf();
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of templates');
    }
    console.log(`  Found ${response.data.length} PDF templates`);
  });

  if (templateId) {
    await test('templates.get() - Get template by ID', async () => {
      const template = await client.templates.get(templateId!);
      if (!template.id || !template.name) {
        throw new Error('Invalid template response');
      }
      console.log(`  Template: ${template.name}`);
      console.log(`  Variables: ${template.variables?.length || 0}`);

      // Extract default values from template variables
      templateVariables = buildVariablesFromDefaults(template.variables || []);
      console.log(`  Using ${Object.keys(templateVariables).length} variables with defaults`);
    });
  }

  // ==========================================
  // Documents Tests
  // ==========================================

  if (templateId) {
    // --- PDF Generation ---
    await test('documents.generatePdf() - Generate PDF document', async () => {
      const job = await client.documents.generatePdf({
        templateId: templateId!,
        variables: templateVariables,
      });

      if (!job.jobId || job.status !== 'queued') {
        throw new Error('Invalid job response');
      }

      jobId = job.jobId;
      console.log(`  Job ID: ${jobId}`);
      console.log(`  Status: ${job.status}`);
    });

    if (jobId) {
      await test('documents.getJob() - Get PDF job status', async () => {
        const job = await client.documents.getJob(jobId!);
        if (!job.jobId) {
          throw new Error('Invalid job response');
        }
        console.log(`  Status: ${job.status}`);
      });

      await test('documents.waitForCompletion() - Wait for PDF completion', async () => {
        const completed = await client.documents.waitForCompletion(jobId!, {
          pollInterval: 1000,
          timeout: 60000,
        });

        if (completed.status !== 'completed' && completed.status !== 'failed') {
          throw new Error(`Job not finished: ${completed.status}`);
        }

        console.log(`  Final status: ${completed.status}`);
        if (completed.downloadUrl) {
          console.log(`  Download URL: ${completed.downloadUrl.substring(0, 50)}...`);
        }
      });
    }

    // --- Excel Generation ---
    let excelJobId: string | null = null;

    await test('documents.generateExcel() - Generate Excel document', async () => {
      const job = await client.documents.generateExcel({
        templateId: templateId!,
        variables: templateVariables,
      });

      if (!job.jobId || job.status !== 'queued') {
        throw new Error('Invalid job response');
      }

      excelJobId = job.jobId;
      console.log(`  Job ID: ${excelJobId}`);
      console.log(`  Status: ${job.status}`);
    });

    if (excelJobId) {
      await test('documents.getJob() - Get Excel job status', async () => {
        const job = await client.documents.getJob(excelJobId!);
        if (!job.jobId) {
          throw new Error('Invalid job response');
        }
        console.log(`  Status: ${job.status}`);
      });

      await test('documents.waitForCompletion() - Wait for Excel completion', async () => {
        const completed = await client.documents.waitForCompletion(excelJobId!, {
          pollInterval: 1000,
          timeout: 60000,
        });

        if (completed.status !== 'completed' && completed.status !== 'failed') {
          throw new Error(`Job not finished: ${completed.status}`);
        }

        console.log(`  Final status: ${completed.status}`);
        if (completed.downloadUrl) {
          console.log(`  Download URL: ${completed.downloadUrl.substring(0, 50)}...`);
        }
      });
    }

    // --- List Jobs ---
    await test('documents.listJobs() - List document jobs', async () => {
      const response = await client.documents.listJobs({ limit: 10 });
      if (!Array.isArray(response.data)) {
        throw new Error('Expected array of jobs');
      }
      console.log(`  Found ${response.data.length} jobs`);
    });

    await test('documents.listJobs({ status }) - Filter by status', async () => {
      const response = await client.documents.listJobs({
        status: 'completed',
        limit: 5
      });
      if (!Array.isArray(response.data)) {
        throw new Error('Expected array of jobs');
      }
      console.log(`  Found ${response.data.length} completed jobs`);
    });
  }

  // ==========================================
  // Webhooks Tests
  // ==========================================

  await test('webhooks.list() - List webhooks', async () => {
    const response = await client.webhooks.list();
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of webhooks');
    }
    console.log(`  Found ${response.data.length} webhooks`);
  });

  await test('webhooks.create() - Create webhook subscription', async () => {
    const webhook = await client.webhooks.create({
      url: 'https://webhook.site/test-renderbase-sdk',
      events: ['document.generated', 'document.failed'],
      description: 'SDK Integration Test Webhook',
    });

    if (!webhook.id || !webhook.secret) {
      throw new Error('Invalid webhook response');
    }

    webhookId = webhook.id;
    console.log(`  Webhook ID: ${webhookId}`);
    console.log(`  Secret: ${webhook.secret.substring(0, 10)}...`);
  });

  if (webhookId) {
    await test('webhooks.get() - Get webhook by ID', async () => {
      const webhook = await client.webhooks.get(webhookId!);
      if (!webhook.id || !webhook.url) {
        throw new Error('Invalid webhook response');
      }
      console.log(`  URL: ${webhook.url}`);
    });

    await test('webhooks.update() - Update webhook', async () => {
      const webhook = await client.webhooks.update(webhookId!, {
        description: 'SDK Integration Test Webhook (Updated)',
      });
      if (!webhook.id) {
        throw new Error('Invalid webhook response');
      }
      console.log(`  Updated description: ${webhook.description}`);
    });

    await test('webhooks.delete() - Delete webhook', async () => {
      await client.webhooks.delete(webhookId!);
      console.log(`  Deleted webhook: ${webhookId}`);
    });
  }

  // ==========================================
  // Error Handling Tests
  // ==========================================

  await test('Error handling - Invalid template ID', async () => {
    try {
      await client.templates.get('invalid-template-id-12345');
      throw new Error('Expected error for invalid template');
    } catch (error) {
      if (error instanceof RenderbaseError) {
        console.log(`  Error code: ${error.code}`);
        console.log(`  Status: ${error.statusCode}`);
        return; // Test passed
      }
      throw error;
    }
  });

  // ==========================================
  // Results Summary
  // ==========================================

  console.log('\n---\n');
  console.log('📊 Test Results Summary\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
