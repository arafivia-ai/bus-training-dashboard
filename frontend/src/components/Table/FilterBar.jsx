import React from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

export default function FilterBar({ filters, filterOpts, onFilter, onReset, search, onSearch }) {
  const activeCount = Object.keys(filters).filter(k => filters[k]).length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input
          className="input pl-9 pr-4 h-9 text-sm"
          placeholder="Search..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      {/* Filter selects */}
      {filterOpts?.map(({ key, label, options }) => (
        <select
          key={key}
          className="select h-9 text-sm min-w-32"
          value={filters[key] || ''}
          onChange={e => onFilter(key, e.target.value)}
        >
          <option value="">All {label}</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ))}

      {/* Date range */}
      {filterOpts?.some(f => f.key === 'from') && (
        <>
          <input type="date" className="input h-9 text-sm w-36" value={filters.from || ''} onChange={e => onFilter('from', e.target.value)}/>
          <input type="date" className="input h-9 text-sm w-36" value={filters.to || ''} onChange={e => onFilter('to', e.target.value)}/>
        </>
      )}

      {/* Reset */}
      {activeCount > 0 && (
        <button onClick={onReset} className="btn-ghost h-9 text-sm text-red-500 border-red-200 hover:bg-red-50">
          <X size={14}/> Clear ({activeCount})
        </button>
      )}
    </div>
  )
}