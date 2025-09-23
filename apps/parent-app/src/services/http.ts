import ky, { type KyInstance } from 'ky';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions<Body = unknown> {
  method?: HttpMethod;
  body?: Body;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
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
  put<TResponse = unknown, TBody = unknown>(
    url: string,
    options?: HttpRequestOptions<TBody>,
  ): Promise<TResponse>;
  patch<TResponse = unknown, TBody = unknown>(
    url: string,
    options?: HttpRequestOptions<TBody>,
  ): Promise<TResponse>;
  delete<TResponse = unknown>(url: string, options?: HttpRequestOptions): Promise<TResponse>;
}

class HttpClientImpl implements HttpClient {
  private ky: KyInstance;

  constructor(baseUrl: string = '') {
    this.ky = ky.create({
      prefixUrl: baseUrl,
      timeout: 10000,
      retry: {
        limit: 3,
        methods: ['get', 'post', 'put', 'patch', 'delete'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
      },
      hooks: {
        beforeRequest: [
          (request) => {
            // Add auth token if available
            const token = localStorage.getItem('auth_token');
            if (token) {
              request.headers.set('Authorization', `Bearer ${token}`);
            }
          },
        ],
        beforeError: [
          (error) => {
            // Handle common errors
            if (error.response?.status === 401) {
              // Token expired, redirect to login
              localStorage.removeItem('auth_token');
              window.location.href = '/login';
            }
            return error;
          },
        ],
      },
    });
  }

  async request<TResponse = unknown, TBody = unknown>(
    url: string,
    options: HttpRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const { method = 'GET', body, query, headers, timeout, retry } = options;

    const searchParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const requestOptions: any = {
      method,
      headers,
      timeout: timeout || 10000,
      retry: retry || 3,
    };

    if (body) {
      requestOptions.json = body;
    }

    if (searchParams.toString()) {
      requestOptions.searchParams = searchParams;
    }

    return this.ky(url, requestOptions).json<TResponse>();
  }

  async get<TResponse = unknown>(url: string, options: HttpRequestOptions = {}): Promise<TResponse> {
    return this.request<TResponse>(url, { ...options, method: 'GET' });
  }

  async post<TResponse = unknown, TBody = unknown>(
    url: string,
    options: HttpRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(url, { ...options, method: 'POST' });
  }

  async put<TResponse = unknown, TBody = unknown>(
    url: string,
    options: HttpRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(url, { ...options, method: 'PUT' });
  }

  async patch<TResponse = unknown, TBody = unknown>(
    url: string,
    options: HttpRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(url, { ...options, method: 'PATCH' });
  }

  async delete<TResponse = unknown>(url: string, options: HttpRequestOptions = {}): Promise<TResponse> {
    return this.request<TResponse>(url, { ...options, method: 'DELETE' });
  }
}

export function createHttpClient(baseUrl?: string): HttpClient {
  return new HttpClientImpl(baseUrl);
}

export const httpClient = createHttpClient(import.meta.env.VITE_API_URL || 'http://localhost:3000');
