/**
 * Webhooks Resource
 *
 * Provides read-only access to webhook subscriptions and signature verification.
 * Webhook subscriptions are managed through the Renderbase dashboard.
 */

import type { HttpClient } from '../utils/http';
import type {
  WebhookSubscription,
  PaginationMeta,
} from '../types';

export class WebhooksResource {
  constructor(private http: HttpClient) {}

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
}
