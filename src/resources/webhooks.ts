/**
 * Webhooks Resource
 */

import type { HttpClient } from '../utils/http';
import type {
  WebhookSubscription,
  CreateWebhookOptions,
  PaginationMeta,
} from '../types';

export class WebhooksResource {
  constructor(private http: HttpClient) {}

  /**
   * Create a webhook subscription
   *
   * @example
   * ```typescript
   * const webhook = await renderbase.webhooks.create({
   *   url: 'https://your-app.com/webhooks/renderbase',
   *   events: ['document.generated', 'document.failed'],
   *   description: 'My Webhook',
   * });
   * console.log('Webhook ID:', webhook.id);
   * console.log('Secret:', webhook.secret); // Save this for verification!
   * ```
   */
  async create(options: CreateWebhookOptions): Promise<WebhookSubscription> {
    // Backend returns webhook directly (not wrapped)
    return this.http.post<WebhookSubscription>(
      '/api/v1/webhook-subscriptions',
      options
    );
  }

  /**
   * Get a webhook subscription by ID
   *
   * @example
   * ```typescript
   * const webhook = await renderbase.webhooks.get('wh_abc123');
   * console.log('Events:', webhook.events);
   * ```
   */
  async get(id: string): Promise<WebhookSubscription> {
    // Backend returns webhook directly (not wrapped)
    return this.http.get<WebhookSubscription>(
      `/api/v1/webhook-subscriptions/${id}`
    );
  }

  /**
   * List all webhook subscriptions
   *
   * @example
   * ```typescript
   * const { data } = await renderbase.webhooks.list();
   * console.log('Active webhooks:', data.filter(w => w.isActive).length);
   * ```
   */
  async list(): Promise<{ data: WebhookSubscription[]; meta: PaginationMeta }> {
    // Backend returns { data: [], total: number }
    const response = await this.http.get<{ data: WebhookSubscription[]; total: number }>(
      '/api/v1/webhook-subscriptions'
    );

    return {
      data: response.data,
      meta: {
        total: response.total,
        page: 1,
        limit: response.data.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Delete a webhook subscription
   *
   * @example
   * ```typescript
   * await renderbase.webhooks.delete('wh_abc123');
   * console.log('Webhook deleted');
   * ```
   */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/v1/webhook-subscriptions/${id}`);
  }

  /**
   * Update a webhook subscription
   *
   * @example
   * ```typescript
   * const updated = await renderbase.webhooks.update('wh_abc123', {
   *   events: ['document.generated', 'document.failed'],
   *   isActive: true,
   * });
   * ```
   */
  async update(
    id: string,
    options: Partial<CreateWebhookOptions> & { isActive?: boolean }
  ): Promise<WebhookSubscription> {
    // Backend returns webhook directly (not wrapped)
    return this.http.patch<WebhookSubscription>(
      `/api/v1/webhook-subscriptions/${id}`,
      options
    );
  }
}
