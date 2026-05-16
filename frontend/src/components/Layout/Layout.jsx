import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const TITLES = {
  '/':            'Dashboard Overview',
  '/inservice':   'In-Service Training',
  '/preservice':  'Pre-Service Training',
  '/recruitment': 'Recruitment Pipeline',
  '/taxi':        'Taxi & Limousine',
  '/analytics':   'Analytics & Reports',
  '/settings':    'Settings',
}

export default function Layout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
