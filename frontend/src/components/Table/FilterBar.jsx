import React, { useState } from 'react'
import { Search, SlidersHorizontal, X, Check } from 'lucide-react'

export default function FilterBar({
  filters = {},
  filterOpts = [],
  onFilter,
  onReset,
  search,
  onSearch,
  showSearch = true,
  showDates = true,
}) {
  const [visible, setVisible] = useState(true)
  const [pending, setPending] = useState({ ...filters })
  const activeCount = Object.keys(filters).filter(k => filters[k]).length

  function handleChange(k, v) {
    const updated = { ...pending, [k]: v || undefined }
    Object.keys(updated).forEach(k => !updated[k] && delete updated[k])
    setPending(updated)
    // Live filter
    onFilter(k, v)
  }

  function handleApply() {
    Object.entries(pending).forEach(([k, v]) => onFilter(k, v))
  }

  function handleReset() {
    setPending({})
    onReset()
  }

  if (!visible) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setVisible(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
        >
          <SlidersHorizontal size={13}/>
          Show Filters
          {activeCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
            <X size={11}/> Clear all
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Top row — toggle + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setVisible(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-200 bg-primary-50 text-sm text-primary-600 font-medium hover:bg-primary-100 transition-all"
        >
          <SlidersHorizontal size={13}/>
          Hide Filters
          {activeCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {showSearch && (
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              className="input pl-9 h-9 text-sm"
              placeholder="Search..."
              value={search || ''}
              onChange={e => onSearch && onSearch(e.target.value)}
            />
          </div>
        )}

        {activeCount > 0 && (
          <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 ml-auto">
            <X size={11}/> Clear all
          </button>
        )}
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOpts.map(({ key, label, options }) => {
          const isActive = !!filters[key]
          return (
            <div key={key} className="relative">
              <select
                className={`
                  h-8 pl-3 pr-7 rounded-full text-xs font-medium border cursor-pointer outline-none transition-all appearance-none
                  ${isActive
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400 hover:text-primary-600'
                  }
                `}
                value={filters[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
              >
                <option value="">{label}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {/* Custom arrow */}
              <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isActive ? 'text-white' : 'text-slate-400'}`}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )
        })}

        {/* Date pickers */}
        {showDates && (
          <>
            <input
              type="date"
              className={`h-8 px-3 rounded-full text-xs border cursor-pointer outline-none transition-all
                ${filters.from
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400'
                }
              `}
              value={filters.from || ''}
              onChange={e => handleChange('from', e.target.value)}
            />
            <span className="text-slate-300 text-xs">→</span>
            <input
              type="date"
              className={`h-8 px-3 rounded-full text-xs border cursor-pointer outline-none transition-all
                ${filters.to
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400'
                }
              `}
              value={filters.to || ''}
              onChange={e => handleChange('to', e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  )
}