import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

function Login() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await login(identifier, password)

      console.log('Login response:', data)

      if (!data.success) {
        setError(data.message || 'Unable to sign in. Please try again.')
        return
      }

      // Save authentication data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Check if user must change password
      if (data.mustChangePassword) {
        navigate('/change-password')
        return
      }

      // Role-based routing
      switch (data.user.role) {
        case 'student':
          navigate('/chat')
          break

        case 'teacher':
          navigate('/teacher')
          break

        case 'admin':
          navigate('/admin')
          break

        default:
          setError('Your account role is not recognized.')
      }
    } catch (err) {
      console.error(err)
      setError('Unable to connect to CampusGPT. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Branding Section */}
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        {/* Ambient Glows */}
        <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute right-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30">
            AI
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            CampusGPT
          </h1>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-indigo-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Academic Intelligence
          </div>

          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-[3.5rem] sm:leading-[1.1]">
            Elevate your <br/>
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">academic life.</span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            A unified workspace designed to streamline communication, resource sharing, and productivity for students, teachers, and administrators.
          </p>

          {/* Illustrative Card */}
          <div className="mt-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Smart Dashboard</h3>
              <p className="mt-0.5 text-xs text-slate-400">Your entire campus, one click away.</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm font-medium text-slate-500">
          © {new Date().getFullYear()} CampusGPT. All rights reserved.
        </p>
      </section>

      {/* Login Section */}
      <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:bg-white lg:px-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-xl shadow-indigo-600/30">
              AI
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              CampusGPT
            </h1>
          </div>

          <div className="rounded-3xl border border-slate-200/60 bg-white px-6 py-10 shadow-2xl shadow-slate-200/40 sm:px-10">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to your academic workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email or University ID
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="Enter your email or ID"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 transition-shadow placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-10 pr-16 text-sm text-slate-900 transition-shadow placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50/50 p-4 text-sm text-red-600 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-500 lg:hidden">
            © {new Date().getFullYear()} CampusGPT.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login