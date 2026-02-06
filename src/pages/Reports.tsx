import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService, normalizeProjectStatus } from '../data/projectData'
import { ProjectsByStatusChart } from '../components/charts/ProjectsByStatusChart'
import { MonthlyProgressChart } from '../components/charts/MonthlyProgressChart'
import { TopProjectsBarChart } from '../components/charts/TopProjectsBarChart'
import { FinancialYearChart } from '../components/charts/FinancialYearChart'

// Helper function to parse date string (YYYY-MM-DD format)
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'nil') {
    return null
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

export function Reports() {
  const navigate = useNavigate()

  // Financial Overview Data
  const financialData = useMemo(() => {
    const projects = projectService.getAllProjects()
    
    // Total contract values
    const totalOriginalValue = projects.reduce((sum, p) => sum + p.contract.valueInternal, 0)
    const totalUpdatedValue = projects.reduce((sum, p) => sum + p.contract.valueUpdated, 0)
    const totalValueIncrease = totalUpdatedValue - totalOriginalValue
    const valueIncreasePercent = totalOriginalValue > 0 
      ? ((totalValueIncrease / totalOriginalValue) * 100) 
      : 0
    const avgContractValue = projects.length > 0 ? totalOriginalValue / projects.length : 0

    // Status breakdown - use same normalizer as chart
    const statusBreakdown = projects.reduce((acc, p) => {
      const normalizedStatus = normalizeProjectStatus(p.status || '')
      if (!acc[normalizedStatus]) {
        acc[normalizedStatus] = { count: 0, value: 0 }
      }
      acc[normalizedStatus].count++
      acc[normalizedStatus].value += p.contract.valueInternal
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    // Financial Year Breakdown
    const fyBreakdown = projects.reduce((acc, p) => {
      const fy = p.financialYear || 'Not Specified'
      if (!acc[fy]) {
        acc[fy] = { count: 0, value: 0 }
      }
      acc[fy].count++
      acc[fy].value += p.contract.valueInternal
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    const fyChartData = Object.entries(fyBreakdown).map(([year, data]) => ({
      year,
      value: data.value,
      count: data.count
    }))

    return {
      totalOriginalValue,
      totalUpdatedValue,
      totalValueIncrease,
      valueIncreasePercent,
      avgContractValue,
      statusBreakdown,
      fyChartData
    }
  }, [])

  // Analytics & Insights Data
  const analyticsData = useMemo(() => {
    const projects = projectService.getAllProjects()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Status breakdown for donut chart - normalize raw statuses to 4 categories
    let ongoing = 0
    let completed = 0
    let delayed = 0
    let stopped = 0

    projects.forEach(p => {
      const normalized = normalizeProjectStatus(p.status)
      switch (normalized) {
        case 'ongoing':
          ongoing++
          break
        case 'completed':
          completed++
          break
        case 'delayed':
          delayed++
          break
        case 'stopped':
          stopped++
          break
      }
    })

    // Monthly Progress Data
    const monthLabels = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26']
    const monthlyData: { month: string; completed: number; started: number }[] = []

    monthLabels.forEach((monthLabel) => {
      const year = monthLabel.includes('25') ? 2025 : 2026
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthLabel.split(' ')[0]
      const monthIndex = monthNames.indexOf(monthName)
      
      if (monthIndex === -1) return

      const monthStart = new Date(year, monthIndex, 1)
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)

      // Count projects completed in this month
      const completedInMonth = projects.filter(p => {
        if (normalizeProjectStatus(p.status) !== 'completed') return false

        const completionDate = parseDate(p.dates.completionDateLatest) || parseDate(p.dates.completionDateOriginal)
        if (!completionDate) return false

        const compDate = new Date(completionDate)
        compDate.setHours(0, 0, 0, 0)
        return compDate >= monthStart && compDate <= monthEnd
      }).length

      // Count projects started in this month
      const startedInMonth = projects.filter(p => {
        const startDate = parseDate(p.dates.startDate) || parseDate(p.dates.loaDate)
        if (!startDate) return false

        const sDate = new Date(startDate)
        sDate.setHours(0, 0, 0, 0)
        return sDate >= monthStart && sDate <= monthEnd
      }).length

      monthlyData.push({
        month: monthLabel,
        completed: completedInMonth,
        started: startedInMonth
      })
    })

    // Top 5 Projects by Value
    const topProjects = [...projects]
      .sort((a, b) => b.contract.valueInternal - a.contract.valueInternal)
      .slice(0, 5)
      .map(p => ({
        jan: p.jan,
        clientName: p.clientName,
        workName: p.workName,
        value: p.contract.valueInternal,
        status: p.status
      }))

    return {
      statusData: {
        ongoing,
        completed,
        delayed,
        stopped
      },
      monthlyProgress: monthlyData,
      topProjects
    }
  }, [])

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    if (value === 0 || !value) return '₹0'
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`
    } else {
      return `₹${value.toLocaleString('en-IN')}`
    }
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Home</a> / 
        <span>Reports</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">📈 Reports & Analytics</h1>
        <p className="page-subtitle">Comprehensive project insights and visual analytics</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card blue">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.totalOriginalValue)}</div>
              <div className="stat-label">Total Original Value</div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              💰
            </div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.totalUpdatedValue)}</div>
              <div className="stat-label">Total Updated Value</div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📈
            </div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.totalValueIncrease)}</div>
              <div className="stat-label">Total Value Increase</div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⬆️
            </div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialData.avgContractValue)}</div>
              <div className="stat-label">Average Contract Value</div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📊
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Insights Section */}
      <div className="section" style={{ marginBottom: '32px' }}>
        <div className="section-header">
          <div className="section-title">
            📊 Analytics & Insights
          </div>
        </div>
        <div className="section-content">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Projects by Status - Donut Chart */}
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Projects by Status
              </h3>
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProjectsByStatusChart data={analyticsData.statusData} />
              </div>
            </div>

            {/* Monthly Progress - Line Chart */}
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Monthly Progress
              </h3>
              <div style={{ minHeight: '300px' }}>
                <MonthlyProgressChart data={analyticsData.monthlyProgress} />
              </div>
            </div>
          </div>

          {/* Top 5 Projects by Value - Horizontal Bar Chart */}
          <div style={{
            padding: '20px',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginBottom: '16px', 
              color: 'var(--text-primary)'
            }}>
              Top 5 Projects by Value
            </h3>
            <div style={{ height: '280px', width: '100%' }}>
              <TopProjectsBarChart projects={analyticsData.topProjects} />
            </div>
          </div>

          {/* Financial Year Breakdown */}
          {financialData.fyChartData.length > 0 && (
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Financial Year Breakdown
              </h3>
              <div style={{ minHeight: '300px' }}>
                <FinancialYearChart data={financialData.fyChartData} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown Table */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">📋 Status Breakdown</div>
        </div>
        <div className="section-content" style={{ padding: 0 }}>
          <table className="details-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Project Count</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(financialData.statusBreakdown)
                .sort((a, b) => b[1].value - a[1].value)
                .map(([status, data]) => (
                  <tr key={status} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500, textTransform: 'capitalize' }}>
                      {status}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {data.count} project{data.count !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--primary-color)' }}>
                      {formatCurrency(data.value)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
