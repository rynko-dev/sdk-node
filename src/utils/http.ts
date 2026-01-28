/**
 * HTTP Client for Rynko SDK
 */

import type { ApiError, RetryConfig } from '../types';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  headers?: Record<string, string>;
  retry?: RetryConfig | false;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  maxJitterMs: 1000,
  retryableStatuses: [429, 503, 504],
};

export class HttpClient {
  private config: HttpClientConfig;
  private retryConfig: Required<RetryConfig> | null;

  constructor(config: HttpClientConfig) {
    this.config = config;

    // Set up retry configuration
    if (config.retry === false) {
      this.retryConfig = null;
    } else {
      this.retryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...config.retry,
      };
    }
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  private calculateDelay(attempt: number, retryAfterMs?: number): number {
    if (!this.retryConfig) return 0;

    // If server specified Retry-After, respect it (with jitter)
    if (retryAfterMs !== undefined) {
      const jitter = Math.random() * this.retryConfig.maxJitterMs;
      return Math.min(retryAfterMs + jitter, this.retryConfig.maxDelayMs);
    }

    // Exponential backoff: initialDelay * 2^attempt
    const exponentialDelay = this.retryConfig.initialDelayMs * Math.pow(2, attempt);

    // Add random jitter to prevent thundering herd
    const jitter = Math.random() * this.retryConfig.maxJitterMs;

    // Cap at maxDelay
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
  }

  /**
   * Parse Retry-After header value to milliseconds
   */
  private parseRetryAfter(retryAfter: string | null): number | undefined {
    if (!retryAfter) return undefined;

    // Check if it's a number (seconds)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }

    // Try to parse as HTTP-date
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      const delayMs = date.getTime() - Date.now();
      return delayMs > 0 ? delayMs : undefined;
    }

    return undefined;
  }

  /**
   * Check if the status code should trigger a retry
   */
  private shouldRetry(statusCode: number): boolean {
    if (!this.retryConfig) return false;
    return this.retryConfig.retryableStatuses.includes(statusCode);
  }

  /**
   * Sleep for the specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, unknown>;
    } = {}
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl);

    // Add query parameters
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            url.searchParams.append(key, value.toISOString());
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
      'User-Agent': '@rynko/sdk/1.0.0',
      ...this.config.headers,
    };

    const maxAttempts = this.retryConfig?.maxAttempts ?? 1;
    let lastError: RynkoError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if we should retry
        if (!response.ok && this.shouldRetry(response.status)) {
          const retryAfterMs = this.parseRetryAfter(response.headers.get('Retry-After'));
          const delay = this.calculateDelay(attempt, retryAfterMs);

          // Store the error in case this is the last attempt
          const data = await response.json().catch(() => ({}));
          const error = data as ApiError;
          lastError = new RynkoError(
            error.message || `HTTP ${response.status}`,
            error.error || 'ApiError',
            response.status
          );

          // If we have more attempts, wait and retry
          if (attempt < maxAttempts - 1) {
            await this.sleep(delay);
            continue;
          }
        }

        const data = await response.json();

        if (!response.ok) {
          const error = data as ApiError;
          throw new RynkoError(
            error.message || `HTTP ${response.status}`,
            error.error || 'ApiError',
            response.status
          );
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof RynkoError) {
          // If it's a retryable error and we have attempts left, the loop will continue
          // Otherwise, throw the error
          if (!this.shouldRetry(error.statusCode) || attempt >= maxAttempts - 1) {
            throw error;
          }
          lastError = error;
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new RynkoError('Request timeout', 'TimeoutError', 408);
          }
          throw new RynkoError(error.message, 'NetworkError', 0);
        }

        throw new RynkoError('Unknown error', 'UnknownError', 0);
      }
    }

    // If we've exhausted all retries, throw the last error
    if (lastError) {
      throw lastError;
    }

    throw new RynkoError('Request failed after retries', 'RetryExhausted', 0);
  }

  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export class RynkoError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'RynkoError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
