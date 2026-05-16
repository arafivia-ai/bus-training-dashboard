import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Upload, BookOpen } from 'lucide-react'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import DataTable from '../components/Table/DataTable'
import FilterBar from '../components/Table/FilterBar'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = l.includes('pass') || l === 'graduated' ? 'tag-green'
    : l.includes('fail') ? 'tag-red'
    : l.includes('progress') ? 'tag-amber' : 'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

const TABS = ['Overview', 'Analysis', 'Records']

export default function PreService() {
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
    api.getAnalytics().then(d => setAnalytics(d?.preservice)).catch(() => {})
    api.getPreserviceFilters().then(setFilterOpts).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'Records') loadRecords(1)
  }, [tab])

  async function loadRecords(p = 1, f = filters) {
    setLoading(true)
    try {
      const res = await api.getPreservice({ page: p, limit: LIMIT, ...f })
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
      const res = await api.uploadCSV('preservice', text)
      toast.success(`Imported ${res.inserted} records`, { id: 'csv' })
      api.getAnalytics().then(d => setAnalytics(d?.preservice)).catch(() => {})
    } catch(err) { toast.error(err.message, { id: 'csv' }) }
    e.target.value = ''
  }

  const companyData = Object.entries(analytics?.byCompany || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const statusData  = Object.entries(analytics?.byStatus || {}).map(([name, value]) => ({ name, value }))
  const batchData   = Object.entries(analytics?.byBatch || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)

  const passRates = [
    { name: 'Road Test',        value: analytics?.roadTestPassRate || 0 },
    { name: 'Post E-Test',      value: analytics?.postEtestPassRate || 0 },
    { name: 'OCC',              value: analytics?.occPassRate || 0 },
    { name: 'Fire Fighting',    value: analytics?.firePassRate || 0 },
    { name: 'Final Assessment', value: analytics?.finalAssessPassRate || 0 },
    { name: 'Scenario',         value: analytics?.scenarioPassRate || 0 },
  ]

  const filterOptions = [
    { key: 'company',        label: 'Company',     options: filterOpts.companies || [] },
    { key: 'status',         label: 'Status',      options: filterOpts.statuses || [] },
    { key: 'training_batch', label: 'Batch',       options: filterOpts.batches || [] },
    { key: 'nationality',    label: 'Nationality', options: filterOpts.nationalities || [] },
  ]

  const columns = [
    { key: 'sl',              label: '#' },
    { key: 'rta_id',          label: 'RTA ID' },
    { key: 'driver_name',     label: 'Name', render: v => <span className="font-medium">{v || '--'}</span> },
    { key: 'nationality',     label: 'Nationality' },
    { key: 'company',         label: 'Company', render: v => v ? <span className="tag tag-blue">{v}</span> : '--' },
    { key: 'training_batch',  label: 'Batch' },
    { key: 'post_etest_result', label: 'Post E-Test', render: v => <Tag v={v}/> },
    { key: 'occ_result',      label: 'OCC', render: v => <Tag v={v}/> },
    { key: 'final_assessment', label: 'Final', render: v => <Tag v={v}/> },
    { key: 'scenario_result', label: 'Scenario', render: v => <Tag v={v}/> },
    { key: 'graduation_date', label: 'Graduation', render: v => v ? new Date(v).toLocaleDateString('en-GB') : '--' },
    { key: 'status',          label: 'Status', render: v => <Tag v={v}/> },
  ]

  const filtered = search
    ? rows.filter(r => (r.driver_name || '').toLowerCase().includes(search.toLowerCase()) || (r.rta_id || '').toString().includes(search))
    : rows

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-emerald-600"/>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Pre-Service Training</h1>
            <p className="text-xs text-slate-400">{(analytics?.total || 0).toLocaleString()} total candidates</p>
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
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-primary-700 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Candidates"    value={analytics?.total || 0}                icon={BookOpen} color="green" sub="All candidates"/>
            <KPICard label="Final Pass Rate"      value={`${analytics?.finalAssessPassRate || 0}%`} icon={BookOpen} color="blue"  sub="Final assessment"/>
            <KPICard label="Scenario Pass Rate"   value={`${analytics?.scenarioPassRate || 0}%`}    icon={BookOpen} color="amber" sub="Scenario test"/>
            <KPICard label="Post E-Test Pass"     value={`${analytics?.postEtestPassRate || 0}%`}   icon={BookOpen} color="purple" sub="E-Test result"/>
          </div>

          {/* Pass rate bars */}
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-700 mb-4">Training Stage Pass Rates</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {passRates.map(({ name, value }) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{name}</span>
                    <span className={`font-bold ${value >= 70 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartBox title="By Company" sub="Candidates per company" data={companyData} height={260}/>
            <DonutChartBox title="By Status" sub="Current pipeline status" data={statusData} height={260}/>
          </div>
        </div>
      )}

      {tab === 'Analysis' && (
        <div className="space-y-4">
          <BarChartBox title="By Training Batch" sub="Candidates per batch" data={batchData} height={300} horiz={true}/>
          <BarChartBox title="Pass Rates by Stage" sub="Percentage passing each stage" data={passRates} height={260} color="#059669"/>
        </div>
      )}

      {tab === 'Records' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="text-sm font-semibold text-slate-700">
              Pre-Service Records <span className="text-primary-600 ml-2">{total.toLocaleString()}</span>
            </div>
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter}
              onReset={() => { setFilters({}); loadRecords(1, {}) }} search={search} onSearch={setSearch}/>
          </div>
          <DataTable columns={columns} rows={filtered} loading={loading} page={page}
            total={total} limit={LIMIT} onPage={p => loadRecords(p)} emptyIcon="📚" emptyText="No pre-service records found"/>
        </div>
      )}
    </div>
  )
}
