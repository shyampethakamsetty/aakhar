import { Bar, Pie } from 'react-chartjs-2'
import { ensureChartsRegistered } from './chartSetup'
import { useState } from 'react'

ensureChartsRegistered()

interface FinancialYearData {
  year: string
  value: number
  count: number
}

interface FinancialYearChartProps {
  data: FinancialYearData[]
  chartType?: 'bar' | 'pie'
}

export function FinancialYearChart({ data, chartType = 'bar' }: FinancialYearChartProps) {
  const [currentType, setCurrentType] = useState<'bar' | 'pie'>(chartType)

  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const labels = sortedData.map(d => d.year)
  const values = sortedData.map(d => d.value)
  const colors = [
    '#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', 
    '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6'
  ]

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Contract Value (₹)',
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12, family: 'Inter' },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Financial Year Breakdown',
        font: { size: 16, weight: 'bold' as const, family: 'Inter' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex
            const item = sortedData[index]
            const valueInCr = (item.value / 10000000).toFixed(2)
            return [
              `${item.year}: ₹${valueInCr} Cr`,
              `Projects: ${item.count}`
            ]
          },
        },
      },
    },
    scales: currentType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + (value / 10000000).toFixed(1) + ' Cr'
          },
        },
      },
    } : undefined,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setCurrentType('bar')}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: currentType === 'bar' ? '#667eea' : '#e2e8f0',
            color: currentType === 'bar' ? 'white' : '#64748b',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setCurrentType('pie')}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: currentType === 'pie' ? '#667eea' : '#e2e8f0',
            color: currentType === 'pie' ? 'white' : '#64748b',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          Pie Chart
        </button>
      </div>
      <div className="chart-container">
        {currentType === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Pie data={chartData} options={options} />
        )}
      </div>
    </div>
  )
}
