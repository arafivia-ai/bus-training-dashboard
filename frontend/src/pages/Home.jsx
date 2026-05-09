import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'

const MODULES = [
  { to:'/inservice',      mc:'#1d4ed8', bg:'#eff6ff', title:'In-Service Training',    desc:'Public bus driver in-service and school bus training records with attendance tracking.', lbl:'Records' },
  { to:'/preservice',     mc:'#059669', bg:'#f0fdf4', title:'Pre-Service Training',   desc:'Bus familiarisation, route familiarisation and tourism training records.', lbl:'Records' },
  { to:'/recruitment',    mc:'#d97706', bg:'#fffbeb', title:'Recruitment Pipeline',   desc:'Candidate tracking, road test results, interview outcomes and onboarding status.', lbl:'Candidates' },
  { to:'/sb-drivers',     mc:'#7c3aed', bg:'#f5f3ff', title:'SB Driver Training',     desc:'School bus driver training records, attendance and course completion.', lbl:'Records' },
  { to:'/sb-supervisors', mc:'#0891b2', bg:'#ecfeff', title:'SB Supervisor Training', desc:'School bus supervisor training records and certification tracking.', lbl:'Records' },
  { to:'/analytics',      mc:'#dc2626', bg:'#fef2f2', title:'Analytics & Reports',    desc:'Trends, depot comparisons, attendance rates and exportable reports.', lbl:'Modules' },
]

export default function Home() {
  const { user } = useStore()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    api.getAnalytics().then(setAnalytics).catch(() => {})
  }, [])

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const counts = [
    analytics?.inservice?.total || 0,
    analytics?.preservice?.total || 0,
    analytics?.recruitment?.total || 0,
    analytics?.schoolDrivers?.total || 0,
    analytics?.schoolSupervisors?.total || 0,
    6,
  ]

  return (
    <div className="page-body">
      <div className="hero">
        <div className="hero-greeting">{greeting}, {user?.username}</div>
        <div className="hero-title">Bus Training Dashboard</div>
        <div className="hero-sub">Centralised management for Public Bus and School Bus driver training, recruitment and compliance.</div>
        <div className="hero-kpis">
          {[
            ['In-Service', analytics?.inservice?.total || 0],
            ['Pre-Service', analytics?.preservice?.total || 0],
            ['Recruitment', analytics?.recruitment?.total || 0],
            ['SB Drivers', analytics?.schoolDrivers?.total || 0],
            ['SB Supervisors', analytics?.schoolSupervisors?.total || 0],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="hkpi-val">{Number(v).toLocaleString()}</div>
              <div className="hkpi-lbl">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#94a3b8' }}>Select a Module</div>
      <div className="module-grid">
        {MODULES.map((m, i) => (
          <div key={m.to} className="mc" style={{ '--mc': m.mc, '--mc-bg': m.bg }} onClick={() => navigate(m.to)}>
            <div className="mc-top" />
            <div className="mc-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
            </div>
            <div className="mc-title">{m.title}</div>
            <div className="mc-desc">{m.desc}</div>
            <div className="mc-footer">
              <div>
                <div className="mc-count">{counts[i].toLocaleString()}</div>
                <div className="mc-lbl">{m.lbl}</div>
              </div>
              <div className="mc-arrow">›</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}