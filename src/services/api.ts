const SCRIPT_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

interface ReqOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
}

export const apiRequest = async <T>(
  endpoint: string,
  opts: ReqOptions = {},
): Promise<T> => {
  const { body } = opts;
  const payload = { endpoint, ...body };

  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const login = (username: string, password: string) =>
  apiRequest<{ success: boolean; user?: unknown; message?: string }>(
    '/api/login',
    { body: { username, password } },
  );

export default apiRequest;