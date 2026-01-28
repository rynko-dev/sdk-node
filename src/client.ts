/**
 * Rynko SDK Client
 */

import { HttpClient } from './utils/http';
import { DocumentsResource } from './resources/documents';
import { TemplatesResource } from './resources/templates';
import { WebhooksResource } from './resources/webhooks';
import type { RynkoConfig, ApiResponse, User } from './types';

const DEFAULT_BASE_URL = 'https://api.rynko.dev';
const DEFAULT_TIMEOUT = 30000;

export class Rynko {
  private http: HttpClient;

  /** Document generation operations */
  public documents: DocumentsResource;

  /** Template operations */
  public templates: TemplatesResource;

  /** Webhook operations */
  public webhooks: WebhooksResource;

  /**
   * Create a new Rynko client
   *
   * @example
   * ```typescript
   * import { Rynko } from '@rynko/sdk';
   *
   * const rynko = new Rynko({
   *   apiKey: process.env.RYNKO_API_KEY!,
   * });
   *
   * // Generate a PDF
   * const result = await rynko.documents.generate({
   *   templateId: 'tmpl_invoice',
   *   format: 'pdf',
   *   variables: { invoiceNumber: 'INV-001' },
   * });
   * ```
   */
  constructor(config: RynkoConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    this.http = new HttpClient({
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      apiKey: config.apiKey,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: config.headers,
      retry: config.retry,
    });

    this.documents = new DocumentsResource(this.http);
    this.templates = new TemplatesResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
  }

  /**
   * Get the current authenticated user
   *
   * @example
   * ```typescript
   * const user = await rynko.me();
   * console.log('Authenticated as:', user.email);
   * ```
   */
  async me(): Promise<User> {
    // Backend returns user object directly (not wrapped in { data: ... })
    return this.http.get<User>('/api/auth/verify');
  }

  /**
   * Verify the API key is valid
   *
   * @example
   * ```typescript
   * const isValid = await rynko.verifyApiKey();
   * if (!isValid) {
   *   throw new Error('Invalid API key');
   * }
   * ```
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a Rynko client
 *
 * @example
 * ```typescript
 * import { createClient } from '@rynko/sdk';
 *
 * const rynko = createClient({
 *   apiKey: process.env.RYNKO_API_KEY!,
 * });
 * ```
 */
export function createClient(config: RynkoConfig): Rynko {
  return new Rynko(config);
}
