import { Line } from 'react-chartjs-2'
import { ensureChartsRegistered } from './chartSetup'

ensureChartsRegistered()

interface MonthlyData {
  month: string // Format: "Jul 25", "Aug 25", etc.
  completed: number
  started: number
}

interface MonthlyProgressChartProps {
  data: MonthlyData[]
}

export function MonthlyProgressChart({ data }: MonthlyProgressChartProps) {
  const labels = data.map(d => d.month)
  const completedData = data.map(d => d.completed)
  const startedData = data.map(d => d.started)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Projects Completed',
        data: completedData,
        borderColor: '#3b82f6', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'New Projects Started',
        data: startedData,
        borderColor: '#10b981', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 2,
        fill: true, // Area fill
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }

  const maxValue = Math.max(
    ...completedData,
    ...startedData,
    1 // Ensure at least 1 for proper scaling
  )
  const yAxisMax = Math.ceil(maxValue * 1.2) // Add 20% padding

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
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
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: yAxisMax,
        ticks: {
          stepSize: 1,
          font: { size: 11, family: 'Inter' },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: { size: 11, family: 'Inter' },
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
