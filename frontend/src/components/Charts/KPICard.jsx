import React from 'react'

export default function KPICard({ label, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { bg: 'bg-primary-50',  icon: 'bg-primary-100 text-primary-600',  val: 'text-primary-700',  border: 'border-primary-200' },
    green:  { bg: 'bg-emerald-50',  icon: 'bg-emerald-100 text-emerald-600',  val: 'text-emerald-700',  border: 'border-emerald-200' },
    amber:  { bg: 'bg-amber-50',    icon: 'bg-amber-100 text-amber-600',      val: 'text-amber-700',    border: 'border-amber-200' },
    red:    { bg: 'bg-red-50',      icon: 'bg-red-100 text-red-600',          val: 'text-red-700',      border: 'border-red-200' },
    purple: { bg: 'bg-purple-50',   icon: 'bg-purple-100 text-purple-600',    val: 'text-purple-700',   border: 'border-purple-200' },
    teal:   { bg: 'bg-teal-50',     icon: 'bg-teal-100 text-teal-600',        val: 'text-teal-700',     border: 'border-teal-200' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 flex items-start gap-4`}>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20}/>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</div>
        <div className={`text-2xl font-extrabold ${c.val} leading-none`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        {trend !== undefined && (
          <div className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? 'â†‘' : 'â†“'} {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
    </div>
  )
}
