import { useCallback, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getStaffRole, isStaffLoggedIn, staffLogin } from '@/lib/demoStore'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { GoogleAdminSignIn } from '@/components/staff/GoogleAdminSignIn'

export function StaffLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const enterAs = useCallback(
    (pwd: string) => {
      setError(null)
      const role = staffLogin(pwd)
      if (role === 'admin') {
        navigate('/staff/sales')
      } else if (role === 'staff') {
        navigate('/staff/orders')
      } else {
        setError('Incorrect password')
      }
    },
    [navigate],
  )

  const goAdmin = useCallback(() => {
    navigate('/staff/sales')
  }, [navigate])

  if (isStaffLoggedIn()) {
    const role = getStaffRole()
    return <Navigate to={role === 'admin' ? '/staff/sales' : '/staff/orders'} replace />
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <BrandLogo size="lg" showWordmark />
      <h1 className="mt-6 font-display text-3xl font-medium text-foam">Staff sign in</h1>
      <p className="mt-2 text-steam">
        Super admin is ready now. Gmail is optional once you add your email to .env.
      </p>

      <section className="mt-8 border border-gold/40 bg-forest/50 p-6">
        <p className="eyebrow">Super admin</p>
        <h2 className="mt-2 font-display text-2xl text-foam">Enter as Super Admin</h2>
        <p className="mt-2 text-sm text-steam">
          Full access: sales, customers, analytics, and add / edit menu items.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-5 w-full"
          onClick={() => enterAs('admin')}
        >
          Enter as Super Admin
        </button>
        <p className="mt-3 text-center text-xs text-steam">
          Demo account · password also works as <code className="text-leaf">admin</code>
        </p>
      </section>

      <section className="mt-6 border border-line bg-forest/30 p-6">
        <p className="eyebrow">Optional · Gmail</p>
        <h2 className="mt-2 font-display text-xl text-foam">Continue with Google</h2>
        <p className="mt-2 text-sm text-steam">
          Needs your Gmail in ADMIN_EMAILS and as a Google Cloud test user.
        </p>
        <div className="mt-5">
          <GoogleAdminSignIn onSuccess={goAdmin} onError={setError} />
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <form
        className="mt-6 border border-line bg-forest/30 p-6"
        onSubmit={(e) => {
          e.preventDefault()
          enterAs(password)
        }}
      >
        <p className="eyebrow">Floor staff</p>
        <label htmlFor="password" className="mt-3 block text-sm font-medium text-steam">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field mt-2"
          autoComplete="current-password"
        />
        <p className="mt-2 text-xs text-steam">
          Floor: <code className="text-leaf">staff</code>
        </p>
        <button type="submit" className="btn btn-secondary mt-5 w-full">
          Enter as floor staff
        </button>
      </form>

      <Link to="/" className="btn btn-ghost mt-6 justify-center text-sm">
        ← Back to site
      </Link>
    </main>
  )
}
