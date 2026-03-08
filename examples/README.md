# Examples

This directory contains example code demonstrating how to use the Rynko Node.js SDK.

## Prerequisites

- Node.js 18+
- A Rynko API key ([get one here](https://app.rynko.dev/settings/api-keys))
- At least one template created in your workspace

## Running Examples

From the SDK root directory:

```bash
# Install dependencies
npm install

# Run an example
RYNKO_API_KEY=your_key npx tsx examples/basic-generate.ts
```

## Available Examples

| Example | Description |
|---------|-------------|
| [basic-generate.ts](./basic-generate.ts) | Generate a PDF and wait for completion |
| [batch-generate.ts](./batch-generate.ts) | Generate multiple documents in one request |
| [webhook-handler.ts](./webhook-handler.ts) | Express server that verifies and handles webhooks |
| [error-handling.ts](./error-handling.ts) | Handle API errors gracefully |
| [flow-submit-and-wait.ts](./flow-submit-and-wait.ts) | Submit a Flow run and wait for the validation result |
| [flow-approval-workflow.ts](./flow-approval-workflow.ts) | Programmatically approve or reject pending Flow approvals |
| [flow-webhook-handler.ts](./flow-webhook-handler.ts) | Express server that handles Flow webhook events |

## More Examples

For complete project templates with full setup (package.json, .env, etc.), see the [developer-resources](https://github.com/rynko-dev/developer-resources) repository.
