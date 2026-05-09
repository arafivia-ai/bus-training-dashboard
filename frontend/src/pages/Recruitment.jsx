import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = (l==='on board'||l==='pass') ? 'tag-green' : (l==='not shortlisted'||l==='fail'||l==='security rejected') ? 'tag-red' : (l==='shortlisted'||l==='pipeline') ? 'tag-blue' : 'tag-gray'
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
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({})
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1, f=filters) {
    setLoading(true)
    try {
      const res = await api.getRecruitment({ page:p, limit:LIMIT, ...f })
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function applyFilter(k,v) {
    const f = {...filters,[k]:v||undefined}
    Object.keys(f).forEach(k=>!f[k]&&delete f[k])
    setFilters(f); load(1,f)
  }

  async function handleCSV(e) {
    const file=e.target.files[0]; if(!file) return
    const text=await file.text()
    toast.loading('Uploading...', {id:'csv'})
    try {
      const res=await api.uploadCSV('recruitment',text)
      toast.success(`Imported ${res.inserted} candidates`, {id:'csv'})
      load(1)
    } catch(err) { toast.error(err.message, {id:'csv'}) }
    e.target.value=''
  }

  async function saveRecord() {
    if(!form.full_name) return toast.error('Name required')
    try { await api.addRecruitment(form); toast.success('Added'); setShowAdd(false); setForm({}); load(1) }
    catch(e) { toast.error(e.message) }
  }

  const pages = Math.ceil(total/LIMIT)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#fffbeb',color:'#d97706'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <div><div className="dh-title">Recruitment Pipeline</div><div className="dh-sub">{total.toLocaleString()} candidates</div></div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}>Slicers</button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}>Import CSV</button>
            <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Candidate</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="sl-label">Slicers</span>
        {[['Status','status',['On Board','Not Shortlisted','Shortlisted','Not Interested','Security Rejected','Pipeline']],
          ['Company','company',['Reach','Omnix','Expert Plus','Okool PB','Ultimate1','Ultimate2']]
        ].map(([label,key,opts])=>(
          <select key={key} className="sl-select" value={filters[key]||''} onChange={e=>applyFilter(key,e.target.value)}>
            <option value="">All {label}</option>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <select className="sl-select" value={filters.road_test||''} onChange={e=>applyFilter('road_test',e.target.value)}>
          <option value="">All Road Test</option><option value="pass">Pass</option><option value="fail">Fail</option>
        </select>
        <button className="sl-reset" onClick={()=>{setFilters({});load(1,{})}}>Reset</button>
        <button className="sl-close" onClick={()=>setSlicerOpen(false)}>âœ•</button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Candidates</div>
            <div className="tt-badge">{total.toLocaleString()}</div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Nationality</th><th>Company</th><th>Road Test</th><th>Interview</th><th>Status</th>{isAdmin()&&<th></th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                : rows.length===0 ? <tr><td colSpan={7}><div className="tbl-empty"><div className="tbl-empty-icon">ðŸ‘¥</div><div className="tbl-empty-title">No candidates</div><div className="tbl-empty-sub">Import CSV or add manually</div></div></td></tr>
                : rows.map((r,i)=>(
                  <tr key={r.id}>
                    <td>{(page-1)*LIMIT+i+1}</td>
                    <td style={{fontWeight:500}}>{r.full_name||'--'}</td>
                    <td>{r.nationality||'--'}</td>
                    <td>{r.company||'--'}</td>
                    <td><Tag v={r.road_test_result}/></td>
                    <td><Tag v={r.interview_result}/></td>
                    <td><Tag v={r.status}/></td>
                    {isAdmin()&&<td><button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11,color:'#dc2626'}} onClick={async()=>{if(!confirm('Delete?'))return;await api.deleteRecruitment(r.id);load(page)}}>Delete</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">Showing {Math.min((page-1)*LIMIT+1,total)}â€“{Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
            <div className="pager">
              {page>1&&<button onClick={()=>load(page-1)}>â€¹</button>}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,pages-4))+i;return<button key={p} className={p===page?'active':''} onClick={()=>load(p)}>{p}</button>})}
              {page<pages&&<button onClick={()=>load(page+1)}>â€º</button>}
            </div>
          </div>
        </div>
      </div>

      {showAdd&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal-box">
            <div className="modal-header"><div className="modal-title">Add Candidate</div><button className="modal-close" onClick={()=>setShowAdd(false)}>âœ•</button></div>
            <div className="modal-body">
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" onChange={e=>setForm(f=>({...f,nationality:e.target.value}))}/></div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Company</label><input className="form-input" onChange={e=>setForm(f=>({...f,company:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option value="">Select</option>
                    {['On Board','Shortlisted','Not Shortlisted','Pipeline','Security Rejected'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Road Test Date</label><input className="form-input" type="date" onChange={e=>setForm(f=>({...f,road_test_date:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Road Test Result</label>
                  <select className="form-select" onChange={e=>setForm(f=>({...f,road_test_result:e.target.value}))}>
                    <option value="">Select</option><option>Pass</option><option>Fail</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRecord}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
