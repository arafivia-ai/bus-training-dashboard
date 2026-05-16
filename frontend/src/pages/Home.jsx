import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import LineChartBox from '../components/Charts/LineChartBox'
import FilterBar from '../components/Table/FilterBar'
import { Bus, BookOpen, UserCheck, Car } from 'lucide-react'

const MODULE_TABS = [
  { key:'inservice',   label:'In-Service',   icon: Bus,       color:'blue' },
  { key:'preservice',  label:'Pre-Service',  icon: BookOpen,  color:'green' },
  { key:'recruitment', label:'Recruitment',  icon: UserCheck, color:'amber' },
  { key:'taxi',        label:'Taxi & Limo',  icon: Car,       color:'purple' },
]

export default function Home() {
  const { user } = useStore()
  const [analytics, setAnalytics]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('inservice')
  const [filters, setFilters]       = useState({})
  const [filterOpts, setFilterOpts] = useState({})

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    api.getAnalytics().then(setAnalytics).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  useEffect(() => {
    loadFilterOpts(activeTab)
    setFilters({})
  }, [activeTab])

  async function loadFilterOpts(tab) {
    try {
      if (tab==='inservice')   { const d = await api.getInserviceFilters();   setFilterOpts(d) }
      if (tab==='preservice')  { const d = await api.getPreserviceFilters();  setFilterOpts(d) }
      if (tab==='recruitment') { const d = await api.getRecruitmentFilters(); setFilterOpts(d) }
      if (tab==='taxi')        { const d = await api.getTaxiFilters();        setFilterOpts(d) }
    } catch(e) {}
  }

  function applyFilter(k, v) {
    const f = { ...filters, [k]:v||undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f)
  }

  // ── IN-SERVICE ───────────────────────────────────────────────
  function InServiceDash() {
    const is = analytics?.inservice
    const depotData = Object.entries(is?.byDepot||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const typeData  = Object.entries(is?.byType||{}).map(([name,value])=>({name,value}))
    const attData   = Object.entries(is?.byAttendance||{}).map(([name,value])=>({name,value}))
    const natData   = Object.entries(is?.byNationality||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10)
    const yearData  = is?.trend || {}

    const filterOptions = [
      { key:'depot',         label:'Depot',      options: filterOpts.depots||[] },
      { key:'training_type', label:'Type',        options: filterOpts.types||[] },
      { key:'attendance',    label:'Attendance',  options: ['Present','Absent'] },
      { key:'nationality',   label:'Nationality', options: filterOpts.nationalities||[] },
      { key:'trainer',       label:'Trainer',     options: filterOpts.trainers||[] },
    ]

    return (
      <div className="space-y-4">
        <div className="card p-4">
          <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={()=>setFilters({})} showSearch={false} showDates={true}/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Sessions"  value={is?.total||0}                              icon={Bus} color="blue"   sub="All training records"/>
          <KPICard label="Attendance Rate" value={`${is?.attendanceRate||0}%`}                icon={Bus} color="green"  sub="Present percentage"/>
          <KPICard label="Active Depots"   value={Object.keys(is?.byDepot||{}).length}        icon={Bus} color="amber"  sub="With records"/>
          <KPICard label="Training Types"  value={Object.keys(is?.byType||{}).length}         icon={Bus} color="purple" sub="Different programs"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartBox   title="By Depot"         sub="Sessions per depot"  data={depotData} height={260}/>
          <DonutChartBox title="By Training Type" sub="Distribution"        data={typeData}  height={260}/>
        </div>
        <LineChartBox
          title="Monthly Training Trend"
          sub="Sessions per month — colored by year"
          multiYear={true}
          yearData={yearData}
          height={280}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutChartBox title="Attendance Split"     sub="Present vs Absent"  data={attData} height={240}/>
          <BarChartBox   title="Top 10 Nationalities" sub="Most represented"   data={natData} height={240} horiz={true}/>
        </div>
      </div>
    )
  }

  // ── PRE-SERVICE ──────────────────────────────────────────────
  function PreServiceDash() {
    const ps = analytics?.preservice
    const companyData = Object.entries(ps?.byCompany||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const statusData  = Object.entries(ps?.byStatus||{}).map(([name,value])=>({name,value}))
    const batchData   = Object.entries(ps?.byBatch||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10)

    const passRates = [
      { name:'Post E-Test',      value: ps?.postEtestPassRate||0 },
      { name:'OCC',              value: ps?.occPassRate||0 },
      { name:'Fire Fighting',    value: ps?.firePassRate||0 },
      { name:'Final Assessment', value: ps?.finalAssessPassRate||0 },
      { name:'Scenario',         value: ps?.scenarioPassRate||0 },
    ]

    const filterOptions = [
      { key:'company',        label:'Company',     options: filterOpts.companies||[] },
      { key:'status',         label:'Status',      options: filterOpts.statuses||[] },
      { key:'training_batch', label:'Batch',       options: filterOpts.batches||[] },
      { key:'nationality',    label:'Nationality', options: filterOpts.nationalities||[] },
    ]

    return (
      <div className="space-y-4">
        <div className="card p-4">
          <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={()=>setFilters({})} showSearch={false} showDates={false}/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Candidates"  value={ps?.total||0}                      icon={BookOpen} color="green"  sub="All candidates"/>
          <KPICard label="Final Pass Rate"   value={`${ps?.finalAssessPassRate||0}%`}   icon={BookOpen} color="blue"   sub="Final assessment"/>
          <KPICard label="Scenario Pass"     value={`${ps?.scenarioPassRate||0}%`}      icon={BookOpen} color="amber"  sub="Scenario test"/>
          <KPICard label="Post E-Test Pass"  value={`${ps?.postEtestPassRate||0}%`}     icon={BookOpen} color="purple" sub="E-Test result"/>
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">Training Stage Pass Rates</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {passRates.map(({name,value}) => (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">{name}</span>
                  <span className={`font-bold ${value>=70?'text-emerald-600':value>=50?'text-amber-600':'text-red-500'}`}>{value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${value>=70?'bg-emerald-500':value>=50?'bg-amber-500':'bg-red-500'}`} style={{width:`${value}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartBox   title="By Company"      sub="Candidates per company"     data={companyData} height={260}/>
          <DonutChartBox title="By Status"       sub="Current pipeline status"    data={statusData}  height={260}/>
        </div>
        <BarChartBox title="By Training Batch" sub="Candidates per batch" data={batchData} height={280} horiz={true}/>
      </div>
    )
  }

  // ── RECRUITMENT ──────────────────────────────────────────────
  function RecruitmentDash() {
    const rec = analytics?.recruitment
    const statusData  = Object.entries(rec?.byStatus||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const companyData = Object.entries(rec?.byCompany||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const roadData    = Object.entries(rec?.byRoadTest||{}).map(([name,value])=>({name,value}))
    const natData     = Object.entries(rec?.byNationality||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10)

    const onBoard     = rec?.byStatus?.['On Board']||0
    const shortlisted = rec?.byStatus?.['Shortlisted']||0
    const notShort    = rec?.byStatus?.['Not Shortlisted']||0

    const filterOptions = [
      { key:'company',     label:'Company',     options: filterOpts.companies||[] },
      { key:'status',      label:'Status',      options: filterOpts.statuses||[] },
      { key:'nationality', label:'Nationality', options: filterOpts.nationalities||[] },
      { key:'road_test',   label:'Road Test',   options: filterOpts.roadTests||[] },
    ]

    return (
      <div className="space-y-4">
        <div className="card p-4">
          <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={()=>setFilters({})} showSearch={false} showDates={false}/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Candidates" value={rec?.total||0} icon={UserCheck} color="amber"  sub="All in pipeline"/>
          <KPICard label="On Board"          value={onBoard}       icon={UserCheck} color="green"  sub="Successfully hired"/>
          <KPICard label="Shortlisted"       value={shortlisted}   icon={UserCheck} color="blue"   sub="Pending decision"/>
          <KPICard label="Not Shortlisted"   value={notShort}      icon={UserCheck} color="red"    sub="Not progressed"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutChartBox title="Pipeline Status" sub="Candidates by status"    data={statusData}  height={280}/>
          <BarChartBox   title="By Company"      sub="Candidates per company"  data={companyData} height={280}/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutChartBox title="Road Test Results"  sub="Pass vs Fail"      data={roadData} height={260}/>
          <BarChartBox   title="Top Nationalities"  sub="Most represented"  data={natData}  height={260} horiz={true}/>
        </div>
      </div>
    )
  }

  // ── TAXI ─────────────────────────────────────────────────────
  function TaxiDash() {
    const taxi = analytics?.taxi
    const companyData   = Object.entries(taxi?.byCompany||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const typeData      = Object.entries(taxi?.byType||{}).map(([name,value])=>({name,value}))
    const franchiseData = Object.entries(taxi?.byFranchise||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const attData       = Object.entries(taxi?.byAttendance||{}).map(([name,value])=>({name,value}))

    const filterOptions = [
      { key:'company',       label:'Company',     options: filterOpts.companies||[] },
      { key:'training_type', label:'Type',         options: filterOpts.types||[] },
      { key:'franchise',     label:'Franchise',    options: filterOpts.franchises||[] },
      { key:'nationality',   label:'Nationality',  options: filterOpts.nationalities||[] },
      { key:'attendance',    label:'Attendance',   options: ['Present','Absent','Graduated'] },
    ]

    return (
      <div className="space-y-4">
        <div className="card p-4">
          <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={()=>setFilters({})} showSearch={false} showDates={true}/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Records"   value={taxi?.total||0}                            icon={Car} color="purple" sub="All training records"/>
          <KPICard label="Attendance Rate" value={`${taxi?.attendanceRate||0}%`}              icon={Car} color="green"  sub="Present percentage"/>
          <KPICard label="Companies"       value={Object.keys(taxi?.byCompany||{}).length}    icon={Car} color="blue"   sub="Active companies"/>
          <KPICard label="Training Types"  value={Object.keys(taxi?.byType||{}).length}       icon={Car} color="amber"  sub="Different programs"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartBox   title="By Company"       sub="Records per company"       data={companyData}   height={280}/>
          <DonutChartBox title="By Training Type" sub="Distribution"              data={typeData}      height={280}/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartBox   title="By Franchise"     sub="Taxi vs Limousine"         data={franchiseData} height={260}/>
          <DonutChartBox title="Attendance Split" sub="Present vs Absent"         data={attData}       height={260}/>
        </div>
      </div>
    )
  }

  const tabContent = {
    inservice:   <InServiceDash/>,
    preservice:  <PreServiceDash/>,
    recruitment: <RecruitmentDash/>,
    taxi:        <TaxiDash/>,
  }

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <div className="text-sm text-primary-300 mb-1">{greeting}, {user?.username}</div>
        <h1 className="text-2xl font-extrabold mb-1">Bus Training Dashboard</h1>
        <p className="text-primary-300 text-sm">Centralised operations management for all training modules</p>
        {/* Summary KPIs in banner */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {MODULE_TABS.map(m => (
            <div key={m.key} className="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/20 transition-all" onClick={()=>setActiveTab(m.key)}>
              <div className="text-xs text-primary-300 mb-1">{m.label}</div>
              <div className="text-xl font-extrabold text-white">
                {loading ? '...' : (analytics?.[m.key]?.total||0).toLocaleString()}
              </div>
              <div className="text-xs text-primary-400">records</div>
            </div>
          ))}
        </div>
      </div>

      {/* Module tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {MODULE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab===key
                ? 'bg-white text-primary-700 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14}/>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
        </div>
      ) : (
        tabContent[activeTab]
      )}
    </div>
  )
}