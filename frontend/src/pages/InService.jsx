import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = l === 'present' ? 'tag-green' : l === 'absent' ? 'tag-red' : 'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

export default function InService() {
  const { isAdmin } = useStore()
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters]   = useState({})
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({})
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p = 1, f = filters) {
    setLoading(true)
    try {
      const res = await api.getInservice({ page: p, limit: LIMIT, ...f })
      setRows(res.data); setTotal(res.total); setPage(p)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function applyFilter(k, v) {
    const f = { ...filters, [k]: v || undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); load(1, f)
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Uploading...', { id: 'csv' })
    try {
      const res = await api.uploadCSV('inservice', text)
      toast.success(`Imported ${res.inserted} records`, { id: 'csv' })
      load(1)
    } catch (err) { toast.error(err.message, { id: 'csv' }) }
    e.target.value = ''
  }

  async function saveRecord() {
    if (!form.driver_name) return toast.error('Driver name required')
    try {
      await api.addInservice(form)
      toast.success('Record added')
      setShowAdd(false); setForm({}); load(1)
    } catch (e) { toast.error(e.message) }
  }

  async function deleteRow(id) {
    if (!confirm('Delete this record?')) return
    try { await api.deleteInservice(id); toast.success('Deleted'); load(page) }
    catch (e) { toast.error(e.message) }
  }

  const pages = Math.ceil(total / LIMIT)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{ background:'#eff6ff', color:'#1d4ed8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <div className="dh-title">In-Service Training</div>
            <div className="dh-sub">{total.toLocaleString()} total records</div>
          </div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={() => setSlicerOpen(s => !s)}>Slicers</button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleCSV} />
            <button className="btn btn-ghost" onClick={() => fileRef.current.click()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              Import CSV
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Record</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen ? 'open' : ''}`}>
        <span className="sl-label">Slicers</span>
        {[['Depot','depot',['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat']],
          ['Type','training_type',['Remedial','Awareness','Bus Familiarisation','School Bus Training','Refresher','Route Familiarisation','HSE','Tourism Training']],
          ['Attendance','attendance',['Present','Absent']]
        ].map(([label, key, opts]) => (
          <select key={key} className="sl-select" value={filters[key] || ''} onChange={e => applyFilter(key, e.target.value)}>
            <option value="">All {label}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="sl-dim">From</span>
        <input type="date" className="sl-date" value={filters.from || ''} onChange={e => applyFilter('from', e.target.value)} />
        <span className="sl-dim">To</span>
        <input type="date" className="sl-date" value={filters.to || ''} onChange={e => applyFilter('to', e.target.value)} />
        <button className="sl-reset" onClick={() => { setFilters({}); load(1, {}) }}>Reset</button>
        <button className="sl-close" onClick={() => setSlicerOpen(false)}>âœ•</button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Training Records</div>
            <div className="tt-badge">{total.toLocaleString()} records</div>
            <div className="tt-right">
              <div className="search-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Search..." onChange={e => {
                  const q = e.target.value.toLowerCase()
                  document.querySelectorAll('#is-tb tr').forEach(tr => {
                    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none'
                  })
                }} />
              </div>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>#</th><th>Staff ID</th><th>Driver Name</th><th>Nationality</th>
                <th>Depot</th><th>Date</th><th>Type</th><th>Course</th><th>Trainer</th><th>Attendance</th>
                {isAdmin() && <th></th>}
              </tr></thead>
              <tbody id="is-tb">
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign:'center', padding:40 }}><div className="spinner dark" style={{ margin:'0 auto' }} /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={10}><div className="tbl-empty"><div className="tbl-empty-icon">ðŸšŒ</div><div className="tbl-empty-title">No records found</div><div className="tbl-empty-sub">Import a CSV or add records manually</div></div></td></tr>
                ) : rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>{(page - 1) * LIMIT + i + 1}</td>
                    <td>{r.staff_id || '--'}</td>
                    <td style={{ fontWeight:500 }}>{r.driver_name || '--'}</td>
                    <td>{r.nationality || '--'}</td>
                    <td>{r.depot || '--'}</td>
                    <td>{r.training_date ? new Date(r.training_date).toLocaleDateString('en-GB') : '--'}</td>
                    <td>{r.training_type || '--'}</td>
                    <td>{r.course || '--'}</td>
                    <td>{r.trainer || '--'}</td>
                    <td><Tag v={r.attendance} /></td>
                    {isAdmin() && <td><button className="btn btn-ghost" style={{ padding:'3px 8px', fontSize:11, color:'#dc2626' }} onClick={() => deleteRow(r.id)}>Delete</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">Showing {Math.min((page-1)*LIMIT+1,total)}â€“{Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
            <div className="pager">
              {page > 1 && <button onClick={() => load(page - 1)}>â€¹</button>}
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pages - 4)) + i
                return <button key={p} className={p === page ? 'active' : ''} onClick={() => load(p)}>{p}</button>
              })}
              {page < pages && <button onClick={() => load(page + 1)}>â€º</button>}
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal-box">
            <div className="modal-header"><div className="modal-title">Add Training Record</div><button className="modal-close" onClick={() => setShowAdd(false)}>âœ•</button></div>
            <div className="modal-body">
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Staff ID</label><input className="form-input" onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Driver Name *</label><input className="form-input" onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Depot</label>
                  <select className="form-select" onChange={e => setForm(f => ({ ...f, depot: e.target.value }))}>
                    <option value="">Select depot</option>
                    {['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Training Date</label><input className="form-input" type="date" onChange={e => setForm(f => ({ ...f, training_date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Training Type</label>
                  <select className="form-select" onChange={e => setForm(f => ({ ...f, training_type: e.target.value }))}>
                    <option value="">Select type</option>
                    {['Remedial','Awareness','Bus Familiarisation','School Bus Training','Refresher','Route Familiarisation','HSE','Tourism Training'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row c2">
                <div className="form-group"><label className="form-label">Course</label><input className="form-input" onChange={e => setForm(f => ({ ...f, course: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Trainer</label><input className="form-input" onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Attendance</label>
                  <select className="form-select" onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))}>
                    <option value="">Select</option><option>Present</option><option>Absent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRecord}>Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
