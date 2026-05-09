import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Filter, Upload, Search, UserCheck, X } from 'lucide-react'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = (l==='on board'||l==='pass'||l.includes('pass'))?'tag-green'
    :(l==='not shortlisted'||l==='fail'||l.includes('fail')||l==='security rejected')?'tag-red'
    :(l==='shortlisted'||l==='pipeline'||l==='upcoming interview')?'tag-blue':'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

export default function Recruitment() {
  const { isAdmin } = useStore()
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [search, setSearch]   = useState('')
  const [analytics, setAnalytics] = useState(null)
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1,f=filters) {
    setLoading(true)
    try {
      const res = await api.getRecruitment({page:p,limit:LIMIT,...f})
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(()=>{
    load()
    api.getAnalytics().then(d=>setAnalytics(d?.recruitment)).catch(()=>{})
  },[])

  function applyFilter(k,v) {
    const f={...filters,[k]:v||undefined}
    Object.keys(f).forEach(k=>!f[k]&&delete f[k])
    setFilters(f); load(1,f)
  }

  async function handleCSV(e) {
    const file=e.target.files[0]; if(!file) return
    const text=await file.text()
    toast.loading('Uploading Recruitment CSV...', {id:'csv'})
    try {
      const res=await api.uploadCSV('recruitment',text)
      toast.success(`Imported ${res.inserted} candidates (${res.skipped} skipped)`, {id:'csv'})
      load(1)
      api.getAnalytics().then(d=>setAnalytics(d?.recruitment)).catch(()=>{})
    } catch(err) { toast.error(err.message, {id:'csv'}) }
    e.target.value=''
  }

  const filtered = search
    ? rows.filter(r=>(r.full_name||'').toLowerCase().includes(search.toLowerCase())||(r.rta_id||'').includes(search))
    : rows

  const pages = Math.ceil(total/LIMIT)
  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '--'

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#fffbeb',color:'#d97706'}}><UserCheck size={20}/></div>
          <div>
            <div className="dh-title">Recruitment Pipeline</div>
            <div className="dh-sub">{total.toLocaleString()} candidates tracked</div>
          </div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}><Filter size={14}/> Slicers</button>
          {isAdmin()&&<>
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
          {['On Board','Not Shortlisted','Shortlisted','Not Interested','Security Rejected','Pipeline','Upcoming Interview','Disqualified'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="sl-select" value={filters.road_test||''} onChange={e=>applyFilter('road_test',e.target.value)}>
          <option value="">All Road Test</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
        <select className="sl-select" value={filters.nationality||''} onChange={e=>applyFilter('nationality',e.target.value)}>
          <option value="">All Nationalities</option>
          {['Pakistan','India','Nepal','Egypt','Sudan','Bangladesh','Ghana'].map(n=><option key={n}>{n}</option>)}
        </select>
        <button className="sl-reset" onClick={()=>{setFilters({});load(1,{})}}>Reset</button>
        <button className="sl-close" onClick={()=>setSlicerOpen(false)}><X size={14}/></button>
      </div>

      <div className="page-body">
        {/* KPI Cards */}
        {analytics && (
          <div className="kpi-grid c4">
            <div className="kpi" style={{'--kc':'#059669','--kc-bg':'#f0fdf4'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Total Candidates</div>
              <div className="kpi-value">{(analytics.total||0).toLocaleString()}</div>
            </div>
            <div className="kpi" style={{'--kc':'#1d4ed8','--kc-bg':'#eff6ff'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">On Board</div>
              <div className="kpi-value">{(analytics.byStatus?.['On Board']||0).toLocaleString()}</div>
            </div>
            <div className="kpi" style={{'--kc':'#d97706','--kc-bg':'#fffbeb'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Shortlisted</div>
              <div className="kpi-value">{(analytics.byStatus?.['Shortlisted']||0).toLocaleString()}</div>
            </div>
            <div className="kpi" style={{'--kc':'#dc2626','--kc-bg':'#fef2f2'}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">Not Shortlisted</div>
              <div className="kpi-value">{(analytics.byStatus?.['Not Shortlisted']||0).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Company & Status breakdown */}
        {analytics && (
          <div className="chart-grid c2">
            <div className="chart-card">
              <div className="cc-title" style={{marginBottom:12}}>By Company</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {Object.entries(analytics.byCompany||{}).sort((a,b)=>b[1]-a[1]).map(([company,count])=>(
                  <div key={company}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12.5,fontWeight:600,color:'#334155'}}>{company}</span>
                      <span style={{fontSize:12.5,fontWeight:700,color:'#d97706'}}>{count}</span>
                    </div>
                    <div style={{height:6,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:99,background:'#d97706',width:analytics.total?Math.round(count/analytics.total*100)+'%':'0%'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-card">
              <div className="cc-title" style={{marginBottom:12}}>Pipeline Status</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {Object.entries(analytics.byStatus||{}).sort((a,b)=>b[1]-a[1]).map(([status,count])=>(
                  <div key={status} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 12px',background:'#f8fafc',borderRadius:6}}>
                    <Tag v={status}/>
                    <span style={{fontSize:14,fontWeight:700,color:'#334155'}}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Candidate Records</div>
            <div className="tt-badge">{total.toLocaleString()}</div>
            <div className="tt-right">
              <div className="search-wrap"><Search size={13}/><input placeholder="Search name or RTA ID..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>#</th><th>RTA ID</th><th>Name</th><th>Nationality</th>
                <th>Company</th><th>License Class</th><th>Road Test</th>
                <th>Interview</th><th>Batch</th><th>Graduation</th><th>Status</th>
                {isAdmin()&&<th></th>}
              </tr></thead>
              <tbody>
                {loading?<tr><td colSpan={11} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                :filtered.length===0?<tr><td colSpan={11}><div className="tbl-empty"><UserCheck size={36} style={{margin:'0 auto 12px',display:'block',color:'#cbd5e1'}}/><div className="tbl-empty-title">No candidates</div><div className="tbl-empty-sub">Import your Recruitment CSV to load records</div>{isAdmin()&&<button className="btn btn-primary" style={{marginTop:14}} onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>}</div></td></tr>
                :filtered.map((r,i)=>(
                  <tr key={r.id}>
                    <td>{(page-1)*LIMIT+i+1}</td>
                    <td><span style={{fontWeight:600,color:'#0f2044'}}>{r.rta_id||'--'}</span></td>
                    <td style={{fontWeight:500,minWidth:130}}>{r.full_name||'--'}</td>
                    <td>{r.nationality||'--'}</td>
                    <td>{r.company||'--'}</td>
                    <td>{r.license_class||'--'}</td>
                    <td><Tag v={r.road_test_result}/></td>
                    <td><Tag v={r.interview_result}/></td>
                    <td>{r.training_batch||'--'}</td>
                    <td>{fmt(r.graduation_date)}</td>
                    <td><Tag v={r.status}/></td>
                    {isAdmin()&&<td><button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11,color:'#dc2626'}} onClick={async()=>{if(!confirm('Delete?'))return;await api.deleteRecruitment(r.id);load(page)}}>Delete</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">Showing {Math.min((page-1)*LIMIT+1,total)} to {Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
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