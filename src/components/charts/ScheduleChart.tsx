import { Bar } from 'react-chartjs-2'
import { ensureChartsRegistered } from './chartSetup'

ensureChartsRegistered()

export function ScheduleChart() {
  return (
    <Bar
      data={{
        labels: ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'],
        datasets: [
          {
            label: 'Planned Progress (%)',
            data: [10, 25, 40, 55, 70, 85, 100],
            backgroundColor: 'rgba(102, 126, 234, 0.6)',
            borderColor: '#667eea',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Actual Progress (%)',
            data: [12, 25, null, null, null, null, null],
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.5,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12, family: 'Inter' },
              usePointStyle: true,
              pointStyle: 'rect',
            },
          },
          title: {
            display: true,
            text: 'Project Progress Timeline',
            font: { size: 16, weight: 'bold', family: 'Inter' },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback(value) {
                return `${value}%`
              },
              font: { size: 11 },
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
        },
        animation: { duration: 1000, easing: 'easeInOutQuart' },
      }}
    />
  )
}

