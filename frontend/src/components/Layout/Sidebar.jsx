import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bus, BookOpen, UserCheck,
  Car, School, BarChart3, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react'

const NAV = [
  { section:'Main', items:[
    { to:'/', label:'Dashboard', icon:LayoutDashboard, end:true },
  ]},
  { section:'Public Bus', items:[
    { to:'/inservice',   label:'In-Service',  icon:Bus },
    { to:'/preservice',  label:'Pre-Service', icon:BookOpen },
    { to:'/recruitment', label:'Recruitment', icon:UserCheck },
  ]},
  { section:'School Bus', items:[
    { to:'/schoolbus', label:'School Bus', icon:School },
  ]},
  { section:'Taxi & Limousine', items:[
    { to:'/taxi', label:'Taxi & Limousine', icon:Car },
  ]},
  { section:'Reports', items:[
    { to:'/analytics', label:'Analytics', icon:BarChart3 },
    { to:'/settings',  label:'Settings',  icon:Settings },
  ]},
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`relative flex flex-col transition-all duration-300 flex-shrink-0 h-screen ${collapsed?'w-16':'w-56'}`}
      style={{ background:'#1a2744' }}>
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor:'rgba(255,255,255,0.08)' }}>
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bus size={15} className="text-white"/>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Bus Training</div>
            <div className="text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>Operations Dashboard</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(group => (
          <div key={group.section} className="mb-2">
            {!collapsed && (
              <div className="text-xs font-bold uppercase tracking-widest px-2 py-2" style={{ color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em' }}>
                {group.section}
              </div>
            )}
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all
                  ${isActive
                    ? 'text-white'
                    : 'hover:text-white'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(59,130,246,0.25)' : 'transparent',
                  borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                })}
              >
                <item.icon size={16} className="flex-shrink-0"/>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-primary-50 transition-all z-10"
      >
        {collapsed
          ? <ChevronRight size={11} className="text-primary-600"/>
          : <ChevronLeft size={11} className="text-primary-600"/>
        }
      </button>
    </aside>
  )
}