import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#0d9488','#f59e0b','#6366f1']

export default function DonutChartBox({ title, sub, data, height = 260 }) {
  if (!data?.length) return (
    <div className="card p-5">
      <div className="text-sm font-600 text-slate-700 mb-1">{title}</div>
      {sub && <div className="text-xs text-slate-400 mb-4">{sub}</div>}
      <div className="flex items-center justify-center h-40 text-slate-300 text-sm">No data available</div>
    </div>
  )

  const total = data.reduce((a, b) => a + b.value, 0)

  return (
    <div className="card p-5">
      <div className="text-sm font-600 text-slate-700 mb-1">{title}</div>
      {sub && <div className="text-xs text-slate-400 mb-3">{sub}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="55%"
            outerRadius="75%"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
          </Pie>
          <Tooltip
            formatter={(value) => [value.toLocaleString(), '']}
            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}