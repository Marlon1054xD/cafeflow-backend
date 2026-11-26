const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
  .replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  let body = options.body
  if (body !== undefined && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  })
  const responseText = await response.text()
  let data = null

  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new ApiError(
        `La API devolvió una respuesta inválida (HTTP ${response.status}).`,
        response.status,
      )
    }
  }

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : `La solicitud falló (HTTP ${response.status}).`
    throw new ApiError(message, response.status, data)
  }

  return data
}

export function login(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function getCervezas() {
  const data = await apiRequest('/api/cervezas')
  if (!Array.isArray(data?.cervezas)) {
    throw new Error('La API devolvió un catálogo con un formato inesperado.')
  }
  return data.cervezas
}

export async function crearPedido(cervezaId, cantidad, token) {
  const data = await apiRequest('/api/pedidos', {
    method: 'POST',
    token,
    body: { items: [{ cervezaId, cantidad }] },
  })
  if (!data?.pedido || typeof data.pedido.id !== 'string') {
    throw new Error('La API devolvió un pedido con un formato inesperado.')
  }
  return data.pedido
}

export async function getPedido(id, token) {
  const data = await apiRequest(`/api/pedidos/${encodeURIComponent(id)}`, {
    token,
  })
  if (!data?.pedido || typeof data.pedido.id !== 'string') {
    throw new Error('La API devolvió un pedido con un formato inesperado.')
  }
  return data.pedido
}
