import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import { projectService } from '../data/projectData'
import { ensureChartsRegistered } from '../components/charts/chartSetup'
import { exportFinancialAnalysisToPDF } from '../utils/pdfExport'

ensureChartsRegistered()

const formatCurrency = (value: number): string => {
  if (value === 0 || !value) return '₹0'
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`
  return `₹${value.toLocaleString('en-IN')}`
}

const formatPercent = (value: number): string =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

function normalizeStatus(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('progress') || s.includes('ongoing')) return 'In Progress'
  if (s.includes('complete')) return 'Completed'
  if (s.includes('pending')) return 'Pending'
  return status || 'Not Specified'
}

export function Analysis() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFY, setFilterFY] = useState<string>('')

  const allProjects = useMemo(() => projectService.getAllProjects(), [])

  const filteredProjects = useMemo(() => {
    let list = allProjects
    if (filterStatus) {
      list = list.filter((p) => normalizeStatus(p.status) === filterStatus)
    }
    if (filterFY) {
      list = list.filter((p) => (p.financialYear || 'Not Specified') === filterFY)
    }
    return list
  }, [allProjects, filterStatus, filterFY])

  const financialData = useMemo(() => {
    const projects = filteredProjects
    const totalOriginalValue = projects.reduce((s, p) => s + p.contract.valueInternal, 0)
    const totalUpdatedValue = projects.reduce((s, p) => s + p.contract.valueUpdated, 0)
    const totalValueIncrease = totalUpdatedValue - totalOriginalValue
    const valueIncreasePercent =
      totalOriginalValue > 0 ? (totalValueIncrease / totalOriginalValue) * 100 : 0
    const avgContractValue = projects.length > 0 ? totalOriginalValue / projects.length : 0

    const statusBreakdown = projects.reduce(
      (acc, p) => {
        const status = normalizeStatus(p.status)
        if (!acc[status]) acc[status] = { count: 0, value: 0 }
        acc[status].count++
        acc[status].value += p.contract.valueInternal
        return acc
      },
      {} as Record<string, { count: number; value: number }>
    )

    const valueIncreaseProjects = projects
      .filter((p) => p.contract.valueUpdated > p.contract.valueInternal)
      .map((p) => ({
        jan: p.jan,
        clientName: p.clientName,
        workName: p.workName,
        originalValue: p.contract.valueInternal,
        updatedValue: p.contract.valueUpdated,
        increase: p.contract.valueUpdated - p.contract.valueInternal,
        increasePercent:
          p.contract.valueInternal > 0
            ? ((p.contract.valueUpdated - p.contract.valueInternal) / p.contract.valueInternal) * 100
            : 0,
      }))
      .sort((a, b) => b.increase - a.increase)

    const totalBGValue = projects.reduce((s, p) => s + p.bankGuarantee.value, 0)
    const bgSubmitted = projects.filter(
      (p) =>
        p.bankGuarantee.status &&
        p.bankGuarantee.status.toLowerCase().includes('submitted')
    )
    const bgSubmittedValue = bgSubmitted.reduce((s, p) => s + p.bankGuarantee.value, 0)
    const bgPendingValue = totalBGValue - bgSubmittedValue

    const fyBreakdown = projects.reduce(
      (acc, p) => {
        const fy = p.financialYear || 'Not Specified'
        if (!acc[fy]) acc[fy] = { count: 0, value: 0 }
        acc[fy].count++
        acc[fy].value += p.contract.valueInternal
        return acc
      },
      {} as Record<string, { count: number; value: number }>
    )

    return {
      totalOriginalValue,
      totalUpdatedValue,
      totalValueIncrease,
      valueIncreasePercent,
      avgContractValue,
      statusBreakdown,
      valueIncreaseProjects,
      totalBGValue,
      bgSubmitted: bgSubmitted.length,
      bgSubmittedValue,
      bgPendingValue,
      fyBreakdown,
      totalProjects: filteredProjects.length,
    }
  }, [filteredProjects])

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    allProjects.forEach((p) => set.add(normalizeStatus(p.status)))
    return Array.from(set).sort()
  }, [allProjects])

  const fyOptions = useMemo(() => {
    const set = new Set<string>()
    allProjects.forEach((p) => set.add(p.financialYear || 'Not Specified'))
    return Array.from(set).sort()
  }, [allProjects])

  const handleDownloadPDF = () => {
    exportFinancialAnalysisToPDF({
      ...financialData,
      filterStatus: filterStatus || undefined,
      filterFY: filterFY || undefined,
    })
  }

  const barColors = [
    '#667eea',
    '#764ba2',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
  ]

  const statusChartData = {
    labels: Object.keys(financialData.statusBreakdown),
    datasets: [
      {
        label: 'Contract Value (₹ Cr)',
        data: Object.values(financialData.statusBreakdown).map((d) => d.value / 10000000),
        backgroundColor: barColors.slice(0, Object.keys(financialData.statusBreakdown).length),
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  }

  const fyChartData = {
    labels: Object.keys(financialData.fyBreakdown).sort(),
    datasets: [
      {
        label: 'Contract Value (₹ Cr)',
        data: Object.keys(financialData.fyBreakdown)
          .sort()
          .map((fy) => financialData.fyBreakdown[fy].value / 10000000),
        backgroundColor: barColors.slice(0, Object.keys(financialData.fyBreakdown).length),
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  }

  const valueIncreaseChartData = {
    labels: financialData.valueIncreaseProjects.slice(0, 15).map((p) => `JAN ${p.jan}`),
    datasets: [
      {
        label: 'Original (₹ Cr)',
        data: financialData.valueIncreaseProjects
          .slice(0, 15)
          .map((p) => p.originalValue / 10000000),
        backgroundColor: 'rgba(100, 116, 139, 0.7)',
        borderColor: '#64748b',
        borderWidth: 1,
      },
      {
        label: 'Updated (₹ Cr)',
        data: financialData.valueIncreaseProjects
          .slice(0, 15)
          .map((p) => p.updatedValue / 10000000),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    ],
  }

  const bgChartData = {
    labels: ['Submitted', 'Pending'],
    datasets: [
      {
        label: 'BG Value (₹ Cr)',
        data: [
          financialData.bgSubmittedValue / 10000000,
          financialData.bgPendingValue / 10000000,
        ],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: number }) => `₹ ${ctx.raw.toFixed(2)} Cr`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `₹ ${value} Cr`,
        },
      },
    },
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Analysis</span>
      </div>

      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h1 className="page-title">Financial Analysis</h1>
          <p className="page-subtitle">
            Detailed bar charts and financial overview ({financialData.totalProjects} projects
            {filterStatus || filterFY ? ' after filters' : ''})
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Filters</div>
        </div>
        <div className="section-content">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '8px' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  minWidth: '160px',
                }}
              >
                <option value="">All</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '8px' }}>
                Financial Year
              </label>
              <select
                value={filterFY}
                onChange={(e) => setFilterFY(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  minWidth: '160px',
                }}
              >
                <option value="">All</option>
                {fyOptions.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>
            {(filterStatus || filterFY) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFilterStatus('')
                  setFilterFY('')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.totalOriginalValue)}</div>
              <div className="stat-label">Total Original Value</div>
            </div>
            <div className="stat-icon">💰</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.totalUpdatedValue)}</div>
              <div className="stat-label">Total Updated Value</div>
            </div>
            <div className="stat-icon">📈</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.totalValueIncrease)}</div>
              <div className="stat-label">Value Increase ({formatPercent(financialData.valueIncreasePercent)})</div>
            </div>
            <div className="stat-icon">➕</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.avgContractValue)}</div>
              <div className="stat-label">Average Contract Value</div>
            </div>
            <div className="stat-icon">📊</div>
          </div>
        </div>
      </div>

      {/* Bar charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        <div className="section">
          <div className="section-header">
            <div className="section-title">Contract Value by Status</div>
          </div>
          <div className="section-content chart-container">
            <Bar data={statusChartData} options={chartOptions} />
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div className="section-title">Contract Value by Financial Year</div>
          </div>
          <div className="section-content chart-container">
            <Bar data={fyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="section" style={{ gridColumn: '1 / -1' }}>
          <div className="section-header">
            <div className="section-title">Value Increase: Original vs Updated (Top 15 projects)</div>
          </div>
          <div className="section-content chart-container">
            <Bar
              data={valueIncreaseChartData}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  x: { stacked: false },
                  y: { stacked: false, beginAtZero: true, ticks: { callback: (v: number) => `₹ ${v} Cr` } },
                },
              }}
            />
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div className="section-title">Bank Guarantee: Submitted vs Pending</div>
          </div>
          <div className="section-content chart-container">
            <Bar data={bgChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Value increase table */}
      {financialData.valueIncreaseProjects.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">All Projects with Increased Contract Value</div>
          </div>
          <div className="section-content" style={{ padding: 0 }}>
            <table className="details-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>JAN</th>
                  <th>Client</th>
                  <th>Work</th>
                  <th>Original</th>
                  <th>Updated</th>
                  <th>Increase</th>
                </tr>
              </thead>
              <tbody>
                {financialData.valueIncreaseProjects.map((p) => (
                  <tr
                    key={p.jan}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${p.jan}`)}
                  >
                    <td>{p.jan}</td>
                    <td>{p.clientName}</td>
                    <td>{p.workName.length > 50 ? `${p.workName.slice(0, 50)}...` : p.workName}</td>
                    <td>{formatCurrency(p.originalValue)}</td>
                    <td>{formatCurrency(p.updatedValue)}</td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>
                      +{formatCurrency(p.increase)} ({formatPercent(p.increasePercent)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
