import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await forgotPassword(email)

      console.log('Forgot password response:', data)

      if (!data.success) {
        setError(
          data.message ||
            'Unable to send password reset link. Please try again.'
        )
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(
        'Unable to connect to CampusGPT. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">
      {/* Branding Section */}
      <section className="hidden bg-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            CampusGPT
          </h1>
        </div>

        <div className="max-w-md">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Account Recovery
          </p>

          <h2 className="text-5xl font-semibold leading-tight text-white">
            Get back into your account.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            Recover access to your academic workspace using your registered
            email address.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          CampusGPT Academic Platform
        </p>
      </section>

      {/* Forgot Password Section */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="mb-12 lg:hidden">
            <h1 className="text-2xl font-semibold text-slate-900">
              CampusGPT
            </h1>
          </div>

          {!success ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Forgot your password?
                </h2>

                <p className="mt-2 text-slate-500">
                  Enter your registered email address and we'll send you a
                  password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
                >
                  ← Back to login
                </Link>
              </div>
            </>
          ) : (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Check your email
                </h2>

                <p className="mt-3 text-slate-500">
                  If the email address is registered with CampusGPT, a
                  password reset link has been sent.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-sm leading-relaxed text-slate-600">
                  Check your inbox for the password reset email. If you don't
                  see it, check your spam or junk folder.
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
                >
                  ← Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default ForgotPassword