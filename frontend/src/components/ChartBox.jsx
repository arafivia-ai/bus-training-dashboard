import React, { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(...registerables, ChartDataLabels)

const PAL = ['#1d4ed8','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#374151','#4f46e5','#0d9488']

export default function ChartBox({ id, type, labels, data, title, sub, height = 240, horiz = false }) {
  const ref = useRef()
  const inst = useRef()

  useEffect(() => {
    if (!ref.current || !labels?.length) return
    if (inst.current) inst.current.destroy()
    const ring = type === 'doughnut' || type === 'pie'
    const isLine = type === 'line'

    inst.current = new Chart(ref.current, {
      type,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ring ? PAL : isLine ? 'rgba(29,78,216,.08)' : PAL,
          borderColor: isLine ? '#1d4ed8' : ring ? '#fff' : PAL,
          borderWidth: ring ? 2 : isLine ? 2.5 : 0,
          borderRadius: ring || isLine ? 0 : 6,
          fill: isLine,
          tension: isLine ? 0.4 : 0,
          pointBackgroundColor: isLine ? '#1d4ed8' : undefined,
          pointRadius: isLine ? 4 : undefined,
          hoverOffset: ring ? 8 : 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        indexAxis: horiz ? 'y' : 'x',
        plugins: {
          legend: { display: ring, position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 10.5 } } },
          tooltip: { backgroundColor: '#0f2044', titleColor: '#fff', bodyColor: 'rgba(255,255,255,.75)', cornerRadius: 10, padding: 12 },
          datalabels: !isLine ? {
            display: ctx => {
              if (ring) {
                const t = ctx.dataset.data.reduce((a, b) => a + b, 0)
                return t > 0 && ctx.dataset.data[ctx.dataIndex] / t > 0.05
              }
              const v = ctx.dataset.data[ctx.dataIndex]
              const mx = Math.max(...ctx.dataset.data.filter(Number))
              return v > 0 && mx > 0 && v / mx >= 0.07
            },
            color: ctx => ring ? '#fff' : '#334155',
            backgroundColor: ctx => ring ? 'rgba(0,0,0,.3)' : 'transparent',
            borderRadius: 3,
            padding: ctx => ring ? { top: 2, bottom: 2, left: 5, right: 5 } : 0,
            font: { size: ring ? 10 : 10.5, weight: '700' },
            formatter: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v,
            anchor: ring ? 'center' : horiz ? 'end' : 'end',
            align: ring ? 'center' : horiz ? 'right' : 'top',
            clamp: true,
          } : false
        },
        scales: ring ? {} : {
          x: { grid: { color: '#f8fafc' }, ticks: { font: { size: 10.5 }, color: '#94a3b8', maxRotation: 35 }, border: { display: false } },
          y: { grid: { color: '#f1f5f9' }, beginAtZero: true, ticks: { font: { size: 10.5 }, color: '#94a3b8' }, border: { display: false } }
        }
      }
    })
    return () => inst.current?.destroy()
  }, [labels, data, type])

  return (
    <div className="chart-card">
      <div className="cc-header">
        <div>
          <div className="cc-title">{title}</div>
          {sub && <div className="cc-sub">{sub}</div>}
        </div>
      </div>
      <div className="chart-wrap" style={{ height }}><canvas ref={ref} /></div>
    </div>
  )
}