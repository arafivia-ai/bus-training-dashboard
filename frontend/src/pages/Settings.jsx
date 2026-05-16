import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, UserPlus, Trash2, Shield } from 'lucide-react'

export default function Settings() {
  const { user, isAdmin } = useStore()
  const [tab, setTab]     = useState('general')
  const [users, setUsers] = useState([])
  const [form, setForm]   = useState({ username:'', email:'', password:'', role:'Management' })

  useEffect(() => {
    if (isAdmin()) api.getUsers().then(setUsers).catch(() => {})
  }, [])

  async function addUser() {
    if (!form.username || !form.password) return toast.error('Username and password required')
    if (form.password.length < 6) return toast.error('Password min 6 characters')
    try {
      const u = await api.addUser(form)
      setUsers(prev => [...prev, u])
      setForm({ username:'', email:'', password:'', role:'Management' })
      toast.success('User added successfully')
    } catch(e) { toast.error(e.message) }
  }

  async function removeUser(id, name) {
    if (!confirm(`Remove user "${name}"?`)) return
    try {
      await api.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User removed')
    } catch(e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <SettingsIcon size={20} className="text-slate-600"/>
        </div>
        <div>
          <h1 className="text-lg font-700 text-slate-800">Settings</h1>
          <p className="text-xs text-slate-400">Manage users and system preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['general', 'users'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-500 transition-all capitalize ${tab === t ? 'bg-white text-primary-700 shadow-sm font-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Dashboard Name</label>
              <input className="input" defaultValue="Bus Training Dashboard"/>
            </div>
            <div>
              <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Organisation</label>
              <input className="input" defaultValue="Roads & Transport Authority"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Logged in as</label>
              <input className="input bg-slate-50" value={user?.username || ''} readOnly/>
            </div>
            <div>
              <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Role</label>
              <input className="input bg-slate-50" value={user?.role || ''} readOnly/>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-800">
            <div className="flex items-center gap-2 font-600 mb-1"><Shield size={14}/> Role Permissions</div>
            <div className="text-xs text-primary-600">Administrator — Full access including import/export and user management.</div>
            <div className="text-xs text-primary-600">Management — View only. No editing, importing or deleting.</div>
          </div>

          {isAdmin() && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-sm font-600 text-slate-700 mb-4">
                <UserPlus size={16}/> Add New User
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Username</label>
                  <input className="input" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} placeholder="username"/>
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@domain.com"/>
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                  <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min 6 characters"/>
                </div>
                <div>
                  <label className="block text-xs font-600 text-slate-500 uppercase tracking-wide mb-1.5">Role</label>
                  <select className="select" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                    <option>Administrator</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary text-sm" onClick={addUser}>
                <UserPlus size={14}/> Add User
              </button>
            </div>
          )}

          <div className="card divide-y divide-slate-50">
            <div className="px-5 py-3 text-xs font-700 uppercase tracking-wide text-slate-400">Active Users</div>
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-600 text-slate-800">{u.username}</div>
                  <div className="text-xs text-slate-400">{u.email || '—'}</div>
                </div>
                <span className={`tag ${u.role === 'Administrator' ? 'tag-blue' : 'tag-gray'}`}>{u.role}</span>
                {isAdmin() && u.username !== 'admin' && (
                  <button
                    onClick={() => removeUser(u.id, u.username)}
                    className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}