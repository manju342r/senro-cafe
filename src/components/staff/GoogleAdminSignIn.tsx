import { useEffect, useRef, useState } from 'react'
import {
  getGoogleClientId,
  loadGoogleIdentityScript,
  verifyGoogleCredential,
} from '@/lib/googleAuth'
import { adminLoginWithGoogle } from '@/lib/demoStore'

type Props = {
  onSuccess: () => void
  onError: (message: string) => void
}

export function GoogleAdminSignIn({ onSuccess, onError }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      try {
        const statusRes = await fetch('/api/auth/google/status')
        const status = await statusRes.json()
        if (cancelled) return

        if (!status.configured) {
          setConfigured(false)
          setStatusMsg(
            'Add VITE_GOOGLE_CLIENT_ID + ADMIN_EMAILS to .env to enable Gmail login.',
          )
          return
        }
        if (!status.allowlistConfigured) {
          setConfigured(false)
          setStatusMsg('Add your Gmail to ADMIN_EMAILS in .env (comma-separated).')
          return
        }

        const clientId = getGoogleClientId()
        if (!clientId) {
          setConfigured(false)
          setStatusMsg('Missing VITE_GOOGLE_CLIENT_ID in .env — restart after adding it.')
          return
        }

        await loadGoogleIdentityScript()
        if (cancelled || !buttonRef.current || !window.google) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            try {
              if (!response.credential) throw new Error('No Google credential returned')
              const profile = await verifyGoogleCredential(response.credential)
              adminLoginWithGoogle(profile)
              onSuccess()
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Google sign-in failed')
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        })

        setConfigured(true)
        setReady(true)
        setStatusMsg(null)
      } catch (e) {
        if (!cancelled) {
          setConfigured(false)
          setStatusMsg(e instanceof Error ? e.message : 'Could not load Google sign-in')
        }
      }
    }

    void setup()
    return () => {
      cancelled = true
    }
  }, [onError, onSuccess])

  return (
    <div className="space-y-3">
      <div ref={buttonRef} className="flex min-h-11 justify-center" />
      {!ready && statusMsg ? (
        <p className="text-center text-xs leading-relaxed text-steam">{statusMsg}</p>
      ) : null}
      {configured && ready ? (
        <p className="text-center text-xs text-steam">
          Only allowlisted Gmail accounts become super admin.
        </p>
      ) : null}
    </div>
  )
}
