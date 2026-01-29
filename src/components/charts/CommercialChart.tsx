import { Doughnut } from 'react-chartjs-2'
import { ensureChartsRegistered } from './chartSetup'

ensureChartsRegistered()

export function CommercialChart() {
  return (
    <Doughnut
      data={{
        labels: ['Completed Work (₹3.3 Cr)', 'In Progress (₹4.6 Cr)', 'Pending (₹5.3 Cr)'],
        datasets: [
          {
            data: [25, 35, 40],
            backgroundColor: ['#10b981', '#667eea', '#e2e8f0'],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverOffset: 10,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12, family: 'Inter' },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          title: {
            display: true,
            text: 'Project Expenditure Breakdown',
            font: { size: 16, weight: 'bold', family: 'Inter' },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
            callbacks: {
              label(context) {
                return `${context.label}: ${context.parsed}%`
              },
            },
          },
        },
        animation: { animateScale: true, animateRotate: true, duration: 1000 },
      }}
    />
  )
}

