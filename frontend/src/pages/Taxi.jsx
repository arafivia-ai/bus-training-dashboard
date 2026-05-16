import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Upload, Car } from 'lucide-react'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import LineChartBox from '../components/Charts/LineChartBox'
import DataTable from '../components/Table/DataTable'
import FilterBar from '../components/Table/FilterBar'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  return <span className={`tag ${l === 'present' || l === 'graduated' ? 'tag-green' : l === 'absent' ? 'tag-red' : 'tag-gray'}`}>{v}</span>
}

const TABS = ['Overview', 'Analysis', 'Records']

export default function Taxi() {
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
    api.getAnalytics().then(d => setAnalytics(d?.taxi)).catch(() => {})
    api.getTaxiFilters().then(setFilterOpts).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'Records') loadRecords(1)
  }, [tab])

  async function loadRecords(p = 1, f = filters) {
    setLoading(true)
    try {
      const res = await api.getTaxi({ page: p, limit: LIMIT, ...f })
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
      const res = await api.uploadCSV('taxi', text)
      toast.success(`Imported ${res.inserted} records`, { id: 'csv' })
      api.getAnalytics().then(d => setAnalytics(d?.taxi)).catch(() => {})
    } catch(err) { toast.error(err.message, { id: 'csv' }) }
    e.target.value = ''
  }

  const companyData   = Object.entries(analytics?.byCompany || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const typeData      = Object.entries(analytics?.byType || {}).map(([name, value]) => ({ name, value }))
  const franchiseData = Object.entries(analytics?.byFranchise || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const attData       = Object.entries(analytics?.byAttendance || {}).map(([name, value]) => ({ name, value }))

  const filterOptions = [
    { key: 'company',       label: 'Company',     options: filterOpts.companies || [] },
    { key: 'training_type', label: 'Type',         options: filterOpts.types || [] },
    { key: 'franchise',     label: 'Franchise',    options: filterOpts.franchises || [] },
    { key: 'nationality',   label: 'Nationality',  options: filterOpts.nationalities || [] },
    { key: 'attendance',    label: 'Attendance',   options: ['Present', 'Absent', 'Graduated'] },
  ]

  const columns = [
    { key: 'sl',             label: '#' },
    { key: 'license',        label: 'License' },
    { key: 'full_name',      label: 'Name', render: v => <span className="font-500">{v || '--'}</span> },
    { key: 'nationality',    label: 'Nationality' },
    { key: 'franchise',      label: 'Franchise', render: v => v ? <span className="tag tag-purple">{v}</span> : '--' },
    { key: 'company',        label: 'Company', render: v => v ? <span className="tag tag-blue">{v}</span> : '--' },
    { key: 'training_type',  label: 'Type' },
    { key: 'institute',      label: 'Institute' },
    { key: 'training_start', label: 'Start', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '--' },
    { key: 'training_end',   label: 'End', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '--' },
    { key: 'attendance',     label: 'Attendance', render: v => <Tag v={v}/> },
  ]

  const filtered = search
    ? rows.filter(r => (r.full_name || '').toLowerCase().includes(search.toLowerCase()) || (r.license || '').toString().includes(search))
    : rows

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-purple-600"/>
          </div>
          <div>
            <h1 className="text-lg font-700 text-slate-800">Taxi & Limousine Training</h1>
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

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-500 transition-all ${tab === t ? 'bg-white text-primary-700 shadow-sm font-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Records"    value={analytics?.total || 0}               icon={Car} color="purple" sub="All training records"/>
            <KPICard label="Attendance Rate"  value={`${analytics?.attendanceRate || 0}%`} icon={Car} color="green"  sub="Present percentage"/>
            <KPICard label="Companies"        value={Object.keys(analytics?.byCompany || {}).length}  icon={Car} color="blue"   sub="Active companies"/>
            <KPICard label="Training Types"   value={Object.keys(analytics?.byType || {}).length}     icon={Car} color="amber"  sub="Different programs"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartBox title="By Company" sub="Records per company" data={companyData} height={280}/>
            <DonutChartBox title="By Training Type" sub="Distribution" data={typeData} height={280}/>
          </div>
        </div>
      )}

      {tab === 'Analysis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartBox title="By Franchise" sub="Taxi vs Limousine breakdown" data={franchiseData} height={260}/>
            <DonutChartBox title="Attendance Split" sub="Present vs Absent" data={attData} height={260}/>
          </div>
        </div>
      )}

      {tab === 'Records' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="text-sm font-600 text-slate-700">
              Taxi & Limousine Records <span className="text-primary-600 ml-2">{total.toLocaleString()}</span>
            </div>
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter}
              onReset={() => { setFilters({}); loadRecords(1, {}) }} search={search} onSearch={setSearch}/>
          </div>
          <DataTable columns={columns} rows={filtered} loading={loading} page={page}
            total={total} limit={LIMIT} onPage={p => loadRecords(p)} emptyIcon="🚕" emptyText="No taxi records found"/>
        </div>
      )}
    </div>
  )
}