const AUTH_KEY = 'aitrading_auth'

export function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) return {}
    const data = JSON.parse(stored)
    const token = data?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  Object.entries(getAuthHeaders()).forEach(([k, v]) => headers.set(k, v))
  return fetch(url, { ...options, headers })
}
