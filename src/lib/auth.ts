const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tpestore_token');
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tpestore_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tpestore_token');
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error('Đăng ký thất bại');
  const data = await res.json();
  return data as { token: string; user: AuthUser };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Đăng nhập thất bại');
  const data = await res.json();
  return data as { token: string; user: AuthUser };
}

export async function me(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as AuthUser;
}

export async function updateMe(payload: { name?: string }): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error('Chưa đăng nhập');
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Cập nhật thất bại');
  const data = await res.json();
  return data.user as AuthUser;
}


