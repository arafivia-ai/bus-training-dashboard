import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Bus } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { setAuth } = useStore()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.login(username, password)
      if (!res?.token) throw new Error('Login failed')
      setAuth(res.user, res.token)
      toast.success('Welcome back, ' + res.user.username)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Bus size={20} className="text-white"/>
          </div>
          <div>
            <div className="font-bold text-base">Bus Training Dashboard</div>
            <div className="text-xs text-primary-400">Operations Management System</div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Manage training.<br/>
            Track recruitment.<br/>
            <span className="text-primary-300">All in one place.</span>
          </h1>
          <p className="text-primary-300 text-sm leading-relaxed max-w-md">
            Centralised dashboard for Public Bus and School Bus driver training records,
            recruitment pipeline, taxi & limousine training and compliance tracking.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            ['100K+', 'In-Service Records'],
            ['1,270', 'Pre-Service Candidates'],
            ['1,702', 'Recruitment Pipeline'],
            ['98K+', 'Taxi & Limousine'],
          ].map(([v, l]) => (
            <div key={l} className="bg-primary-800 rounded-xl p-4">
              <div className="text-2xl font-extrabold text-white">{v}</div>
              <div className="text-xs text-primary-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Bus size={20} className="text-white"/>
            </div>
            <div className="font-bold text-primary-900">Bus Training Dashboard</div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to access the dashboard</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Username</label>
              <input
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-6 text-xs text-slate-400">
            <Lock size={12}/>
            Secured with JWT authentication
          </div>
        </div>
      </div>
    </div>
  )
}
