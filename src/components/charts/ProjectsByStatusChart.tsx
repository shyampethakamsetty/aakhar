import { Doughnut } from 'react-chartjs-2'
import { ensureChartsRegistered } from './chartSetup'

ensureChartsRegistered()

interface StatusData {
  ongoing: number
  completed: number
  delayed: number
  stopped: number
}

interface ProjectsByStatusChartProps {
  data: StatusData
}

export function ProjectsByStatusChart({ data }: ProjectsByStatusChartProps) {
  const total = data.ongoing + data.completed + data.delayed + data.stopped
  
  const chartData = {
    labels: ['Ongoing', 'Completed', 'Delayed', 'Stopped'],
    datasets: [
      {
        label: 'Projects by Status',
        data: [data.ongoing, data.completed, data.delayed, data.stopped],
        backgroundColor: [
          '#10b981', // Green for Ongoing
          '#3b82f6', // Blue for Completed
          '#ef4444', // Red for Delayed
          '#6b7280', // Gray for Stopped
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    cutout: '60%', // Makes it a donut chart
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12, family: 'Inter' },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
