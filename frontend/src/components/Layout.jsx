import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Home, Bus, BookOpen, UserCheck, Users, School, BarChart3, Settings, LogOut, Car } from 'lucide-react'

const NAV = [
  { section:'Main', items:[
    { to:'/', label:'Home', end:true, icon:<Home size={15}/> },
  ]},
  { section:'Public Bus', items:[
    { to:'/inservice',   label:'In-Service Training',  icon:<Bus size={15}/> },
    { to:'/preservice',  label:'Pre-Service Training', icon:<BookOpen size={15}/> },
    { to:'/recruitment', label:'Recruitment',          icon:<UserCheck size={15}/> },
  ]},
  { section:'School Bus', items:[
    { to:'/sb-drivers',     label:'Driver Training',     icon:<Users size={15}/> },
    { to:'/sb-supervisors', label:'Supervisor Training', icon:<School size={15}/> },
  ]},
  { section:'Taxi & Limousine', items:[
    { to:'/taxi', label:'Taxi & Limousine', icon:<Car size={15}/> },
  ]},
  { section:'Reports', items:[
    { to:'/analytics', label:'Analytics & Reports', icon:<BarChart3 size={15}/> },
    { to:'/settings',  label:'Settings',            icon:<Settings size={15}/> },
  ]},
]

export default function Layout() {
  const { user, clearAuth } = useStore()
  const navigate = useNavigate()

  function logout() {
    clearAuth()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon">BT</div>
          <div>
            <div className="sb-logo-txt">Bus Training</div>
            <div className="sb-logo-sub">Operations Dashboard</div>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="sb-section">{group.section}</div>
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => 'sb-link' + (isActive ? ' active' : '')}>
                  {item.icon}{item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sb-bottom">
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', marginBottom:8 }}>
            <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:600, color:'#fff' }}>{user?.username}</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,.4)' }}>{user?.role}</div>
            </div>
          </div>
          <button className="sb-link" onClick={logout} style={{ width:'100%' }}>
            <LogOut size={15}/> Logout
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="page-scroll"><Outlet /></div>
      </div>
    </div>
  )
}