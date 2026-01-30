/**
 * Error Handling Example
 *
 * This example shows how to handle errors from the Rynko API.
 *
 * Usage:
 *   RYNKO_API_KEY=your_key npx tsx examples/error-handling.ts
 */

import { Rynko, RynkoError } from '../src';

async function main() {
  const client = new Rynko({
    apiKey: process.env.RYNKO_API_KEY!,
  });

  // Example 1: Template not found
  console.log('\n--- Example 1: Template not found ---');
  try {
    await client.templates.get('non-existent-template-id');
  } catch (error) {
    if (error instanceof RynkoError) {
      console.log(`Error: ${error.message}`);
      console.log(`Code: ${error.code}`);
      console.log(`Status: ${error.statusCode}`);
    }
  }

  // Example 2: Invalid API key
  console.log('\n--- Example 2: Invalid API key ---');
  const badClient = new Rynko({ apiKey: 'invalid-key' });
  try {
    await badClient.me();
  } catch (error) {
    if (error instanceof RynkoError) {
      console.log(`Error: ${error.message}`);
      console.log(`Code: ${error.code}`);
    }
  }

  // Example 3: Handling specific error codes
  console.log('\n--- Example 3: Handling specific error codes ---');
  try {
    await client.documents.generatePdf({
      templateId: 'invalid-id',
      variables: {},
    });
  } catch (error) {
    if (error instanceof RynkoError) {
      switch (error.code) {
        case 'ERR_TMPL_001':
          console.log('Template not found - check the template ID');
          break;
        case 'ERR_TMPL_003':
          console.log('Template validation failed - check your variables');
          break;
        case 'ERR_QUOTA_001':
          console.log('Quota exceeded - upgrade your plan');
          break;
        case 'ERR_AUTH_001':
        case 'ERR_AUTH_004':
          console.log('Authentication failed - check your API key');
          break;
        default:
          console.log(`Unexpected error: ${error.message}`);
      }
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
