import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Upload, UserCheck } from 'lucide-react'
import KPICard from '../components/Charts/KPICard'
import BarChartBox from '../components/Charts/BarChartBox'
import DonutChartBox from '../components/Charts/DonutChartBox'
import DataTable from '../components/Table/DataTable'
import FilterBar from '../components/Table/FilterBar'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = (l==='on board'||l==='pass')?'tag-green'
    :(l==='not shortlisted'||l==='fail'||l==='security rejected')?'tag-red'
    :(l==='shortlisted'||l==='pipeline')?'tag-blue':'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

const TABS = ['Overview', 'Analysis', 'Records']

export default function Recruitment() {
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
  const fileRef = useRef()
  const LIMIT = 100

  useEffect(() => {
    api.getAnalytics().then(d => setAnalytics(d?.recruitment)).catch(() => {})
    api.getRecruitmentFilters().then(setFilterOpts).catch(() => {})
  }, [])

  useEffect(() => { if (tab==='Records') loadRecords(1) }, [tab])

  async function loadRecords(p=1, f=filters) {
    setLoading(true)
    try {
      const res = await api.getRecruitment({ page:p, limit:LIMIT, ...f })
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

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Importing...', { id:'csv' })
    try {
      const res = await api.uploadCSV('recruitment', text)
      toast.success(`Imported ${res.inserted} candidates`, { id:'csv' })
      api.getAnalytics().then(d => setAnalytics(d?.recruitment)).catch(() => {})
    } catch(err) { toast.error(err.message, { id:'csv' }) }
    e.target.value = ''
  }

  const statusData  = Object.entries(analytics?.byStatus||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
  const companyData = Object.entries(analytics?.byCompany||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
  const roadData    = Object.entries(analytics?.byRoadTest||{}).map(([name,value])=>({name,value}))
  const natData     = Object.entries(analytics?.byNationality||{}).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10)

  const onBoard     = analytics?.byStatus?.['On Board']||0
  const shortlisted = analytics?.byStatus?.['Shortlisted']||0
  const notShort    = analytics?.byStatus?.['Not Shortlisted']||0

  const filterOptions = [
    { key:'company',        label:'Company',     options: filterOpts.companies||[] },
    { key:'status',         label:'Status',      options: filterOpts.statuses||[] },
    { key:'training_batch', label:'Batch',       options: filterOpts.batches||[] },
    { key:'nationality',    label:'Nationality', options: filterOpts.nationalities||[] },
    { key:'road_test',      label:'Road Test',   options: filterOpts.roadTests||[] },
  ]

  const columns = [
    { key:'sl',               label:'#' },
    { key:'rta_id',           label:'RTA ID' },
    { key:'full_name',        label:'Name',       render: v => <span className="font-medium">{v||'--'}</span> },
    { key:'nationality',      label:'Nationality' },
    { key:'company',          label:'Company',    render: v => v?<span className="tag tag-blue">{v}</span>:'--' },
    { key:'license_class',    label:'License' },
    { key:'road_test_result', label:'Road Test',  render: v => <Tag v={v}/> },
    { key:'interview_result', label:'Interview',  render: v => <Tag v={v}/> },
    { key:'training_batch',   label:'Batch' },
    { key:'graduation_date',  label:'Graduation', render: v => v?new Date(v).toLocaleDateString('en-GB'):'--' },
    { key:'status',           label:'Status',     render: v => <Tag v={v}/> },
  ]

  const filtered = search
    ? rows.filter(r=>(r.full_name||'').toLowerCase().includes(search.toLowerCase())||(r.rta_id||'').toString().includes(search))
    : rows

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <UserCheck size={20} className="text-amber-600"/>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Recruitment Pipeline</h1>
            <p className="text-xs text-slate-400">{(analytics?.total||0).toLocaleString()} total candidates</p>
          </div>
        </div>
        {isAdmin() && (
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV}/>
            <button className="btn-ghost text-sm" onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>
          </div>
        )}
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
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={resetFilters} showSearch={false} showDates={false}/>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Candidates" value={analytics?.total||0} icon={UserCheck} color="amber"  sub="All in pipeline"/>
            <KPICard label="On Board"          value={onBoard}             icon={UserCheck} color="green"  sub="Successfully hired"/>
            <KPICard label="Shortlisted"       value={shortlisted}         icon={UserCheck} color="blue"   sub="Pending decision"/>
            <KPICard label="Not Shortlisted"   value={notShort}            icon={UserCheck} color="red"    sub="Not progressed"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutChartBox title="Pipeline Status" sub="Candidates by status"   data={statusData}  height={280}/>
            <BarChartBox   title="By Company"      sub="Candidates per company" data={companyData} height={280}/>
          </div>
        </div>
      )}

      {tab==='Analysis' && (
        <div className="space-y-4">
          <div className="card p-4">
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={resetFilters} showSearch={false} showDates={false}/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutChartBox title="Road Test Results"  sub="Pass vs Fail"       data={roadData} height={260}/>
            <BarChartBox   title="Top Nationalities"  sub="Most represented"   data={natData}  height={260} horiz={true}/>
          </div>
        </div>
      )}

      {tab==='Records' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="text-sm font-semibold text-slate-700">
              Candidates <span className="text-primary-600 ml-2">{total.toLocaleString()}</span>
            </div>
            <FilterBar filters={filters} filterOpts={filterOptions} onFilter={applyFilter} onReset={resetFilters} search={search} onSearch={setSearch} showDates={false}/>
          </div>
          <DataTable columns={columns} rows={filtered} loading={loading} page={page} total={total} limit={LIMIT} onPage={p=>loadRecords(p)} emptyIcon="👥" emptyText="No candidates found"/>
        </div>
      )}
    </div>
  )
}