const BASE = import.meta.env.VITE_API_BASE || "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 400;
  }
}

export interface StoredTokens {
  token: string;
  refreshToken: string;
}

type TokenReader = () => StoredTokens | null;
type RefreshHandler = () => Promise<string | null>;

let readTokens: TokenReader = () => null;
let refreshAccessToken: RefreshHandler = async () => null;

export function configureApi(options: {
  readTokens: TokenReader;
  refreshAccessToken: RefreshHandler;
}) {
  readTokens = options.readTokens;
  refreshAccessToken = options.refreshAccessToken;
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFrom(body: unknown, status: number) {
  if (body && typeof body === "object" && "error" in body) {
    const value = (body as { error: unknown }).error;
    if (typeof value === "string") return value;
  }
  if (typeof body === "string" && body.trim()) return body;
  return `Request failed with status ${status}`;
}

let inFlightRefresh: Promise<string | null> | null = null;

async function refreshOnce() {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshAccessToken().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options, null, false);
}

async function send<T>(
  path: string,
  options: RequestOptions,
  overrideToken: string | null,
  isRetry: boolean
): Promise<T> {
  const { method = "GET", body, auth = true, signal, headers = {} } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }
  const token = overrideToken ?? readTokens()?.token ?? null;
  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: requestHeaders,
      signal,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(0, "Unable to reach the server", null);
  }

  if (response.status === 401 && auth && !isRetry) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return send<T>(path, options, refreshed, true);
    }
  }

  const parsed = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(parsed, response.status), parsed);
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
