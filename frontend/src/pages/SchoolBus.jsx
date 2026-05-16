import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { School } from 'lucide-react'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import LineChartBox from '../components/Charts/LineChartBox'
import DataTable from '../components/Table/DataTable'
import FilterBar from '../components/Table/FilterBar'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = l==='active'?'tag-green':l==='inactive'?'tag-red':l==='driver'?'tag-blue':l==='supervisor'?'tag-purple':'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

const TABS = ['Overview', 'Analysis', 'Records']

export default function SchoolBus() {
  const { isAdmin } = useStore()
  const [tab, setTab]               = useState('Overview')
  const [analytics, setAnalytics]   = useState(null)
  const [filterOpts, setFilterOpts] = useState({})
  const [rows, setRows]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [page, setPage]             = useState(1)
  const [filters, setFilters]       = useState({})
  const [search, setSearch]         = useState('')
  const LIMIT = 100

  useEffect(() => {
    api.getAnalytics().then(d => setAnalytics(d?.schoolbus)).catch(() => {})
    api.getSchoolBusFilters().then(setFilterOpts).catch(() => {})
  }, [])

  useEffect(() => { if (tab==='Records') loadRecords(1) }, [tab])

  async function loadRecords(p=1, f=filters) {
    setLoading(true)
    try {
      const res = await api.getSchoolBus({ page:p, limit:LIMIT, ...f })
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function applyFilter(k, v) {
    const f = { ...filters, [k]:v||undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f)
    if (tab==='Records') loadRecords(1, f)
  }

  function resetFilters() { setFilters({}); if (tab==='Records') loadRecords(1, {}) }

  const establishData = Object.entries(analytics?.byEstablishment||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10)
  const courseData    = Object.entries(analytics?.byCourseType||{}).map(([name,value])=>({name,value}))
  const roleData      = Object.entries(analytics?.byRole||{}).map(([name,value])=>({name,value}))
  const statusData    = Object.entries(analytics?.byStatus||{}).map(([name,value])=>({name,value}))
  const yearData      = analytics?.trend || {}

  const filterOptions = [
    { key:'establishment', label:'Establishment', options: filterOpts.establishments||[] },
    { key:'course',        label:'Course',        options: filterOpts.courses||[] },
    { key:'role',          label:'Role',           options: filterOpts.roles||[] },
    { key:'nationality',   label:'Nationality',   options: filterOpts.nationalities||[] },
    { key:'status',        label:'Status',        options: filterOpts.statuses||[] },
  ]

  const columns = [
    { key:'sl',            label:'#' },
    { key:'training_date', label:'Date',          render: v => v?new Date(v).toLocaleDateString('en-GB'):'--' },
    { key:'full_name',     label:'Name',          render: v => <span className="font-medium">{v||'--'}</span> },
    { key:'nationality',   label:'Nationality' },
    { key:'role',          label:'Role',          render: v => <Tag v={v}/> },
    { key:'establishment', label:'Establishment', render: v => v?<span className="tag tag-blue">{v}</span>:'--' },
    { key:'course',        label:'Course' },
    { key:'course_type',   label:'Type' },
    { key:'trainer',       label:'Trainer' },
    { key:'status',        label:'Status',        render: v => <Tag v={v}/> },
  ]

  const filtered = search
    ? rows.filter(r=>(r.full_name||'').toLowerCase().includes(search.toLowerCase())||(r.traffic_file||'').toString().includes(search))
    : rows

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <School size={20} className="text-teal-600"/>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">School Bus Training</h1>
            <p className="text-xs text-slate-400">{(analytics?.total||0).toLocaleString()} total records</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-white text-primary-700 shadow-sm font-semibold':'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==='Overview' && (
        <div className="space-y-4">
          <div className="card p-4">
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={resetFilters} showSearch={false} showDates={true}/>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Records"    value={analytics?.total||0}                              icon={School} color="blue"   sub="All training records"/>
            <KPICard label="Establishments"   value={Object.keys(analytics?.byEstablishment||{}).length} icon={School} color="green"  sub="Active schools"/>
            <KPICard label="Drivers"          value={analytics?.byRole?.['Driver']||0}                  icon={School} color="amber"  sub="Driver records"/>
            <KPICard label="Supervisors"      value={analytics?.byRole?.['Supervisor']||0}              icon={School} color="purple" sub="Supervisor records"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartBox   title="By Establishment" sub="Records per school"   data={establishData} height={280}/>
            <DonutChartBox title="By Role"          sub="Driver vs Supervisor" data={roleData}      height={280}/>
          </div>
          <LineChartBox title="Monthly Training Trend" sub="Sessions per month — by year" multiYear={true} yearData={yearData} height={260}/>
        </div>
      )}

      {tab==='Analysis' && (
        <div className="space-y-4">
          <div className="card p-4">
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={resetFilters} showSearch={false} showDates={true}/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutChartBox title="By Course Type" sub="Training type breakdown" data={courseData}  height={260}/>
            <DonutChartBox title="By Status"      sub="Active vs Inactive"      data={statusData}  height={260}/>
          </div>
          <BarChartBox title="Top Establishments" sub="Most active schools" data={establishData} height={300} horiz={true}/>
        </div>
      )}

      {tab==='Records' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="text-sm font-semibold text-slate-700">
              School Bus Records <span className="text-primary-600 ml-2">{total.toLocaleString()}</span>
            </div>
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={resetFilters} search={search} onSearch={setSearch} showDates={true}/>
          </div>
          <DataTable columns={columns} rows={filtered} loading={loading} page={page} total={total} limit={LIMIT} onPage={p=>loadRecords(p)} emptyIcon="🚌" emptyText="No school bus records found"/>
        </div>
      )}
    </div>
  )
}