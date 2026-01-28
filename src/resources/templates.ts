/**
 * Templates Resource
 */

import type { HttpClient } from '../utils/http';
import type {
  Template,
  ListTemplatesOptions,
  PaginationMeta,
} from '../types';

interface TemplateListResponse {
  data: Template[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TemplatesResource {
  constructor(private http: HttpClient) {}

  /**
   * Get a template by ID
   *
   * @example
   * ```typescript
   * const template = await rynko.templates.get('tmpl_abc123');
   * console.log('Template:', template.name);
   * console.log('Variables:', template.variables);
   * ```
   */
  async get(id: string): Promise<Template> {
    // Backend returns template directly (not wrapped)
    return this.http.get<Template>(`/api/templates/${id}`);
  }

  /**
   * List templates with optional filters
   *
   * @example
   * ```typescript
   * // List all templates
   * const { data } = await rynko.templates.list();
   *
   * // List with pagination
   * const { data, meta } = await rynko.templates.list({ page: 1, limit: 10 });
   * ```
   */
  async list(
    options: ListTemplatesOptions = {}
  ): Promise<{ data: Template[]; meta: PaginationMeta }> {
    // Backend uses page/limit, not type filter
    const response = await this.http.get<TemplateListResponse>(
      '/api/templates/attachment',
      {
        limit: options.limit,
        page: options.page,
        search: options.search,
      }
    );

    return {
      data: response.data,
      meta: {
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      },
    };
  }

  /**
   * List only PDF templates
   *
   * Note: Filtering by type is done client-side based on outputFormats.
   *
   * @example
   * ```typescript
   * const { data } = await rynko.templates.listPdf();
   * ```
   */
  async listPdf(
    options: Omit<ListTemplatesOptions, 'type'> = {}
  ): Promise<{ data: Template[]; meta: PaginationMeta }> {
    const result = await this.list(options);
    // Filter client-side by outputFormats including 'pdf'
    result.data = result.data.filter((t: any) =>
      t.outputFormats?.includes('pdf')
    );
    return result;
  }

  /**
   * List only Excel templates
   *
   * Note: Filtering by type is done client-side based on outputFormats.
   *
   * @example
   * ```typescript
   * const { data } = await rynko.templates.listExcel();
   * ```
   */
  async listExcel(
    options: Omit<ListTemplatesOptions, 'type'> = {}
  ): Promise<{ data: Template[]; meta: PaginationMeta }> {
    const result = await this.list(options);
    // Filter client-side by outputFormats including 'xlsx'
    result.data = result.data.filter((t: any) =>
      t.outputFormats?.includes('xlsx') || t.outputFormats?.includes('excel')
    );
    return result;
  }
}
