import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import LineChartBox from '../components/Charts/LineChartBox'
import { Bus, BookOpen, UserCheck, Car, TrendingUp, Users } from 'lucide-react'

export default function Home() {
  const { user } = useStore()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const modules = [
    { to: '/inservice',   label: 'In-Service Training',  icon: Bus,       color: 'blue',   total: analytics?.inservice?.total },
    { to: '/preservice',  label: 'Pre-Service Training', icon: BookOpen,  color: 'green',  total: analytics?.preservice?.total },
    { to: '/recruitment', label: 'Recruitment Pipeline', icon: UserCheck, color: 'amber',  total: analytics?.recruitment?.total },
    { to: '/taxi',        label: 'Taxi & Limousine',     icon: Car,       color: 'purple', total: analytics?.taxi?.total },
  ]

  // Prepare chart data
  const depotData = Object.entries(analytics?.inservice?.byDepot || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 8)

  const attendanceData = Object.entries(analytics?.inservice?.byAttendance || {})
    .map(([name, value]) => ({ name, value }))

  const recruitmentData = Object.entries(analytics?.recruitment?.byStatus || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const trendData = Object.entries(analytics?.inservice?.trend || {})
    .map(([name, value]) => ({ name: name.slice(5), value }))
    .slice(-12)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <div className="text-sm text-primary-300 mb-1">{greeting}, {user?.username}</div>
        <h1 className="text-2xl font-800 mb-1">Bus Training Dashboard</h1>
        <p className="text-primary-300 text-sm">
          Centralised operations management for all training modules
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(m => (
          <div key={m.to} onClick={() => navigate(m.to)} className="cursor-pointer hover:scale-105 transition-transform">
            <KPICard
              label={m.label}
              value={loading ? '...' : (m.total || 0)}
              icon={m.icon}
              color={m.color}
              sub="Total records"
            />
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartBox
          title="Training Sessions by Depot"
          sub="In-Service Training distribution"
          data={depotData}
          height={260}
        />
        <DonutChartBox
          title="Attendance Overview"
          sub="Present vs Absent — In-Service"
          data={attendanceData}
          height={260}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartBox
          title="Monthly Training Trend"
          sub="In-Service sessions per month"
          data={trendData}
          height={220}
        />
        <DonutChartBox
          title="Recruitment Pipeline"
          sub="Candidates by current status"
          data={recruitmentData}
          height={220}
        />
      </div>
    </div>
  )
}