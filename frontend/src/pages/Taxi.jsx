import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Filter, Upload, Search, Car, X } from 'lucide-react'
import ChartBox from '../components/ChartBox'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const cls = v.toLowerCase()==='present'?'tag-green':v.toLowerCase()==='absent'?'tag-red':'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

export default function Taxi() {
  const { isAdmin } = useStore()
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters]     = useState({})
  const [search, setSearch]       = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [filterOpts, setFilterOpts] = useState({ companies:[], types:[], franchises:[], nationalities:[], institutes:[] })
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1, f=filters) {
    setLoading(true)
    try {
      const res = await api.getTaxi({ page:p, limit:LIMIT, ...f })
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function loadMeta() {
    try {
      const [opts, analytic] = await Promise.all([api.getTaxiFilters(), api.getAnalytics()])
      setFilterOpts(opts)
      setAnalytics(analytic?.taxi)
    } catch(e) {}
  }

  useEffect(() => { load(); loadMeta() }, [])

  function applyFilter(k, v) {
    const f = { ...filters, [k]: v||undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); load(1, f)
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Uploading Taxi & Limousine CSV...', { id:'csv' })
    try {
      const res = await api.uploadCSV('taxi', text)
      toast.success(`Imported ${res.inserted} records (${res.skipped} skipped)`, { id:'csv' })
      load(1); loadMeta()
    } catch(err) { toast.error(err.message, { id:'csv' }) }
    e.target.value = ''
  }

  const filtered = search
    ? rows.filter(r => (r.full_name||'').toLowerCase().includes(search.toLowerCase()) || (r.license||'').includes(search))
    : rows

  const pages = Math.ceil(total/LIMIT)
  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '--'
  const activeFiltersCount = Object.keys(filters).length

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{ background:'#fef3c7', color:'#d97706' }}><Car size={20}/></div>
          <div>
            <div className="dh-title">Taxi & Limousine Training</div>
            <div className="dh-sub">{total.toLocaleString()} records {activeFiltersCount>0?`(${activeFiltersCount} filter${activeFiltersCount>1?'s':''} active)`:''}</div>
          </div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)} style={{ position:'relative' }}>
            <Filter size={14}/> Slicers
            {activeFiltersCount>0 && <span style={{ position:'absolute', top:-6, right:-6, background:'#dc2626', color:'#fff', borderRadius:'99px', fontSize:9, fontWeight:800, padding:'1px 5px' }}>{activeFiltersCount}</span>}
          </button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="sl-label">Filters</span>
        <select className="sl-select" value={filters.company||''} onChange={e=>applyFilter('company',e.target.value)}>
          <option value="">All Companies</option>
          {filterOpts.companies.map(c=><option key={c}>{c}</option>)}
        </select>
        <select className="sl-select" value={filters.training_type||''} onChange={e=>applyFilter('training_type',e.target.value)}>
          <option value="">All Types</option>
          {filterOpts.types.map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="sl-select" value={filters.franchise||''} onChange={e=>applyFilter('franchise',e.target.value)}>
          <option value="">All Franchise</option>
          {filterOpts.franchises.map(f=><option key={f}>{f}</option>)}
        </select>
        <select className="sl-select" value={filters.nationality||''} onChange={e=>applyFilter('nationality',e.target.value)}>
          <option value="">All Nationalities</option>
          {filterOpts.nationalities.map(n=><option key={n}>{n}</option>)}
        </select>
        <select className="sl-select" value={filters.attendance||''} onChange={e=>applyFilter('attendance',e.target.value)}>
          <option value="">All Attendance</option>
          <option>Present</option><option>Absent</option>
        </select>
        <span className="sl-dim">From</span>
        <input type="date" className="sl-date" value={filters.from||''} onChange={e=>applyFilter('from',e.target.value)}/>
        <span className="sl-dim">To</span>
        <input type="date" className="sl-date" value={filters.to||''} onChange={e=>applyFilter('to',e.target.value)}/>
        <button className="sl-reset" onClick={()=>{setFilters({});load(1,{})}}>Reset</button>
        <button className="sl-close" onClick={()=>setSlicerOpen(false)}><X size={14}/></button>
      </div>

      <div className="page-body">
        {analytics && (
          <div className="kpi-grid c4">
            <div className="kpi" style={{'--kc':'#d97706','--kc-bg':'#fef3c7'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Total Records</div>
              <div className="kpi-value">{(analytics.total||0).toLocaleString()}</div>
            </div>
            <div className="kpi" style={{'--kc':'#059669','--kc-bg':'#f0fdf4'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Attendance Rate</div>
              <div className="kpi-value">{analytics.attendanceRate||0}%</div>
            </div>
            <div className="kpi" style={{'--kc':'#1d4ed8','--kc-bg':'#eff6ff'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Companies</div>
              <div className="kpi-value">{Object.keys(analytics.byCompany||{}).length}</div>
            </div>
            <div className="kpi" style={{'--kc':'#7c3aed','--kc-bg':'#f5f3ff'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Training Types</div>
              <div className="kpi-value">{Object.keys(analytics.byType||{}).length}</div>
            </div>
          </div>
        )}

        {analytics && (
          <div className="chart-grid c2">
            <ChartBox type="bar" labels={Object.keys(analytics.byCompany||{})} data={Object.values(analytics.byCompany||{})} title="By Company" height={240}/>
            <ChartBox type="doughnut" labels={Object.keys(analytics.byType||{})} data={Object.values(analytics.byType||{})} title="By Training Type" height={240}/>
          </div>
        )}

        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Taxi & Limousine Records</div>
            <div className="tt-badge">{total.toLocaleString()}</div>
            <div className="tt-right">
              {activeFiltersCount>0 && <button className="btn btn-ghost" style={{ fontSize:11, padding:'5px 10px', color:'#dc2626' }} onClick={()=>{setFilters({});load(1,{})}}><X size={11}/> Clear</button>}
              <div className="search-wrap"><Search size={13}/><input placeholder="Search name or license..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>#</th><th>License</th><th>Name</th><th>Nationality</th>
                <th>Franchise</th><th>Company</th><th>Training Type</th>
                <th>Institute</th><th>Start</th><th>End</th><th>Attendance</th>
                {isAdmin()&&<th></th>}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={11} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                : filtered.length===0 ? <tr><td colSpan={11}><div className="tbl-empty"><Car size={36} style={{margin:'0 auto 12px',display:'block',color:'#cbd5e1'}}/><div className="tbl-empty-title">No records found</div><div className="tbl-empty-sub">{activeFiltersCount>0?'Try clearing some filters':'Import your Taxi & Limousine CSV'}</div>{isAdmin()&&<button className="btn btn-primary" style={{marginTop:12}} onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>}</div></td></tr>
                : filtered.map((r,i)=>(
                  <tr key={r.id}>
                    <td style={{color:'#94a3b8',fontSize:11}}>{(page-1)*LIMIT+i+1}</td>
                    <td><span style={{fontWeight:600,color:'#0f2044',fontSize:12}}>{r.license||'--'}</span></td>
                    <td style={{fontWeight:500}}>{r.full_name||'--'}</td>
                    <td>{r.nationality||'--'}</td>
                    <td>{r.franchise||'--'}</td>
                    <td>{r.company||'--'}</td>
                    <td>{r.training_type||'--'}</td>
                    <td>{r.institute||'--'}</td>
                    <td style={{fontSize:12}}>{fmt(r.training_start)}</td>
                    <td style={{fontSize:12}}>{fmt(r.training_end)}</td>
                    <td><Tag v={r.attendance}/></td>
                    {isAdmin()&&<td><button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11,color:'#dc2626'}} onClick={async()=>{if(!confirm('Delete?'))return;await api.deleteTaxi(r.id);load(page)}}>Delete</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">Showing {Math.min((page-1)*LIMIT+1,total).toLocaleString()} to {Math.min(page*LIMIT,total).toLocaleString()} of {total.toLocaleString()}</span>
            <div className="pager">
              {page>1&&<button onClick={()=>load(page-1)}>&#8249;</button>}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,pages-4))+i;return<button key={p} className={p===page?'active':''} onClick={()=>load(p)}>{p}</button>})}
              {page<pages&&<button onClick={()=>load(page+1)}>&#8250;</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}