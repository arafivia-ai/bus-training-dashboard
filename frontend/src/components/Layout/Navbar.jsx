import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { api } from '../../api'
import { Bell, LogOut, ChevronDown, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar({ title }) {
  const { user, clearAuth, isAdmin } = useStore()
  const navigate = useNavigate()
  const [showUser, setShowUser] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  function logout() {
    clearAuth()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
      {/* Title */}
      <div className="flex-1">
        <div className="text-xs text-slate-400">{today}</div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all">
          <Bell size={16} className="text-slate-500"/>
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-700">
              {notifCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUser(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-700">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-500 text-slate-700">{user?.username}</span>
            <ChevronDown size={14} className="text-slate-400"/>
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-600 text-slate-800">{user?.username}</div>
                <div className="text-xs text-slate-400">{user?.role}</div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={14}/> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}