import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'

export default function LineChartBox({ title, sub, data, dataKey = 'value', nameKey = 'name', height = 220, color = '#2563eb' }) {
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
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#grad-${dataKey})`}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
