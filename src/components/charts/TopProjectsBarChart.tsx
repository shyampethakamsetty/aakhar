import { Bar } from 'react-chartjs-2'
import { ensureChartsRegistered } from './chartSetup'

ensureChartsRegistered()

interface ProjectData {
  jan: number
  clientName: string
  workName: string
  value: number
}

interface TopProjectsBarChartProps {
  projects: ProjectData[]
}

export function TopProjectsBarChart({ projects }: TopProjectsBarChartProps) {
  // Sort projects by value descending and take top 5
  // Highest value will appear at the top of the horizontal bar chart
  const topProjects = [...projects]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Format project labels (show work name or client name, shorter)
  const labels = topProjects.map(p => {
    const displayName = p.workName || p.clientName
    return displayName.length > 30 ? `${displayName.substring(0, 30)}...` : displayName
  })

  // Convert values to crores
  const valuesInCrores = topProjects.map(p => p.value / 10000000)

  // Calculate max value for X-axis (round up to nearest 5)
  const maxValue = Math.max(...valuesInCrores, 1)
  const xAxisMax = Math.ceil(maxValue / 5) * 5

  // Color palette matching the image description
  const colors = [
    '#9FA8DA', // Light purple
    '#7E57C2', // Darker purple
    '#64B5F6', // Light blue
    '#4DB6AC', // Teal/Green
    '#FFB74D', // Orange/Yellow
  ]

  const chartData = {
    labels,
    datasets: [
      {
        data: valuesInCrores,
        backgroundColor: colors.slice(0, topProjects.length),
        borderWidth: 0,
        borderRadius: 3,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
        callbacks: {
          title: (tooltipItems: any[]) => {
            const index = tooltipItems[0].dataIndex
            return topProjects[index].workName || topProjects[index].clientName
          },
          label: (context: any) => {
            const value = context.parsed.x
            return `₹${value.toFixed(1)} Cr`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: xAxisMax,
        ticks: {
          stepSize: 5,
          font: { size: 11 },
          callback: function(value: any) {
            return `${value} Cr`
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        ticks: {
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
