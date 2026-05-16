import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bus, BookOpen, UserCheck, Car,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  Users, GraduationCap
} from 'lucide-react'

const NAV = [
  { section: 'Main', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ]},
  { section: 'Public Bus', items: [
    { to: '/inservice',   label: 'In-Service Training',  icon: Bus },
    { to: '/preservice',  label: 'Pre-Service Training', icon: BookOpen },
    { to: '/recruitment', label: 'Recruitment',          icon: UserCheck },
  ]},
  { section: 'Taxi & Limousine', items: [
    { to: '/taxi', label: 'Taxi & Limousine', icon: Car },
  ]},
  { section: 'Reports', items: [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings',  label: 'Settings',  icon: Settings },
  ]},
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`
      relative flex flex-col bg-primary-900 text-white transition-all duration-300
      ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 h-screen
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-primary-800">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bus size={16} className="text-white"/>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-700 text-white leading-tight">Bus Training</div>
            <div className="text-xs text-primary-400">Operations Dashboard</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(group => (
          <div key={group.section} className="mb-2">
            {!collapsed && (
              <div className="text-xs font-700 uppercase tracking-widest text-primary-500 px-2 py-2">
                {group.section}
              </div>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-500 transition-all
                  ${isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={17} className="flex-shrink-0"/>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-primary-50 transition-all"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-primary-600"/>
          : <ChevronLeft size={12} className="text-primary-600"/>
        }
      </button>
    </aside>
  )
}