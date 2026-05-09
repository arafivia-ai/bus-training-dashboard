import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Filter, Upload, Plus, Search, BookOpen, X } from 'lucide-react'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const cls = v.toLowerCase()==='present'?'tag-green':v.toLowerCase()==='absent'?'tag-red':'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

export default function PreService() {
  const { isAdmin } = useStore()
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({})
  const [search, setSearch]   = useState('')
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1,f=filters) {
    setLoading(true)
    try { const res=await api.getPreservice({page:p,limit:LIMIT,...f}); setRows(res.data); setTotal(res.total); setPage(p) }
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
    try { const res=await api.uploadCSV('preservice',text); toast.success(`Imported ${res.inserted}`, {id:'csv'}); load(1) }
    catch(err) { toast.error(err.message, {id:'csv'}) }
    e.target.value=''
  }

  const filtered = search?rows.filter(r=>(r.driver_name||'').toLowerCase().includes(search.toLowerCase())):rows
  const pages = Math.ceil(total/LIMIT)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#f0fdf4',color:'#059669'}}><BookOpen size={20}/></div>
          <div><div className="dh-title">Pre-Service Training</div><div className="dh-sub">{total.toLocaleString()} total records</div></div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}><Filter size={14}/> Slicers</button>
          {isAdmin()&&<>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}><Upload size={14}/> Import CSV</button>
            <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus size={14}/> Add Record</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="sl-label">Slicers</span>
        {[['Depot','depot',['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat']],
          ['Type','training_type',['Bus Familiarisation','Route Familiarisation','Tourism Training']]
        ].map(([label,key,opts])=>(
          <select key={key} className="sl-select" value={filters[key]||''} onChange={e=>applyFilter(key,e.target.value)}>
            <option value="">All {label}</option>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="sl-dim">From</span>
        <input type="date" className="sl-date" value={filters.from||''} onChange={e=>applyFilter('from',e.target.value)}/>
        <span className="sl-dim">To</span>
        <input type="date" className="sl-date" value={filters.to||''} onChange={e=>applyFilter('to',e.target.value)}/>
        <button className="sl-reset" onClick={()=>{setFilters({});load(1,{})}}>Reset</button>
        <button className="sl-close" onClick={()=>setSlicerOpen(false)}><X size={14}/></button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Pre-Service Records</div>
            <div className="tt-badge">{total.toLocaleString()} records</div>
            <div className="tt-right">
              <div className="search-wrap"><Search size={13}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Staff ID</th><th>Driver Name</th><th>Nationality</th><th>Depot</th><th>Date</th><th>Type</th><th>Course</th><th>Attendance</th>{isAdmin()&&<th></th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                : filtered.length===0 ? <tr><td colSpan={9}><div className="tbl-empty"><BookOpen size={36} style={{margin:'0 auto 12px',display:'block',color:'#cbd5e1'}}/><div className="tbl-empty-title">No records found</div><div className="tbl-empty-sub">Import a CSV or add records manually</div></div></td></tr>
                : filtered.map((r,i)=>(
                  <tr key={r.id}>
                    <td>{(page-1)*LIMIT+i+1}</td>
                    <td>{r.staff_id||'--'}</td>
                    <td style={{fontWeight:500}}>{r.driver_name||'--'}</td>
                    <td>{r.nationality||'--'}</td>
                    <td>{r.depot||'--'}</td>
                    <td>{r.training_date?new Date(r.training_date).toLocaleDateString('en-GB'):'--'}</td>
                    <td>{r.training_type||'--'}</td>
                    <td>{r.course||'--'}</td>
                    <td><Tag v={r.attendance}/></td>
                    {isAdmin()&&<td><button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11,color:'#dc2626'}} onClick={async()=>{if(!confirm('Delete?'))return;await api.deletePreservice(r.id);load(page)}}>Delete</button></td>}
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

      {showAdd&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal-box">
            <div className="modal-header"><div className="modal-title">Add Pre-Service Record</div><button className="modal-close" onClick={()=>setShowAdd(false)}><X size={18}/></button></div>
            <div className="modal-body">
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Staff ID</label><input className="form-input" onChange={e=>setForm(f=>({...f,staff_id:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Driver Name *</label><input className="form-input" onChange={e=>setForm(f=>({...f,driver_name:e.target.value}))}/></div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" onChange={e=>setForm(f=>({...f,nationality:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Depot</label>
                  <select className="form-select" onChange={e=>setForm(f=>({...f,depot:e.target.value}))}>
                    <option value="">Select</option>
                    {['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat'].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" onChange={e=>setForm(f=>({...f,training_date:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-select" onChange={e=>setForm(f=>({...f,training_type:e.target.value}))}>
                    <option value="">Select</option>
                    {['Bus Familiarisation','Route Familiarisation','Tourism Training'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Course</label><input className="form-input" onChange={e=>setForm(f=>({...f,course:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Attendance</label>
                  <select className="form-select" onChange={e=>setForm(f=>({...f,attendance:e.target.value}))}>
                    <option value="">Select</option><option>Present</option><option>Absent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async()=>{if(!form.driver_name)return toast.error('Name required');await api.addPreservice(form);toast.success('Added');setShowAdd(false);setForm({});load(1)}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}