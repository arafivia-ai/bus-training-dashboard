import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Filter, Upload, Plus, Search, BookOpen, X, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

function StatusBadge({ v }) {
  if (!v || v === '--') return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  if (l.includes('pass') || l.includes('graduated') || l === 'yes') return <span className="tag tag-green">{v}</span>
  if (l.includes('fail') || l === 'no') return <span className="tag tag-red">{v}</span>
  if (l.includes('progress') || l.includes('ongoing')) return <span className="tag tag-amber">{v}</span>
  return <span className="tag tag-gray">{v}</span>
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className="kpi" style={{ '--kc': color, '--kc-bg': bg }}>
      <div className="kpi-accent"/>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  )
}

export default function PreService() {
  const { isAdmin } = useStore()
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [search, setSearch]   = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1, f=filters) {
    setLoading(true)
    try {
      const res = await api.getPreservice({ page:p, limit:LIMIT, ...f })
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    api.getAnalytics().then(d => setAnalytics(d?.preservice)).catch(()=>{})
  }, [])

  function applyFilter(k,v) {
    const f = { ...filters, [k]:v||undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); load(1,f)
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Uploading Pre-Service CSV...', { id:'csv' })
    try {
      const res = await api.uploadCSV('preservice', text)
      toast.success(`Imported ${res.inserted} records (${res.skipped} skipped)`, { id:'csv' })
      load(1)
      api.getAnalytics().then(d => setAnalytics(d?.preservice)).catch(()=>{})
    } catch(err) { toast.error(err.message, { id:'csv' }) }
    e.target.value = ''
  }

  const filtered = search
    ? rows.filter(r => (r.driver_name||'').toLowerCase().includes(search.toLowerCase()) || (r.rta_id||'').includes(search) || (r.company||'').toLowerCase().includes(search.toLowerCase()))
    : rows

  const pages = Math.ceil(total/LIMIT)

  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '--'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{ background:'#f0fdf4', color:'#059669' }}><BookOpen size={20}/></div>
          <div>
            <div className="dh-title">Pre-Service Training</div>
            <div className="dh-sub">{total.toLocaleString()} candidates across all batches</div>
          </div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}><Filter size={14}/> Slicers</button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="sl-label">Slicers</span>
        <select className="sl-select" value={filters.company||''} onChange={e=>applyFilter('company',e.target.value)}>
          <option value="">All Companies</option>
          {['Reach','Omnix','Expert Plus','Okool PB','Ultimate1','Ultimate2','AlSundus','AlSahra'].map(c=><option key={c}>{c}</option>)}
        </select>
        <select className="sl-select" value={filters.status||''} onChange={e=>applyFilter('status',e.target.value)}>
          <option value="">All Status</option>
          {['Graduated','In Progress','Failed','On Hold','Dropped'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="sl-select" value={filters.nationality||''} onChange={e=>applyFilter('nationality',e.target.value)}>
          <option value="">All Nationalities</option>
          {['Pakistan','India','Nepal','Egypt','Sudan','Bangladesh'].map(n=><option key={n}>{n}</option>)}
        </select>
        <button className="sl-reset" onClick={()=>{setFilters({});load(1,{})}}>Reset</button>
        <button className="sl-close" onClick={()=>setSlicerOpen(false)}><X size={14}/></button>
      </div>

      <div className="page-body">
        {/* KPI Cards */}
        {analytics && (
          <div className="kpi-grid c4">
            <StatCard label="Total Candidates" value={analytics.total?.toLocaleString()||0} color="#059669" bg="#f0fdf4"/>
            <StatCard label="Final Assessment Pass" value={analytics.finalAssessPassRate+'%'} color="#1d4ed8" bg="#eff6ff"/>
            <StatCard label="Scenario Pass Rate" value={analytics.scenarioPassRate+'%'} color="#d97706" bg="#fffbeb"/>
            <StatCard label="Road Test Pass" value={analytics.roadTestPassRate+'%'} color="#7c3aed" bg="#f5f3ff"/>
          </div>
        )}

        {/* Test Stage Summary */}
        {analytics && (
          <div className="chart-card">
            <div className="cc-title" style={{marginBottom:16}}>Training Stage Pass Rates</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
              {[
                ['Road Test',       analytics.roadTestPassRate],
                ['Post E-Test',     analytics.postEtestPassRate],
                ['OCC',             analytics.occPassRate],
                ['Fire Fighting',   analytics.firePassRate],
                ['Final Assessment',analytics.finalAssessPassRate],
                ['Scenario',        analytics.scenarioPassRate],
              ].map(([label,rate])=>(
                <div key={label} style={{textAlign:'center',padding:'14px 8px',background:'#f8fafc',borderRadius:8,border:'1.5px solid #e2e8f0'}}>
                  <div style={{fontSize:22,fontWeight:800,color:rate>=70?'#059669':rate>=50?'#d97706':'#dc2626'}}>{rate}%</div>
                  <div style={{fontSize:10.5,color:'#64748b',marginTop:4,fontWeight:600}}>{label}</div>
                  <div style={{marginTop:8,height:5,borderRadius:99,background:'#e2e8f0',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,background:rate>=70?'#059669':rate>=50?'#d97706':'#dc2626',width:rate+'%',transition:'width .5s'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company Breakdown */}
        {analytics && (
          <div className="chart-grid c2">
            <div className="chart-card">
              <div className="cc-title" style={{marginBottom:12}}>By Company</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {Object.entries(analytics.byCompany||{}).sort((a,b)=>b[1]-a[1]).map(([company,count])=>(
                  <div key={company}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12.5,fontWeight:600,color:'#334155'}}>{company}</span>
                      <span style={{fontSize:12.5,fontWeight:700,color:'#1d4ed8'}}>{count}</span>
                    </div>
                    <div style={{height:6,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:99,background:'#1d4ed8',width:Math.round(count/analytics.total*100)+'%'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-card">
              <div className="cc-title" style={{marginBottom:12}}>By Status</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {Object.entries(analytics.byStatus||{}).sort((a,b)=>b[1]-a[1]).map(([status,count])=>(
                  <div key={status} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#f8fafc',borderRadius:6}}>
                    <StatusBadge v={status}/>
                    <span style={{fontSize:14,fontWeight:700,color:'#334155'}}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Pre-Service Candidates</div>
            <div className="tt-badge">{total.toLocaleString()} records</div>
            <div className="tt-right">
              <div className="search-wrap">
                <Search size={13}/>
                <input placeholder="Search name, RTA ID, company..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>#</th>
                <th>RTA ID</th>
                <th>Driver Name</th>
                <th>Nationality</th>
                <th>Company</th>
                <th>Batch</th>
                <th>Road Test</th>
                <th>Post E-Test</th>
                <th>OCC</th>
                <th>Fire Fighting</th>
                <th>Final Assess.</th>
                <th>Scenario</th>
                <th>Graduation</th>
                <th>Status</th>
                {isAdmin() && <th></th>}
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                ) : filtered.length===0 ? (
                  <tr><td colSpan={14}>
                    <div className="tbl-empty">
                      <BookOpen size={36} style={{margin:'0 auto 12px',display:'block',color:'#cbd5e1'}}/>
                      <div className="tbl-empty-title">No records found</div>
                      <div className="tbl-empty-sub">Import your Pre-Service CSV file to load candidates</div>
                      {isAdmin() && <button className="btn btn-primary" style={{marginTop:14}} onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>}
                    </div>
                  </td></tr>
                ) : filtered.map((r,i)=>(
                  <tr key={r.id}>
                    <td>{(page-1)*LIMIT+i+1}</td>
                    <td><span style={{fontWeight:600,color:'#0f2044'}}>{r.rta_id||'--'}</span></td>
                    <td style={{fontWeight:500,minWidth:140}}>{r.driver_name||'--'}</td>
                    <td>{r.nationality||'--'}</td>
                    <td>{r.company||'--'}</td>
                    <td>{r.training_batch||'--'}</td>
                    <td><StatusBadge v={r.post_etest_result}/></td>
                    <td><StatusBadge v={r.post_etest_result}/></td>
                    <td><StatusBadge v={r.occ_result}/></td>
                    <td><StatusBadge v={r.fire_fighting}/></td>
                    <td><StatusBadge v={r.final_assessment}/></td>
                    <td><StatusBadge v={r.scenario_result}/></td>
                    <td>{fmt(r.graduation_date)}</td>
                    <td><StatusBadge v={r.status}/></td>
                    {isAdmin() && <td>
                      <button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11,color:'#dc2626'}}
                        onClick={async()=>{if(!confirm('Delete?'))return;await api.deletePreservice(r.id);load(page)}}>
                        Delete
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">Showing {Math.min((page-1)*LIMIT+1,total)} to {Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
            <div className="pager">
              {page>1 && <button onClick={()=>load(page-1)}>&#8249;</button>}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,pages-4))+i;return<button key={p} className={p===page?'active':''} onClick={()=>load(p)}>{p}</button>})}
              {page<pages && <button onClick={()=>load(page+1)}>&#8250;</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}