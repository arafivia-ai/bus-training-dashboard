import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Upload, Bus, Download } from 'lucide-react'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import LineChartBox from '../components/Charts/LineChartBox'
import DataTable from '../components/Table/DataTable'
import FilterBar from '../components/Table/FilterBar'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  return <span className={`tag ${l === 'present' ? 'tag-green' : l === 'absent' ? 'tag-red' : 'tag-gray'}`}>{v}</span>
}

const TABS = ['Overview', 'Analysis', 'Records']

export default function InService() {
  const { isAdmin } = useStore()
  const [tab, setTab]             = useState('Overview')
  const [analytics, setAnalytics] = useState(null)
  const [filterOpts, setFilterOpts] = useState({})
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [page, setPage]           = useState(1)
  const [filters, setFilters]     = useState({})
  const [search, setSearch]       = useState('')
  const fileRef = useRef()
  const LIMIT = 100

  useEffect(() => {
    api.getAnalytics().then(d => setAnalytics(d?.inservice)).catch(() => {})
    api.getInserviceFilters().then(setFilterOpts).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'Records') loadRecords(1)
  }, [tab])

  async function loadRecords(p = 1, f = filters) {
    setLoading(true)
    try {
      const res = await api.getInservice({ page: p, limit: LIMIT, ...f })
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function applyFilter(k, v) {
    const f = { ...filters, [k]: v || undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); loadRecords(1, f)
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Importing...', { id: 'csv' })
    try {
      const res = await api.uploadCSV('inservice', text)
      toast.success(`Imported ${res.inserted} records`, { id: 'csv' })
      api.getAnalytics().then(d => setAnalytics(d?.inservice)).catch(() => {})
    } catch(err) { toast.error(err.message, { id: 'csv' }) }
    e.target.value = ''
  }

  // Chart data
  const depotData = Object.entries(analytics?.byDepot || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const typeData  = Object.entries(analytics?.byType || {}).map(([name, value]) => ({ name, value }))
  const attData   = Object.entries(analytics?.byAttendance || {}).map(([name, value]) => ({ name, value }))
  const natData   = Object.entries(analytics?.byNationality || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  const trendData = Object.entries(analytics?.trend || {}).map(([name, value]) => ({ name: name.slice(5), value })).slice(-12)

  const filterOptions = [
    { key: 'depot',         label: 'Depot',       options: filterOpts.depots || [] },
    { key: 'training_type', label: 'Type',         options: filterOpts.types || [] },
    { key: 'attendance',    label: 'Attendance',   options: ['Present', 'Absent'] },
    { key: 'nationality',   label: 'Nationality',  options: filterOpts.nationalities || [] },
    { key: 'trainer',       label: 'Trainer',      options: filterOpts.trainers || [] },
  ]

  const columns = [
    { key: 'sl',            label: '#' },
    { key: 'staff_id',      label: 'Staff ID' },
    { key: 'driver_name',   label: 'Driver Name', render: v => <span className="font-medium">{v || '--'}</span> },
    { key: 'nationality',   label: 'Nationality' },
    { key: 'depot',         label: 'Depot', render: v => v ? <span className="tag tag-blue">{v}</span> : '--' },
    { key: 'training_date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '--' },
    { key: 'training_type', label: 'Type' },
    { key: 'course_name',   label: 'Course' },
    { key: 'trainer',       label: 'Trainer' },
    { key: 'attendance',    label: 'Attendance', render: v => <Tag v={v}/> },
  ]

  const filtered = search
    ? rows.filter(r => (r.driver_name || '').toLowerCase().includes(search.toLowerCase()) || (r.staff_id || '').toString().includes(search))
    : rows

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Bus size={20} className="text-primary-600"/>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">In-Service Training</h1>
            <p className="text-xs text-slate-400">{(analytics?.total || 0).toLocaleString()} total records</p>
          </div>
        </div>
        {isAdmin() && (
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV}/>
            <button className="btn-ghost text-sm" onClick={() => fileRef.current.click()}>
              <Upload size={14}/> Import CSV
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-primary-700 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Sessions"   value={analytics?.total || 0}          icon={Bus}    color="blue"   sub="All training records"/>
            <KPICard label="Attendance Rate"  value={`${analytics?.attendanceRate || 0}%`} icon={Bus} color="green" sub="Present percentage"/>
            <KPICard label="Active Depots"    value={Object.keys(analytics?.byDepot || {}).length} icon={Bus} color="amber" sub="With training records"/>
            <KPICard label="Training Types"   value={Object.keys(analytics?.byType || {}).length}  icon={Bus} color="purple" sub="Different programs"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartBox title="By Depot" sub="Sessions per depot" data={depotData} height={260}/>
            <DonutChartBox title="By Training Type" sub="Distribution" data={typeData} height={260}/>
          </div>
          <LineChartBox title="Monthly Trend" sub="Training sessions per month" data={trendData} height={220}/>
        </div>
      )}

      {/* Analysis Tab */}
      {tab === 'Analysis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartBox title="Attendance Split" sub="Present vs Absent" data={attData} height={240} color="#059669"/>
            <BarChartBox title="Top 10 Nationalities" sub="Most represented" data={natData} height={240} horiz={true}/>
          </div>
          <BarChartBox title="Training by Depot (Detailed)" sub="Full depot breakdown" data={depotData} height={300}/>
        </div>
      )}

      {/* Records Tab */}
      {tab === 'Records' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">
                Training Records <span className="text-primary-600 ml-2">{total.toLocaleString()}</span>
              </div>
            </div>
            <FilterBar
              filters={filters}
              filterOpts={filterOptions}
              onFilter={applyFilter}
              onReset={() => { setFilters({}); loadRecords(1, {}) }}
              search={search}
              onSearch={setSearch}
            />
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            page={page}
            total={total}
            limit={LIMIT}
            onPage={p => loadRecords(p)}
            emptyIcon="🚌"
            emptyText="No training records found"
          />
        </div>
      )}
    </div>
  )
}
