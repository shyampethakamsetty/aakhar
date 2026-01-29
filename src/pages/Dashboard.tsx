import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'
import { FinancialYearChart } from '../components/charts/FinancialYearChart'

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

// Helper function to format percentage
const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

// Helper function to parse date string (YYYY-MM-DD format)
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'nil') {
    return null
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

// Helper function to calculate days until date
function daysUntil(date: Date | null): number | null {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper function to check if date is overdue
function isOverdue(date: Date | null): boolean {
  if (!date) return false
  const days = daysUntil(date)
  return days !== null && days < 0
}

interface Alert {
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  project: Project
  daysRemaining?: number | null
  action?: string
}

export function Dashboard() {
  const navigate = useNavigate()
  
  const stats = useMemo(() => {
    const projects = projectService.getAllProjects()
    const totalValue = projectService.getTotalContractValue()
    const totalProjects = projects.length

    // Status counts
    const ongoing = projects.filter(p =>
      p.status.toLowerCase().includes('progress') ||
      p.status.toLowerCase().includes('ongoing')
    ).length

    return { totalValue, totalProjects, ongoing }
  }, [])

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

    // Status breakdown
    const statusBreakdown = projects.reduce((acc, p) => {
      const status = p.status || 'Not Specified'
      // Normalize status for grouping
      let normalizedStatus = status
      if (status.toLowerCase().includes('progress') || status.toLowerCase().includes('ongoing')) {
        normalizedStatus = 'In Progress'
      } else if (status.toLowerCase().includes('complete')) {
        normalizedStatus = 'Completed'
      } else if (status.toLowerCase().includes('pending')) {
        normalizedStatus = 'Pending'
      }
      
      if (!acc[normalizedStatus]) {
        acc[normalizedStatus] = { count: 0, value: 0 }
      }
      acc[normalizedStatus].count++
      acc[normalizedStatus].value += p.contract.valueInternal
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    // Projects with value increase
    const projectsWithIncrease = projects.filter(p => 
      p.contract.valueUpdated > p.contract.valueInternal
    )
    const valueIncreaseProjects = projectsWithIncrease.map(p => ({
      jan: p.jan,
      clientName: p.clientName,
      workName: p.workName,
      originalValue: p.contract.valueInternal,
      updatedValue: p.contract.valueUpdated,
      increase: p.contract.valueUpdated - p.contract.valueInternal,
      increasePercent: p.contract.valueInternal > 0 
        ? ((p.contract.valueUpdated - p.contract.valueInternal) / p.contract.valueInternal) * 100 
        : 0
    })).sort((a, b) => b.increase - a.increase)

    // Bank Guarantee Summary
    const totalBGValue = projects.reduce((sum, p) => sum + p.bankGuarantee.value, 0)
    const bgSubmitted = projects.filter(p => 
      p.bankGuarantee.status && 
      p.bankGuarantee.status.toLowerCase().includes('submitted')
    )
    const bgPending = projects.filter(p => 
      !p.bankGuarantee.status || 
      !p.bankGuarantee.status.toLowerCase().includes('submitted')
    )
    const bgSubmittedValue = bgSubmitted.reduce((sum, p) => sum + p.bankGuarantee.value, 0)
    const bgPendingValue = bgPending.reduce((sum, p) => sum + p.bankGuarantee.value, 0)

    // Top 5 projects by value
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
      valueIncreaseProjects,
      totalBGValue,
      bgSubmitted: bgSubmitted.length,
      bgPending: bgPending.length,
      bgSubmittedValue,
      bgPendingValue,
      topProjects,
      fyChartData
    }
  }, [])

  // Critical Alerts & Notifications (used for future Alerts UI)
  const alerts = useMemo(() => {
    const projects = projectService.getAllProjects()
    const alertList: Alert[] = []

    projects.forEach((project) => {
      // 1. Bank Guarantee expiry alerts (30/60/90 days)
      if (project.bankGuarantee.expiryDate) {
        const bgExpiryDate = parseDate(project.bankGuarantee.expiryDate)
        if (bgExpiryDate) {
          const daysRemaining = daysUntil(bgExpiryDate)
          if (daysRemaining !== null) {
            if (daysRemaining < 0) {
              alertList.push({
                type: 'critical',
                title: 'Bank Guarantee Expired',
                message: `BG for project ${project.jan} (${project.clientName}) expired ${Math.abs(daysRemaining)} day(s) ago`,
                project,
                daysRemaining,
                action: 'Renew immediately'
              })
            } else if (daysRemaining <= 30) {
              alertList.push({
                type: 'critical',
                title: 'Bank Guarantee Expiring Soon',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Renew now'
              })
            } else if (daysRemaining <= 60) {
              alertList.push({
                type: 'warning',
                title: 'Bank Guarantee Expiring',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Plan renewal'
              })
            } else if (daysRemaining <= 90) {
              alertList.push({
                type: 'info',
                title: 'Bank Guarantee Expiring',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Monitor'
              })
            }
          }
        }
      }

      // 2. Compliance expiry alerts (Policy, Labour License)
      // Policy Expiry
      if (project.compliance.policyExpiry) {
        const policyDate = parseDate(project.compliance.policyExpiry)
        if (policyDate) {
          const daysRemaining = daysUntil(policyDate)
          if (daysRemaining !== null && daysRemaining <= 90) {
            const alertType = daysRemaining < 0 ? 'critical' : daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'info'
            alertList.push({
              type: alertType,
              title: daysRemaining < 0 ? 'Policy Expired' : 'Policy Expiring',
              message: `Policy for project ${project.jan} (${project.clientName}) ${daysRemaining < 0 ? `expired ${Math.abs(daysRemaining)} day(s) ago` : `expires in ${daysRemaining} day(s)`}`,
              project,
              daysRemaining,
              action: daysRemaining < 0 ? 'Renew immediately' : 'Renew soon'
            })
          }
        }
      }

      // Labour License Expiry (extract date from string if possible)
      if (project.compliance.laborLicense) {
        // Try to extract date from the license string
        const dateMatch = project.compliance.laborLicense.match(/\d{4}-\d{2}-\d{2}/)
        if (dateMatch) {
          const licenseDate = parseDate(dateMatch[0])
          if (licenseDate) {
            const daysRemaining = daysUntil(licenseDate)
            if (daysRemaining !== null && daysRemaining <= 90) {
              const alertType = daysRemaining < 0 ? 'critical' : daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'info'
              alertList.push({
                type: alertType,
                title: daysRemaining < 0 ? 'Labour License Expired' : 'Labour License Expiring',
                message: `Labour License for project ${project.jan} (${project.clientName}) ${daysRemaining < 0 ? `expired ${Math.abs(daysRemaining)} day(s) ago` : `expires in ${daysRemaining} day(s)`}`,
                project,
                daysRemaining,
                action: daysRemaining < 0 ? 'Renew immediately' : 'Renew soon'
              })
            }
          }
        }
      }

      // 3. Projects approaching completion dates (within 30 days)
      if (project.dates.completionDateLatest) {
        const completionDate = parseDate(project.dates.completionDateLatest)
        if (completionDate) {
          const daysRemaining = daysUntil(completionDate)
          if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30) {
            alertList.push({
              type: 'info',
              title: 'Project Approaching Completion',
              message: `Project ${project.jan} (${project.clientName}) is completing in ${daysRemaining} day(s)`,
              project,
              daysRemaining,
              action: 'Review status'
            })
          }
        }
      }

      // 4. Projects overdue for completion
      if (project.dates.completionDateLatest) {
        const completionDate = parseDate(project.dates.completionDateLatest)
        if (completionDate && isOverdue(completionDate)) {
          const daysOverdue = daysUntil(completionDate)
          alertList.push({
            type: 'critical',
            title: 'Project Overdue',
            message: `Project ${project.jan} (${project.clientName}) is ${daysOverdue ? Math.abs(daysOverdue) : 'overdue'} day(s) overdue`,
            project,
            daysRemaining: daysOverdue,
            action: 'Take action'
          })
        }
      }

      // 5. Missing documents
      if (!project.documents.loaLink || project.documents.loaLink.trim() === '') {
        alertList.push({
          type: 'warning',
          title: 'Missing LOA Document',
          message: `Project ${project.jan} (${project.clientName}) is missing LOA/PO upload link`,
          project,
          action: 'Upload document'
        })
      }

      if (!project.documents.agreementLink || project.documents.agreementLink.trim() === '' || project.documents.agreementLink.toLowerCase().includes('not found')) {
        alertList.push({
          type: 'warning',
          title: 'Missing Agreement Document',
          message: `Project ${project.jan} (${project.clientName}) is missing contract agreement link`,
          project,
          action: 'Upload document'
        })
      }

      // 6. HR clearance pending projects
      if (!project.compliance.hrClearance || project.compliance.hrClearance.trim() === '' || project.compliance.hrClearance.toLowerCase().includes('pending')) {
        alertList.push({
          type: 'warning',
          title: 'HR Clearance Pending',
          message: `Project ${project.jan} (${project.clientName}) has pending HR clearance`,
          project,
          action: 'Complete clearance'
        })
      }

      // 7. PF/ESIC pending projects
      if (!project.compliance.pfEsicStatus || project.compliance.pfEsicStatus.trim() === '' || project.compliance.pfEsicStatus.toLowerCase().includes('pending')) {
        alertList.push({
          type: 'warning',
          title: 'PF/ESIC Pending',
          message: `Project ${project.jan} (${project.clientName}) has pending PF/ESIC status`,
          project,
          action: 'Resolve pending'
        })
      }
    })

    // Sort alerts by priority: critical first, then by days remaining
    return alertList.sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, info: 2 }
      if (priorityOrder[a.type] !== priorityOrder[b.type]) {
        return priorityOrder[a.type] - priorityOrder[b.type]
      }
      const aDays = a.daysRemaining ?? Infinity
      const bDays = b.daysRemaining ?? Infinity
      return aDays - bDays
    })
  }, [])
  void alerts // reserved for Alerts UI

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Dashboard</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Project Dashboard</h1>
        <p className="page-subtitle">Overview of All {stats.totalProjects} Projects</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <div>
              <div className="stat-value">₹{(stats.totalValue / 10000000).toFixed(2)}</div>
              <div className="stat-label">Total Contract Value (Cr)</div>
              <div className="stat-trend up">{stats.totalProjects} Active Projects</div>
            </div>
            <div className="stat-icon">💼</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div>
              <div className="stat-value">{stats.ongoing}</div>
              <div className="stat-label">Ongoing Projects</div>
              <div className="stat-trend up">
                On Track
              </div>
            </div>
            <div className="stat-icon">📈</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div>
              <div className="stat-value">{stats.totalProjects - stats.ongoing}</div>
              <div className="stat-label">Pending / Other</div>
              <div className="stat-trend">Needs Attention</div>
            </div>
            <div className="stat-icon">⏱️</div>
          </div>
        </div>

      </div>

      {/* Financial Overview Widgets */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            💰 Financial Overview
          </div>
        </div>
        <div className="section-content">
          {/* Total Contract Value with Status Breakdown */}
          <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              marginBottom: '24px', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              Total Contract Value
            </h3>
            <div className="info-grid" style={{ marginBottom: '24px' }}>
              <div className="info-item" style={{ padding: '20px', background: 'var(--light)', borderRadius: '10px' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total Original Value
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalOriginalValue)}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total Updated Value
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalUpdatedValue)}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total Value Increase
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalValueIncrease)}
                </div>
                <div style={{ fontSize: '14px', color: '#10b981', marginTop: '4px', fontWeight: '600' }}>
                  {formatPercent(financialData.valueIncreasePercent)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Breakdown by Status
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '16px'
              }}>
                {Object.entries(financialData.statusBreakdown).map(([status, data]) => (
                  <div key={status} style={{
                    padding: '20px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                      {status}
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.2' }}>
                      {formatCurrency(data.value)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      {data.count} project{data.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value Increase Tracker - max 6 projects */}
          {financialData.valueIncreaseProjects.length > 0 && (
            <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    marginBottom: '8px', 
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em'
                  }}>
                    Projects with Value Increase
                  </h3>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {financialData.valueIncreaseProjects.length} / {stats.totalProjects} projects with increased contract value (showing max 6)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/value-increase')}
                  className="btn btn-primary"
                  style={{ flexShrink: 0 }}
                >
                  View All Projects →
                </button>
              </div>
              <div style={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
              }}>
                {financialData.valueIncreaseProjects.slice(0, 6).map((project) => (
                  <div
                    key={project.jan}
                    onClick={() => navigate(`/projects/${project.jan}`)}
                    style={{
                      padding: '20px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
                      e.currentTarget.style.borderColor = 'var(--primary-color)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)', 
                      marginBottom: '6px',
                      lineHeight: '1.4'
                    }}>
                      JAN {project.jan}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)', 
                      marginBottom: '12px',
                      fontWeight: '500'
                    }}>
                      {project.clientName}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      {project.workName.length > 60 ? `${project.workName.substring(0, 60)}...` : project.workName}
                    </div>
                    <div style={{ 
                      padding: '12px', 
                      background: 'var(--light)', 
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Original Value:</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {formatCurrency(project.originalValue)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Updated Value:</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>
                          {formatCurrency(project.updatedValue)}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.1))',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <div style={{ fontSize: '12px', color: '#059669', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Increase
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981', lineHeight: '1.3' }}>
                        +{formatCurrency(project.increase)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                        {formatPercent(project.increasePercent)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Guarantee Summary */}
          <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              marginBottom: '24px', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              Bank Guarantee Summary
            </h3>
            <div className="info-grid" style={{ marginBottom: '24px' }}>
              <div className="info-item" style={{ padding: '20px', background: 'var(--light)', borderRadius: '10px' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total BG Value
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalBGValue)}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Submitted
                </div>
                <div className="info-value" style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', lineHeight: '1.2', marginBottom: '6px' }}>
                  {formatCurrency(financialData.bgSubmittedValue)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {financialData.bgSubmitted} project{financialData.bgSubmitted !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Pending
                </div>
                <div className="info-value" style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b', lineHeight: '1.2', marginBottom: '6px' }}>
                  {formatCurrency(financialData.bgPendingValue)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {financialData.bgPending} project{financialData.bgPending !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Submission Progress
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {financialData.totalBGValue > 0 
                    ? `${((financialData.bgSubmittedValue / financialData.totalBGValue) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                background: 'var(--light)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  height: '100%',
                  width: financialData.totalBGValue > 0 
                    ? `${(financialData.bgSubmittedValue / financialData.totalBGValue) * 100}%` 
                    : '0%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.5s ease',
                  borderRadius: '6px'
                }} />
              </div>
            </div>
          </div>

          {/* Average Contract Value & Top 5 Projects */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '24px',
            marginBottom: '40px',
            paddingBottom: '32px',
            borderBottom: '2px solid var(--border)'
          }}>
            {/* Average Contract Value */}
            <div style={{
              padding: '32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ fontSize: '15px', opacity: 0.95, marginBottom: '12px', fontWeight: '500', letterSpacing: '0.3px' }}>
                Average Contract Value
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.2' }}>
                {formatCurrency(financialData.avgContractValue)}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>
                Across {stats.totalProjects} project{stats.totalProjects !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Top 5 Projects by Value */}
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Top 5 Projects by Value
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {financialData.topProjects.map((project, index) => (
                  <div
                    key={project.jan}
                    onClick={() => navigate(`/projects/${project.jan}`)}
                    style={{
                      padding: '16px',
                      background: 'var(--light)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e8f0'
                      e.currentTarget.style.borderColor = 'var(--primary-color)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--light)'
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          JAN {project.jan}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '40px', fontWeight: '500', lineHeight: '1.4' }}>
                        {project.clientName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '4px', lineHeight: '1.2' }}>
                        {formatCurrency(project.value)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {project.status.length > 25 ? `${project.status.substring(0, 25)}...` : project.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Year Breakdown Chart */}
          {financialData.fyChartData.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '24px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Financial Year Breakdown
              </h3>
              <FinancialYearChart data={financialData.fyChartData} />
            </div>
          )}
        </div>
      </div>

      {/* Project Progress */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            📊 Recent Projects
          </div>
        </div>
        <div className="section-content">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '10px' }}>JAN</th>
                <th style={{ padding: '10px' }}>Client</th>
                <th style={{ padding: '10px' }}>Work</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectService.getAllProjects().slice(0, 5).map(p => (
                <tr key={p.jan} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.jan}</td>
                  <td style={{ padding: '10px' }}>{p.clientName}</td>
                  <td style={{ padding: '10px' }}>{p.workName.substring(0, 40)}...</td>
                  <td style={{ padding: '10px' }}>
                    <span className="status-badge status-ongoing">{p.status.substring(0, 20)}</span>
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

