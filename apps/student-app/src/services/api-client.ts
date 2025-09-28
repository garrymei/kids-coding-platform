import ky, { HTTPError } from 'ky';

// 标准错误响应格式
interface ApiErrorResponse {
  code: string;
  message: string;
  cid?: string;
  details?: any;
  retryAfter?: number;
}

// 扩展错误类
export class ApiError extends Error {
  public code: string;
  public cid?: string;
  public details?: any;
  public retryAfter?: number;
  public status?: number;

  constructor(response: ApiErrorResponse, status?: number) {
    super(response.message);
    this.name = 'ApiError';
    this.code = response.code;
    this.cid = response.cid;
    this.details = response.details;
    this.retryAfter = response.retryAfter;
    this.status = status;
  }
}

// 创建API客户端实例
export const apiClient = ky.create({
  prefixUrl: '/api',
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // 添加请求ID用于追踪
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        request.headers.set('X-Request-ID', requestId);
        
        // 添加学生ID（实际项目中应该从认证状态获取）
        const studentId = localStorage.getItem('studentId') || 'stu_1';
        request.headers.set('X-Student-ID', studentId);
        
        console.log(`[API] ${request.method} ${request.url}`, { requestId, studentId });
      },
    ],
    afterResponse: [
      (request, options, response) => {
        const requestId = request.headers.get('X-Request-ID');
        const duration = Date.now() - parseInt(requestId?.split('_')[1] || '0');
        
        console.log(`[API] ${request.method} ${request.url} - ${response.status} (${duration}ms)`, {
          requestId,
          status: response.status,
          duration,
        });
      },
    ],
    beforeError: [
      (error) => {
        if (error instanceof HTTPError) {
          const requestId = error.request?.headers.get('X-Request-ID');
          
          console.error(`[API Error] ${error.request?.method} ${error.request?.url} - ${error.response.status}`, {
            requestId,
            status: error.response.status,
            error: error.message,
          });
        }
        
        return error;
      },
    ],
  },
});

// 响应拦截器
apiClient.extend({
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          let errorResponse: ApiErrorResponse;
          
          try {
            errorResponse = await response.json();
          } catch {
            // 如果响应不是JSON格式，创建默认错误响应
            errorResponse = {
              code: 'UNKNOWN_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          // 根据状态码处理不同类型的错误
          switch (response.status) {
            case 401:
              // 未授权 - 跳转到登录页
              if (typeof window !== 'undefined') {
                localStorage.removeItem('studentId');
                window.location.href = '/login';
              }
              break;
              
            case 429:
              // 请求过多 - 显示重试提示
              const retryAfter = errorResponse.retryAfter || 60;
              showToast(`请求过于频繁，请 ${retryAfter} 秒后重试`, 'warning');
              break;
              
            case 503:
              // 服务不可用 - 显示维护提示
              showToast('服务暂时不可用，请稍后重试', 'error');
              break;
              
            case 500:
            case 502:
            case 504:
              // 服务器错误 - 显示通用错误提示
              showToast('服务器繁忙，请稍后重试', 'error');
              break;
          }

          throw new ApiError(errorResponse, response.status);
        }
        
        return response;
      },
    ],
  },
});

// 工具函数：显示Toast提示
function showToast(message: string, type: 'success' | 'warning' | 'error' = 'error') {
  // 这里应该集成实际的Toast组件
  // 暂时使用简单的alert
  if (typeof window !== 'undefined') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    switch (type) {
      case 'success':
        toast.style.backgroundColor = '#10b981';
        break;
      case 'warning':
        toast.style.backgroundColor = '#f59e0b';
        break;
      case 'error':
        toast.style.backgroundColor = '#ef4444';
        break;
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// 导出常用的API方法
export const api = {
  // GET请求
  get: <T = any>(url: string, options?: any): Promise<T> => {
    return apiClient.get(url, options).json<T>();
  },
  
  // POST请求
  post: <T = any>(url: string, data?: any, options?: any): Promise<T> => {
    return apiClient.post(url, { json: data, ...options }).json<T>();
  },
  
  // PUT请求
  put: <T = any>(url: string, data?: any, options?: any): Promise<T> => {
    return apiClient.put(url, { json: data, ...options }).json<T>();
  },
  
  // DELETE请求
  delete: <T = any>(url: string, options?: any): Promise<T> => {
    return apiClient.delete(url, options).json<T>();
  },
  
  // 上传文件
  upload: <T = any>(url: string, file: File, options?: any): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post(url, { 
      body: formData,
      ...options 
    }).json<T>();
  },
};

// 错误处理工具函数
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof HTTPError) {
    return `网络错误: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '未知错误';
};

// 重试工具函数
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // 指数退避延迟
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};
