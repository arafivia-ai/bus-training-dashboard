import React, { useEffect, useState } from 'react'
import { api } from '../api'
import ChartBox from '../components/ChartBox'
import toast from 'react-hot-toast'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalytics()
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { toast.error(e.message); setLoading(false) })
  }, [])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:60}}><div className="spinner dark" style={{width:32,height:32}}/></div>
  if (!data) return <div style={{padding:40,color:'#64748b'}}>Failed to load analytics.</div>

  const { inservice:is, preservice:ps, recruitment:rec, schoolDrivers:sbd, schoolSupervisors:sbs } = data

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#f5f3ff',color:'#7c3aed'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div><div className="dh-title">Analytics & Reports</div><div className="dh-sub">Live data from all modules</div></div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>window.print()}>Print Report</button>
          <button className="btn btn-ghost" onClick={()=>api.getAnalytics().then(setData).catch(()=>{})}>Refresh</button>
        </div>
      </div>
      <div className="page-body">
        <div className="kpi-grid c5">
          {[
            ['In-Service', is?.total, '#1d4ed8','#eff6ff'],
            ['Pre-Service', ps?.total, '#059669','#f0fdf4'],
            ['Recruitment', rec?.total, '#d97706','#fffbeb'],
            ['SB Drivers', sbd?.total, '#7c3aed','#f5f3ff'],
            ['SB Supervisors', sbs?.total, '#0891b2','#ecfeff'],
          ].map(([l,v,c,bg]) => (
            <div key={l} className="kpi" style={{'--kc':c,'--kc-bg':bg}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">{l}</div>
              <div className="kpi-value">{Number(v||0).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#94a3b8'}}>Public Bus — In-Service</div>
        <div className="chart-grid c2">
          <ChartBox type="bar"      labels={Object.keys(is?.byDepot||{})}      data={Object.values(is?.byDepot||{})}      title="By Depot"         height={240}/>
          <ChartBox type="doughnut" labels={Object.keys(is?.byType||{})}       data={Object.values(is?.byType||{})}       title="By Training Type" height={240}/>
        </div>
        <div className="chart-grid c2">
          <ChartBox type="doughnut" labels={Object.keys(is?.byAttendance||{})} data={Object.values(is?.byAttendance||{})} title="Attendance Split"  height={220}/>
          <ChartBox type="line"     labels={Object.keys(is?.trend||{})}        data={Object.values(is?.trend||{})}        title="Monthly Trend"     height={220}/>
        </div>
        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#94a3b8'}}>Public Bus — Pre-Service</div>
        <div className="chart-grid c2">
          <ChartBox type="bar"      labels={Object.keys(ps?.byDepot||{})} data={Object.values(ps?.byDepot||{})} title="By Depot" height={220}/>
          <ChartBox type="doughnut" labels={Object.keys(ps?.byType||{})}  data={Object.values(ps?.byType||{})}  title="By Type"  height={220}/>
        </div>
        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#94a3b8'}}>Recruitment</div>
        <div className="chart-grid c3">
          <ChartBox type="doughnut" labels={Object.keys(rec?.byStatus||{})}  data={Object.values(rec?.byStatus||{})}  title="Status"      height={220}/>
          <ChartBox type="bar"      labels={Object.keys(rec?.byCompany||{})} data={Object.values(rec?.byCompany||{})} title="By Company"  height={220}/>
          <ChartBox type="doughnut" labels={Object.keys(rec?.byRoadTest||{})} data={Object.values(rec?.byRoadTest||{})} title="Road Test" height={220}/>
        </div>
        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#94a3b8'}}>School Bus</div>
        <div className="chart-grid c2">
          <ChartBox type="bar" labels={Object.keys(sbd?.bySchool||{})} data={Object.values(sbd?.bySchool||{})} title="SB Drivers by School"     height={220}/>
          <ChartBox type="bar" labels={Object.keys(sbs?.bySchool||{})} data={Object.values(sbs?.bySchool||{})} title="SB Supervisors by School" height={220}/>
        </div>
      </div>
    </div>
  )
}