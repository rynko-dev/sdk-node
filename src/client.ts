/**
 * Renderbase SDK Client
 */

import { HttpClient } from './utils/http';
import { DocumentsResource } from './resources/documents';
import { TemplatesResource } from './resources/templates';
import { WebhooksResource } from './resources/webhooks';
import type { RenderbaseConfig, ApiResponse, User } from './types';

const DEFAULT_BASE_URL = 'https://api.renderbase.dev';
const DEFAULT_TIMEOUT = 30000;

export class Renderbase {
  private http: HttpClient;

  /** Document generation operations */
  public documents: DocumentsResource;

  /** Template operations */
  public templates: TemplatesResource;

  /** Webhook operations */
  public webhooks: WebhooksResource;

  /**
   * Create a new Renderbase client
   *
   * @example
   * ```typescript
   * import { Renderbase } from '@renderbase/sdk';
   *
   * const renderbase = new Renderbase({
   *   apiKey: process.env.RENDERBASE_API_KEY!,
   * });
   *
   * // Generate a PDF
   * const result = await renderbase.documents.generate({
   *   templateId: 'tmpl_invoice',
   *   format: 'pdf',
   *   variables: { invoiceNumber: 'INV-001' },
   * });
   * ```
   */
  constructor(config: RenderbaseConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    this.http = new HttpClient({
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      apiKey: config.apiKey,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: config.headers,
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
   * const user = await renderbase.me();
   * console.log('Authenticated as:', user.email);
   * ```
   */
  async me(): Promise<User> {
    const response = await this.http.get<ApiResponse<User>>('/api/auth/verify');
    return response.data;
  }

  /**
   * Verify the API key is valid
   *
   * @example
   * ```typescript
   * const isValid = await renderbase.verifyApiKey();
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
 * Create a Renderbase client
 *
 * @example
 * ```typescript
 * import { createClient } from '@renderbase/sdk';
 *
 * const renderbase = createClient({
 *   apiKey: process.env.RENDERBASE_API_KEY!,
 * });
 * ```
 */
export function createClient(config: RenderbaseConfig): Renderbase {
  return new Renderbase(config);
}
