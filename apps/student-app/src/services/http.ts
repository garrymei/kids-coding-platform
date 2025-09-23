export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions<Body = unknown> {
  method?: HttpMethod;
  body?: Body;
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
}

export interface HttpClient {
  request<TResponse = unknown, TBody = unknown>(
    url: string,
    options?: HttpRequestOptions<TBody>,
  ): Promise<TResponse>;
  get<TResponse = unknown>(url: string, options?: HttpRequestOptions): Promise<TResponse>;
  post<TResponse = unknown, TBody = unknown>(
    url: string,
    options?: HttpRequestOptions<TBody>,
  ): Promise<TResponse>;
}

export function createHttpClient(): HttpClient {
  return {
    async request() {
      throw new Error('HTTP client has not been implemented yet.');
    },
    async get() {
      throw new Error('HTTP client has not been implemented yet.');
    },
    async post() {
      throw new Error('HTTP client has not been implemented yet.');
    },
  };
}

export const httpClient = createHttpClient();
