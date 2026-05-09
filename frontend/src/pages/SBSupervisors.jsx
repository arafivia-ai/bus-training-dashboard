import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const cls = v.toLowerCase()==='present'?'tag-green':v.toLowerCase()==='absent'?'tag-red':'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

export default function SBSupervisors() {
  const { isAdmin } = useStore()
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1,f=filters) {
    setLoading(true)
    try { const res=await api.getSBSupervisors({page:p,limit:LIMIT,...f}); setRows(res.data); setTotal(res.total); setPage(p) }
    catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(()=>{load()},[])

  function applyFilter(k,v) {
    const f={...filters,[k]:v||undefined}
    Object.keys(f).forEach(k=>!f[k]&&delete f[k])
    setFilters(f); load(1,f)
  }

  async function handleCSV(e) {
    const file=e.target.files[0]; if(!file) return
    const text=await file.text()
    toast.loading('Uploading...', {id:'csv'})
    try { const res=await api.uploadCSV('sbsupervisors',text); toast.success(`Imported ${res.inserted}`, {id:'csv'}); load(1) }
    catch(err) { toast.error(err.message, {id:'csv'}) }
    e.target.value=''
  }

  const pages=Math.ceil(total/LIMIT)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#ecfeff',color:'#0891b2'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div><div className="dh-title">School Bus Supervisor Training</div><div className="dh-sub">{total.toLocaleString()} records</div></div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}>Slicers</button>
          {isAdmin()&&<>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}>Import CSV</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="sl-label">Slicers</span>
        <select className="sl-select" value={filters.attendance||''} onChange={e=>applyFilter('attendance',e.target.value)}>
          <option value="">All Attendance</option><option>Present</option><option>Absent</option>
        </select>
        <span className="sl-dim">From</span>
        <input type="date" className="sl-date" value={filters.from||''} onChange={e=>applyFilter('from',e.target.value)}/>
        <span className="sl-dim">To</span>
        <input type="date" className="sl-date" value={filters.to||''} onChange={e=>applyFilter('to',e.target.value)}/>
        <button className="sl-reset" onClick={()=>{setFilters({});load(1,{})}}>Reset</button>
        <button className="sl-close" onClick={()=>setSlicerOpen(false)}>âœ•</button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Supervisor Records</div>
            <div className="tt-badge">{total.toLocaleString()}</div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Staff ID</th><th>Supervisor Name</th><th>Nationality</th><th>School</th><th>Date</th><th>Type</th><th>Course</th><th>Attendance</th>{isAdmin()&&<th></th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                : rows.length===0 ? <tr><td colSpan={9}><div className="tbl-empty"><div className="tbl-empty-icon">ðŸ‘®</div><div className="tbl-empty-title">No records</div><div className="tbl-empty-sub">Import CSV to load supervisor records</div></div></td></tr>
                : rows.map((r,i)=>(
                  <tr key={r.id}>
                    <td>{(page-1)*LIMIT+i+1}</td>
                    <td>{r.staff_id||'--'}</td>
                    <td style={{fontWeight:500}}>{r.supervisor_name||'--'}</td>
                    <td>{r.nationality||'--'}</td>
                    <td>{r.school||'--'}</td>
                    <td>{r.training_date?new Date(r.training_date).toLocaleDateString('en-GB'):'--'}</td>
                    <td>{r.training_type||'--'}</td>
                    <td>{r.course||'--'}</td>
                    <td><Tag v={r.attendance}/></td>
                    {isAdmin()&&<td><button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11,color:'#dc2626'}} onClick={async()=>{if(!confirm('Delete?'))return;await api.deleteSBSupervisor(r.id);load(page)}}>Delete</button></td>}
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
    </div>
  )
}
