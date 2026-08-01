const REFRESH_URL = 'https://mazzajoy.uz/api/v1/admin/token/refresh/'

let refreshInFlight: Promise<string | null> | null = null

function endSession() {
  localStorage.removeItem('mazza_admin_token')
  localStorage.removeItem('mazza_admin_refresh')
  window.dispatchEvent(new Event('mazza-admin-session-expired'))
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('mazza_admin_refresh')
  if (!refresh) return null
  if (!refreshInFlight) {
    refreshInFlight = fetch(REFRESH_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }),
    }).then(async response => {
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.access) return null
      localStorage.setItem('mazza_admin_token', body.access)
      return body.access as string
    }).catch(() => null).finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const access = localStorage.getItem('mazza_admin_token')
  if (access) headers.set('Authorization', `Bearer ${access}`)
  let response = await fetch(input, { ...init, headers })
  if (response.status !== 401) return response
  const refreshed = await refreshAccessToken()
  if (!refreshed) { endSession(); return response }
  headers.set('Authorization', `Bearer ${refreshed}`)
  response = await fetch(input, { ...init, headers })
  if (response.status === 401) endSession()
  return response
}
