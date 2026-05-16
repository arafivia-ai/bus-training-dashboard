import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, rows, loading, page, total, limit, onPage, emptyIcon, emptyText }) {
  const pages = Math.ceil(total / limit)
  const from = Math.min((page-1)*limit+1, total)
  const to   = Math.min(page*limit, total)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
    </div>
  )

  if (!rows?.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="text-4xl mb-3">{emptyIcon || '📭'}</div>
      <div className="text-sm font-500">{emptyText || 'No records found'}</div>
    </div>
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map(col => (
                <th key={col.key} className="text-left py-3 px-4 text-xs font-700 uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '--')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPage(page-1)}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft size={14}/>
          </button>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            const p = Math.max(1, Math.min(page-2, pages-4)) + i
            return (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-8 h-8 rounded-lg border text-xs font-600 transition-all
                  ${p === page ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {p}
              </button>
            )
          })}
          <button
            disabled={page >= pages}
            onClick={() => onPage(page+1)}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-all"
          >
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}