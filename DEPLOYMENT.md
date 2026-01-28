# Node.js SDK Deployment Guide

This guide covers publishing and maintaining the Rynko Node.js SDK (`@rynko/sdk`).

## Prerequisites

- Node.js 18.x or higher
- npm account with publish access to `@rynko` scope
- GitHub repository access

## Package Overview

```
@rynko/sdk
├── src/
│   ├── client.ts        # Main Rynko client
│   ├── index.ts         # Public exports
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # HTTP client, webhook verification
│   └── resources/       # API resource classes
├── package.json
├── tsconfig.json
└── README.md
```

## Build Process

### 1. Install Dependencies

```bash
cd integrations/sdk-node
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in `dist/` with:
- CommonJS output in `dist/`
- Type declarations in `dist/`
- Source maps for debugging

### 3. Run Tests

```bash
npm test
```

### 4. Lint Code

```bash
npm run lint
```

## Publishing to npm

### Initial Setup

1. **Create npm Organization** (if not exists):
   ```bash
   npm org create rynko
   ```

2. **Login to npm**:
   ```bash
   npm login
   ```

3. **Verify Scope Access**:
   ```bash
   npm access ls-packages
   ```

### Publishing a New Version

1. **Update Version**:
   ```bash
   # Patch release (1.0.0 -> 1.0.1)
   npm version patch

   # Minor release (1.0.0 -> 1.1.0)
   npm version minor

   # Major release (1.0.0 -> 2.0.0)
   npm version major
   ```

2. **Build and Test**:
   ```bash
   npm run build
   npm test
   ```

3. **Publish**:
   ```bash
   npm publish --access public
   ```

4. **Tag Release on GitHub**:
   ```bash
   git push origin main --tags
   ```

### Automated Publishing (CI/CD)

Add to `.github/workflows/publish.yml`:

```yaml
name: Publish SDK

on:
  push:
    tags:
      - 'sdk-node-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        working-directory: integrations/sdk-node
        run: npm ci

      - name: Build
        working-directory: integrations/sdk-node
        run: npm run build

      - name: Test
        working-directory: integrations/sdk-node
        run: npm test

      - name: Publish
        working-directory: integrations/sdk-node
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Version Management

### Semantic Versioning

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Changelog

Maintain `CHANGELOG.md` with:

```markdown
# Changelog

## [1.1.0] - 2025-01-15
### Added
- New `emails.resend()` method
- Support for custom headers

### Fixed
- Timeout handling in bulk send

## [1.0.0] - 2025-01-01
### Initial Release
- Email sending with templates
- PDF and Excel attachments
- Webhook signature verification
```

## Configuration Requirements

### Environment Variables

Users must set:
```bash
RYNKO_API_KEY=your_api_key
```

### SDK Configuration

```typescript
import { Rynko } from '@rynko/sdk';

const client = new Rynko({
  apiKey: process.env.RYNKO_API_KEY,
  // Optional
  baseUrl: 'https://api.rynko.dev',
  timeout: 30000,
});
```

## API Compatibility

### Backend Requirements

The SDK requires these Rynko API endpoints:

| Endpoint | SDK Method |
|----------|------------|
| `GET /api/v1/me` | `client.me()` |
| `POST /api/v1/emails/send` | `client.emails.send()` |
| `POST /api/v1/emails/send-bulk` | `client.emails.sendBulk()` |
| `GET /api/v1/emails` | `client.emails.list()` |
| `GET /api/v1/emails/:id` | `client.emails.get()` |
| `GET /api/v1/templates` | `client.templates.list()` |
| `GET /api/v1/templates/:id` | `client.templates.get()` |
| `POST /api/v1/webhook-subscriptions` | `client.webhooks.create()` |
| `GET /api/v1/webhook-subscriptions` | `client.webhooks.list()` |
| `DELETE /api/v1/webhook-subscriptions/:id` | `client.webhooks.delete()` |

### API Version Compatibility

| SDK Version | API Version | Notes |
|-------------|-------------|-------|
| 1.x | v1 | Current stable |

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

Create `.env.test`:
```bash
RYNKO_API_KEY=test_api_key
RYNKO_BASE_URL=http://localhost:3000
```

Run integration tests:
```bash
npm run test:integration
```

### Manual Testing

```typescript
import { Rynko } from '@rynko/sdk';

const client = new Rynko({
  apiKey: 'your_test_key',
  baseUrl: 'http://localhost:3000',
});

// Test authentication
const user = await client.me();
console.log('Authenticated as:', user.email);

// Test email sending
const result = await client.emails.send({
  templateId: 'tmpl_test',
  to: 'test@example.com',
  variables: { name: 'Test' },
});
console.log('Email sent:', result.id);
```

## Documentation

### API Documentation

Generate TypeDoc documentation:

```bash
npm run docs
```

Output in `docs/` directory.

### README Updates

Update `README.md` with:
- Installation instructions
- Quick start examples
- API reference
- Error handling
- Migration guides (for major versions)

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure TypeScript 5.x is installed
   - Clear `dist/` and rebuild

2. **Publish Failures**
   - Verify npm login: `npm whoami`
   - Check scope access: `npm access ls-packages`
   - Ensure version is incremented

3. **Type Errors in Consumer Projects**
   - Verify `types` field in package.json
   - Check TypeScript version compatibility

### Support Channels

- GitHub Issues: Report bugs and feature requests
- Email: sdk-support@rynko.dev
- Documentation: https://docs.rynko.dev/sdk/node

## Security

### API Key Handling

- Never commit API keys to source control
- Use environment variables
- Rotate keys if compromised

### Dependency Updates

Regularly update dependencies:
```bash
npm audit
npm update
```

### Vulnerability Disclosure

Report security issues to: security@rynko.dev
