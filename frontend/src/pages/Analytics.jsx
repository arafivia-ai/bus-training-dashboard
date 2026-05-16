import React, { useEffect, useState } from 'react'
import { api } from '../api'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import LineChartBox from '../components/Charts/LineChartBox'
import { BarChart3, Bus, BookOpen, UserCheck, Car } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Analytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
    </div>
  )

  const { inservice: is, preservice: ps, recruitment: rec, taxi } = data || {}

  const depotData    = Object.entries(is?.byDepot || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value)
  const typeData     = Object.entries(is?.byType || {}).map(([name, value]) => ({ name, value }))
  const statusData   = Object.entries(rec?.byStatus || {}).map(([name, value]) => ({ name, value }))
  const companyData  = Object.entries(rec?.byCompany || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value)
  const trendData    = Object.entries(is?.trend || {}).map(([name, value]) => ({ name: name.slice(5), value })).slice(-12)
  const taxiCompany  = Object.entries(taxi?.byCompany || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value).slice(0,8)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <BarChart3 size={20} className="text-violet-600"/>
        </div>
        <div>
          <h1 className="text-lg font-700 text-slate-800">Analytics & Reports</h1>
          <p className="text-xs text-slate-400">Live data across all modules</p>
        </div>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="In-Service"   value={is?.total || 0}   icon={Bus}       color="blue"   sub="Training records"/>
        <KPICard label="Pre-Service"  value={ps?.total || 0}   icon={BookOpen}  color="green"  sub="Candidates"/>
        <KPICard label="Recruitment"  value={rec?.total || 0}  icon={UserCheck} color="amber"  sub="In pipeline"/>
        <KPICard label="Taxi"         value={taxi?.total || 0} icon={Car}       color="purple" sub="Training records"/>
      </div>

      {/* In-Service */}
      <div>
        <div className="text-xs font-700 uppercase tracking-widest text-slate-400 mb-3">Public Bus — In-Service Training</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartBox title="By Depot" data={depotData} height={260}/>
          <DonutChartBox title="By Training Type" data={typeData} height={260}/>
        </div>
        <div className="mt-4">
          <LineChartBox title="Monthly Training Trend" sub="In-service sessions per month" data={trendData} height={220}/>
        </div>
      </div>

      {/* Recruitment */}
      <div>
        <div className="text-xs font-700 uppercase tracking-widest text-slate-400 mb-3">Recruitment Pipeline</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutChartBox title="Pipeline Status" data={statusData} height={260}/>
          <BarChartBox title="By Company" data={companyData} height={260}/>
        </div>
      </div>

      {/* Taxi */}
      <div>
        <div className="text-xs font-700 uppercase tracking-widest text-slate-400 mb-3">Taxi & Limousine</div>
        <BarChartBox title="By Company" data={taxiCompany} height={260}/>
      </div>
    </div>
  )
}