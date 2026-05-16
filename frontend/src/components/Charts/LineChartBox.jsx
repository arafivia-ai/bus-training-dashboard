import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEAR_COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2']

export default function LineChartBox({ title, sub, data, height = 260, multiYear = false, yearData }) {
  // multiYear mode: yearData = { '2023': { Jan: 10, Feb: 20 }, '2024': { Jan: 15 } }
  if (multiYear && yearData) {
    const years = Object.keys(yearData).sort()
    const chartData = MONTHS.map(month => {
      const row = { month }
      years.forEach(year => { row[year] = yearData[year]?.[month] || 0 })
      return row
    })

    return (
      <div className="card p-5">
        <div className="text-sm font-semibold text-slate-700 mb-1">{title}</div>
        {sub && <div className="text-xs text-slate-400 mb-4">{sub}</div>}
        {!years.length ? (
          <div className="flex items-center justify-center h-40 text-slate-300 text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top:5, right:20, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{ borderRadius:'10px', border:'1px solid #e2e8f0', fontSize:12 }}
                formatter={(value, name) => [value.toLocaleString(), name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={v => <span style={{ fontSize:11, color:'#64748b' }}>{v}</span>}
              />
              {years.map((year, i) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={year}
                  stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r:3, fill: YEAR_COLORS[i % YEAR_COLORS.length] }}
                  activeDot={{ r:5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    )
  }

  // Single line mode
  if (!data?.length) return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-slate-700 mb-1">{title}</div>
      {sub && <div className="text-xs text-slate-400 mb-4">{sub}</div>}
      <div className="flex items-center justify-center h-40 text-slate-300 text-sm">No data available</div>
    </div>
  )

  return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-slate-700 mb-1">{title}</div>
      {sub && <div className="text-xs text-slate-400 mb-4">{sub}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top:5, right:20, left:0, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{ borderRadius:'10px', border:'1px solid #e2e8f0', fontSize:12 }}/>
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5}
            dot={{ r:3, fill:'#2563eb' }} activeDot={{ r:5 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}