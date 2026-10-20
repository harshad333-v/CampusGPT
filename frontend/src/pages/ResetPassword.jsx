import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!token) {
      setError('Invalid or missing password reset token.')
      return
    }

    if (!newPassword) {
      setError('Please enter your new password.')
      return
    }

    if (!confirmPassword) {
      setError('Please confirm your new password.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const data = await resetPassword(token, newPassword)

      console.log('Reset password response:', data)

      if (!data.success) {
        setError(
          data.message ||
            'Unable to reset your password. Please try again.'
        )
        return
      }

      setSuccess(true)

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)
    } catch (err) {
      console.error(err)
      setError('Unable to connect to CampusGPT. Please try again.')
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
            Create a new password.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            Set a new password to regain access to your academic workspace.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          CampusGPT Academic Platform
        </p>
      </section>

      {/* Reset Password Section */}
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
                  Reset your password
                </h2>

                <p className="mt-2 text-slate-500">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-16 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(!showNewPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-16 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
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
                  {loading ? 'Resetting...' : 'Reset password'}
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
                  Password reset successful
                </h2>

                <p className="mt-3 text-slate-500">
                  Your password has been reset successfully. Redirecting you
                  to the login page...
                </p>
              </div>

              <Link
                to="/login"
                className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center font-medium text-white transition hover:bg-slate-800"
              >
                Go to login
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default ResetPassword