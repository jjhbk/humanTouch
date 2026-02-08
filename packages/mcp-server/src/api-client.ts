import type { ApiResponse } from "@humanlayer/shared";

const baseUrl =
  process.env.HUMANLAYER_API_URL ?? "http://localhost:3001/api/v1";
const apiKey = process.env.HUMANLAYER_API_KEY ?? "";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | string[] | undefined>,
): Promise<ApiResponse<T>> {
  const url = new URL(`${baseUrl}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v);
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let message: string;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.error?.message ?? parsed.message ?? errorBody;
    } catch {
      message = errorBody;
    }
    throw new Error(`API error ${res.status}: ${message}`);
  }

  return (await res.json()) as ApiResponse<T>;
}

export const apiClient = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | string[] | undefined>,
  ): Promise<ApiResponse<T>> {
    return request<T>("GET", path, undefined, params);
  },

  post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>("POST", path, body);
  },

  patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, body);
  },
};
