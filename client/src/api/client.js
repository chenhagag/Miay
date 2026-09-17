const TOKEN_KEY = 'miay_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(method, url, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = { method, headers }
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  const res = await fetch(`/api${url}`, config)

  if (res.status === 401) {
    removeToken()
    window.location.reload()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'שגיאה בשרת' }))
    throw new Error(err.message || 'שגיאה בשרת')
  }

  if (res.status === 204) return null
  return res.json()
}

export const get = (url) => apiRequest('GET', url)
export const post = (url, body) => apiRequest('POST', url, body)
export const put = (url, body) => apiRequest('PUT', url, body)
export const del = (url) => apiRequest('DELETE', url)
