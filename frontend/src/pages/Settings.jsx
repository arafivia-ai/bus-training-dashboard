import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, UserPlus, Trash2 } from 'lucide-react'

export default function Settings() {
  const { user, isAdmin } = useStore()
  const [tab, setTab]     = useState('general')
  const [users, setUsers] = useState([])
  const [form, setForm]   = useState({ username:'', email:'', password:'', role:'Management' })

  useEffect(() => {
    if (isAdmin()) api.getUsers().then(setUsers).catch(()=>{})
  }, [])

  async function addUser() {
    if (!form.username || !form.password) return toast.error('Username and password required')
    if (form.password.length < 6) return toast.error('Password min 6 characters')
    try {
      const u = await api.addUser(form)
      setUsers(prev=>[...prev,u])
      setForm({username:'',email:'',password:'',role:'Management'})
      toast.success('User added')
    } catch(e) { toast.error(e.message) }
  }

  async function removeUser(id, name) {
    if (!confirm(`Remove user "${name}"?`)) return
    try { await api.deleteUser(id); setUsers(prev=>prev.filter(u=>u.id!==id)); toast.success('User removed') }
    catch(e) { toast.error(e.message) }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#f1f5f9',color:'#475569'}}><SettingsIcon size={20}/></div>
          <div><div className="dh-title">Settings</div><div className="dh-sub">Manage users and preferences</div></div>
        </div>
      </div>
      <div className="page-body">
        <div style={{background:'#fff',borderRadius:12,border:'1.5px solid #e2e8f0',overflow:'hidden'}}>
          <div className="stabs" style={{padding:'0 22px'}}>
            {['general','users'].map(t=>(
              <button key={t} className={`stab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{padding:22}}>
            {tab==='general'&&(
              <div>
                <div className="form-row c2">
                  <div className="form-group"><label className="form-label">Dashboard Name</label><input className="form-input" defaultValue="Bus Training Dashboard"/></div>
                  <div className="form-group"><label className="form-label">Organisation</label><input className="form-input" defaultValue="Roads & Transport Authority"/></div>
                </div>
                <div className="form-row c2">
                  <div className="form-group"><label className="form-label">Logged in as</label><input className="form-input" value={user?.username||''} readOnly style={{background:'#f8fafc'}}/></div>
                  <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={user?.role||''} readOnly style={{background:'#f8fafc'}}/></div>
                </div>
              </div>
            )}
            {tab==='users'&&(
              <div>
                <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#1e3a8a'}}>
                  <strong>Roles:</strong> Administrator = full access including import/export. Management = view only.
                </div>
                {isAdmin()&&(
                  <div style={{background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',padding:18,marginBottom:20}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0f2044',marginBottom:14,display:'flex',alignItems:'center',gap:8}}><UserPlus size={16}/> Add New User</div>
                    <div className="form-row c2">
                      <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="username"/></div>
                      <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@domain.com"/></div>
                    </div>
                    <div className="form-row c2" style={{marginBottom:0}}>
                      <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters"/></div>
                      <div className="form-group"><label className="form-label">Role</label>
                        <select className="form-select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                          <option>Administrator</option><option>Management</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{marginTop:14}} onClick={addUser}><UserPlus size={14}/> Add User</button>
                  </div>
                )}
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:.6,color:'#94a3b8',marginBottom:10}}>Active Users</div>
                {users.map(u=>(
                  <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
                    <div className="avatar">{u.username?.[0]?.toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{u.username}</div>
                      <div style={{fontSize:11.5,color:'#64748b'}}>{u.email||'—'}</div>
                    </div>
                    <span style={{padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:600,background:u.role==='Administrator'?'#eff6ff':'#f1f5f9',color:u.role==='Administrator'?'#1d4ed8':'#475569'}}>{u.role}</span>
                    {isAdmin()&&u.username!=='admin'&&(
                      <button className="btn btn-ghost" style={{padding:'5px 10px',fontSize:12,color:'#dc2626',borderColor:'#fca5a5'}} onClick={()=>removeUser(u.id,u.username)}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}