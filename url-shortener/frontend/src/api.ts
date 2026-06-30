import type { CreateLinkRequest, LoginRequest, Link, AnalyticsRecord } from 'shared';

const BASE_URL = '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function shortenUrl(data: CreateLinkRequest): Promise<{ id: number; shortCode: string; shortUrl: string }> {
  const res = await fetch(`${BASE_URL}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(err.error || 'Failed to shorten URL');
  }
  return res.json();
}

export async function login(data: LoginRequest): Promise<{ token: string }> {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Invalid credentials' }));
    throw new Error(err.error || 'Failed to login');
  }
  return res.json();
}

export async function getLinks(): Promise<{ links: Link[] }> {
  const res = await fetch(`${BASE_URL}/api/links`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch links');
  }
  return res.json();
}

export async function updateLink(id: number, data: Partial<Link>): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/link/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update link');
  }
  return res.json();
}

export async function deleteLink(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/link/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to delete link');
  }
  return res.json();
}

export async function getAnalytics(id: number): Promise<{ link: Link; analytics: AnalyticsRecord[] }> {
  const res = await fetch(`${BASE_URL}/api/analytics/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return res.json();
}
