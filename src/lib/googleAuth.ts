declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null

export function getGoogleClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || ''
}

export function getAdminEmailAllowlist(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export type GoogleAuthResult = {
  email: string
  name: string
  picture: string | null
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleAuthResult> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Google sign-in failed')
  }
  return {
    email: String(data.email),
    name: String(data.name || data.email),
    picture: data.picture ? String(data.picture) : null,
  }
}
