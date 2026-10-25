const SCRIPT_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Shared secret per request (diset di .env, dibandingkan di GAS
// dengan Script Properties `SHARED_SECRET`). Model auth demo.
const SHARED_SECRET = import.meta.env.VITE_GAS_SECRET || '';

export const TOKEN_KEY = 'ff_pos_token';

export const getStoredToken = (): string =>
  localStorage.getItem(TOKEN_KEY) || '';

export const setStoredToken = (token: string) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

interface ReqOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
}

export const apiRequest = async <T>(
  endpoint: string,
  opts: ReqOptions = {},
): Promise<T> => {
  const { body } = opts;
  const payload = {
    endpoint,
    secret: SHARED_SECRET,
    token: getStoredToken(),
    ...body,
  };

  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const login = (username: string, password: string) =>
  apiRequest<{
    success: boolean;
    token?: string;
    user?: unknown;
    message?: string;
  }>('/api/login', { body: { username, password } });

export default apiRequest;