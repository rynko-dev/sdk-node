/**
 * Rynko Flow Integration Tests
 *
 * Run these tests against a live API to verify Flow SDK functionality.
 *
 * Prerequisites:
 * 1. Set RYNKO_API_KEY environment variable
 * 2. Set RYNKO_API_URL environment variable (optional, defaults to https://api.rynko.dev)
 * 3. Have at least one published Flow gate in your workspace
 *
 * Usage:
 *   RYNKO_API_KEY=your_key npx ts-node tests/flow-integration.test.ts
 *
 * Or with custom API URL:
 *   RYNKO_API_KEY=your_key RYNKO_API_URL=http://localhost:3000 npx ts-node tests/flow-integration.test.ts
 */

import { Rynko, RynkoError } from '../src';

// Configuration
const API_KEY = process.env.RYNKO_API_KEY;
const API_URL = process.env.RYNKO_API_URL || 'https://api.rynko.dev';

if (!API_KEY) {
  console.error('❌ RYNKO_API_KEY environment variable is required');
  process.exit(1);
}

const client = new Rynko({
  apiKey: API_KEY,
  baseUrl: API_URL,
});

// Test state
let gateId: string | null = null;
let runId: string | null = null;
let pendingApprovalId: string | null = null;
let failedDeliveryId: string | null = null;

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
  console.log('\n🧪 Rynko Flow Integration Tests\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`API Key: ${API_KEY?.substring(0, 10)}...`);
  console.log('\n---\n');

  // ==========================================
  // Gates Tests
  // ==========================================

  await test('flow.listGates() - List all gates', async () => {
    const response = await client.flow.listGates();
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of gates');
    }
    console.log(`  Found ${response.data.length} gates`);
    console.log(`  Total: ${response.meta.total}`);

    // Save first gate ID for later tests
    if (response.data.length > 0) {
      gateId = response.data[0].id;
      console.log(`  Using gate: ${response.data[0].name} (${gateId})`);
    }
  });

  if (gateId) {
    await test('flow.getGate() - Get gate by ID', async () => {
      const gate = await client.flow.getGate(gateId!);
      if (!gate.id || !gate.name) {
        throw new Error('Invalid gate response');
      }
      console.log(`  Gate: ${gate.name}`);
      console.log(`  Status: ${gate.status}`);
      console.log(`  Created: ${gate.createdAt}`);
    });
  }

  // ==========================================
  // Runs Tests
  // ==========================================

  if (gateId) {
    await test('flow.submitRun() - Submit a run with sample input', async () => {
      const response = await client.flow.submitRun(gateId!, {
        input: {
          name: 'SDK Integration Test',
          email: 'test@example.com',
          amount: 99.99,
          description: 'Automated test run from Node.js SDK',
        },
        metadata: {
          testId: 'sdk-integration-test',
          timestamp: new Date().toISOString(),
        },
      });

      if (!response.id) {
        throw new Error('Expected run ID in response');
      }

      runId = response.id;
      console.log(`  Run ID: ${runId}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Gate ID: ${response.gateId}`);
    });
  }

  if (runId) {
    await test('flow.getRun() - Get run by ID', async () => {
      const run = await client.flow.getRun(runId!);
      if (!run.id || !run.gateId) {
        throw new Error('Invalid run response');
      }
      console.log(`  Status: ${run.status}`);
      console.log(`  Gate ID: ${run.gateId}`);
      if (run.metadata) {
        console.log(`  Metadata: ${JSON.stringify(run.metadata)}`);
      }
    });
  }

  await test('flow.listRuns() - List all runs', async () => {
    const response = await client.flow.listRuns({ limit: 10 });
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of runs');
    }
    console.log(`  Found ${response.data.length} runs`);
    console.log(`  Total: ${response.meta.total}`);
  });

  if (gateId) {
    await test('flow.listRunsByGate() - List runs for a specific gate', async () => {
      const response = await client.flow.listRunsByGate(gateId!, { limit: 10 });
      if (!Array.isArray(response.data)) {
        throw new Error('Expected array of runs');
      }
      console.log(`  Found ${response.data.length} runs for gate ${gateId}`);
    });
  }

  await test('flow.listActiveRuns() - List active runs', async () => {
    const response = await client.flow.listActiveRuns({ limit: 10 });
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of runs');
    }
    console.log(`  Found ${response.data.length} active runs`);
  });

  if (runId) {
    await test('flow.waitForRun() - Wait for run to complete', async () => {
      const run = await client.flow.waitForRun(runId!, {
        pollInterval: 1000,
        timeout: 60000,
      });

      const terminalStatuses = [
        'completed',
        'delivered',
        'approved',
        'rejected',
        'validation_failed',
        'render_failed',
        'delivery_failed',
      ];

      if (!terminalStatuses.includes(run.status)) {
        throw new Error(`Run did not reach terminal state: ${run.status}`);
      }

      console.log(`  Final status: ${run.status}`);
      if (run.output) {
        console.log(`  Output keys: ${Object.keys(run.output).join(', ')}`);
      }
      if (run.errors && run.errors.length > 0) {
        console.log(`  Errors: ${run.errors.map(e => e.message).join('; ')}`);
      }
    });
  }

  // ==========================================
  // Approvals Tests
  // ==========================================

  await test('flow.listApprovals() - List all approvals', async () => {
    const response = await client.flow.listApprovals({ limit: 10 });
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of approvals');
    }
    console.log(`  Found ${response.data.length} approvals`);
    console.log(`  Total: ${response.meta.total}`);

    // Look for a pending approval to test approve/reject
    const pendingApprovals = response.data.filter(a => a.status === 'pending');
    if (pendingApprovals.length > 0) {
      pendingApprovalId = pendingApprovals[0].id;
      console.log(`  Found pending approval: ${pendingApprovalId}`);
    }
  });

  await test('flow.approve() - Approve a pending approval', async () => {
    if (!pendingApprovalId) {
      console.log('  ⏭ Skipped: No pending approvals available to approve');
      return;
    }

    const approval = await client.flow.approve(pendingApprovalId!, {
      note: 'Approved via SDK integration test',
    });

    if (!approval.id) {
      throw new Error('Invalid approval response');
    }

    console.log(`  Approval ID: ${approval.id}`);
    console.log(`  Status: ${approval.status}`);
  });

  await test('flow.reject() - Reject a pending approval', async () => {
    // Re-check for pending approvals since we may have approved one
    const response = await client.flow.listApprovals({ status: 'pending', limit: 1 });
    const nextPending = response.data.length > 0 ? response.data[0].id : null;

    if (!nextPending) {
      console.log('  ⏭ Skipped: No pending approvals available to reject');
      return;
    }

    const approval = await client.flow.reject(nextPending, {
      reason: 'Rejected via SDK integration test',
    });

    if (!approval.id) {
      throw new Error('Invalid approval response');
    }

    console.log(`  Approval ID: ${approval.id}`);
    console.log(`  Status: ${approval.status}`);
  });

  // ==========================================
  // Deliveries Tests
  // ==========================================

  if (runId) {
    await test('flow.listDeliveries() - List deliveries for a run', async () => {
      const response = await client.flow.listDeliveries(runId!, { limit: 10 });
      if (!Array.isArray(response.data)) {
        throw new Error('Expected array of deliveries');
      }
      console.log(`  Found ${response.data.length} deliveries for run ${runId}`);

      // Look for a failed delivery to test retry
      const failedDeliveries = response.data.filter(d => d.status === 'failed');
      if (failedDeliveries.length > 0) {
        failedDeliveryId = failedDeliveries[0].id;
        console.log(`  Found failed delivery: ${failedDeliveryId}`);
      }
    });
  }

  await test('flow.retryDelivery() - Retry a failed delivery', async () => {
    if (!failedDeliveryId) {
      console.log('  ⏭ Skipped: No failed deliveries available to retry');
      return;
    }

    const delivery = await client.flow.retryDelivery(failedDeliveryId!);
    if (!delivery.id) {
      throw new Error('Invalid delivery response');
    }

    console.log(`  Delivery ID: ${delivery.id}`);
    console.log(`  Status: ${delivery.status}`);
    console.log(`  Attempts: ${delivery.attempts}`);
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================

  await test('Error handling - Invalid run ID should throw RynkoError', async () => {
    try {
      await client.flow.getRun('invalid-run-id-that-does-not-exist');
      throw new Error('Expected error for invalid run ID');
    } catch (error) {
      if (error instanceof RynkoError) {
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
