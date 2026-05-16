import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'

const COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#0d9488']

export default function BarChartBox({ title, sub, data, dataKey = 'value', nameKey = 'name', height = 260, horiz = false, color }) {
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
        <BarChart
          data={data}
          layout={horiz ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 20, left: horiz ? 80 : 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          {horiz ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false}/>
              <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={75}/>
            </>
          ) : (
            <>
              <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
            </>
          )}
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
            cursor={{ fill: '#f8fafc' }}
          />
          <Bar dataKey={dataKey} radius={[4,4,0,0]} maxBarSize={48}>
            {data.map((_, i) => (
              <Cell key={i} fill={color || COLORS[i % COLORS.length]}/>
            ))}
            <LabelList dataKey={dataKey} position={horiz ? 'right' : 'top'} style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}/>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
