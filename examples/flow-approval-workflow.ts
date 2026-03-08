/**
 * Flow Approval Workflow Example
 *
 * This example shows how to programmatically manage Flow approvals:
 * list pending approvals, inspect the associated runs, and
 * auto-approve or reject based on simple logic.
 *
 * Usage:
 *   RYNKO_API_KEY=your_key npx tsx examples/flow-approval-workflow.ts
 */

import { Rynko } from '../src';

async function main() {
  const client = new Rynko({
    apiKey: process.env.RYNKO_API_KEY!,
  });

  // Step 1: List pending approvals
  console.log('Fetching pending approvals...\n');
  const { data: approvals, meta } = await client.flow.listApprovals({
    status: 'pending',
    limit: 50,
  });

  console.log(`Found ${approvals.length} pending approvals (${meta.total} total)\n`);

  if (approvals.length === 0) {
    console.log('No pending approvals to process.');
    return;
  }

  let approved = 0;
  let rejected = 0;

  // Step 2: Process each approval
  for (const approval of approvals) {
    console.log(`--- Approval ${approval.id} ---`);
    console.log(`  Run ID: ${approval.runId}`);
    console.log(`  Gate ID: ${approval.gateId}`);

    // Step 3: Get the run details to make a decision
    const run = await client.flow.getRun(approval.runId);
    console.log(`  Run status: ${run.status}`);
    console.log(`  Input: ${JSON.stringify(run.input)}`);

    // Step 4: Apply simple approval logic
    // In a real application, you would check business rules, call external
    // services, or apply more sophisticated decision logic here.
    const amount = typeof run.input.orderTotal === 'number'
      ? run.input.orderTotal
      : typeof run.input.amount === 'number'
        ? run.input.amount
        : 0;

    if (amount > 0 && amount <= 1000) {
      // Auto-approve orders under $1,000
      const result = await client.flow.approve(approval.id, {
        note: `Auto-approved: amount $${amount} is within the $1,000 limit.`,
      });
      console.log(`  Decision: APPROVED (status: ${result.status})`);
      approved++;
    } else if (amount > 1000) {
      // Reject orders over $1,000 (would need manual review in practice)
      const result = await client.flow.reject(approval.id, {
        reason: `Auto-rejected: amount $${amount} exceeds the $1,000 auto-approval limit. Requires manual review.`,
      });
      console.log(`  Decision: REJECTED (status: ${result.status})`);
      rejected++;
    } else {
      // Reject if no amount is found
      const result = await client.flow.reject(approval.id, {
        reason: 'Auto-rejected: no valid amount field found in input data.',
      });
      console.log(`  Decision: REJECTED (status: ${result.status})`);
      rejected++;
    }

    console.log();
  }

  // Step 5: Print summary
  console.log('--- Summary ---');
  console.log(`Processed: ${approvals.length}`);
  console.log(`Approved:  ${approved}`);
  console.log(`Rejected:  ${rejected}`);
}

main().catch(console.error);
