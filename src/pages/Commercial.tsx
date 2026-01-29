import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'
import { CommercialChart } from '../components/charts/CommercialChart'

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

export function Commercial() {
  const navigate = useNavigate()
  const [selectedGSTCategory, setSelectedGSTCategory] = useState<string | null>(null)
  
  const financialStats = useMemo(() => {
    const projects = projectService.getAllProjects()
    
    // Contract Values - fields are always numbers, no need for || 0
    const totalOriginalValue = projects.reduce((sum, p) => sum + p.contract.valueInternal, 0)
    const totalUpdatedValue = projects.reduce((sum, p) => sum + p.contract.valueUpdated, 0)
    const totalValueIncrease = totalUpdatedValue - totalOriginalValue
    const valueIncreasePercent = totalOriginalValue > 0 
      ? ((totalValueIncrease / totalOriginalValue) * 100) 
      : 0
    const avgContractValue = projects.length > 0 ? totalOriginalValue / projects.length : 0
    
    // Bank Guarantee Stats - value is always number
    const totalBGValue = projects.reduce((sum, p) => sum + p.bankGuarantee.value, 0)
    const bgSubmitted = projects.filter(p => 
      p.bankGuarantee.status && 
      p.bankGuarantee.status.toLowerCase().includes('submitted')
    ).length
    const bgNotSubmitted = projects.length - bgSubmitted
    const bgSubmittedValue = projects
      .filter(p => p.bankGuarantee.status && p.bankGuarantee.status.toLowerCase().includes('submitted'))
      .reduce((sum, p) => sum + p.bankGuarantee.value, 0)
    
    // GST Terms Breakdown - gstTerms is always string (may be empty)
    const gstExtraProjects = projects.filter(p => 
      p.contract.gstTerms && p.contract.gstTerms.toLowerCase().includes('extra')
    )
    const gstIncludingProjects = projects.filter(p => 
      p.contract.gstTerms && p.contract.gstTerms.toLowerCase().includes('including')
    )
    const gstNotSpecifiedProjects = projects.filter(p => {
      const gstTerms = p.contract.gstTerms.toLowerCase()
      return !gstTerms.includes('extra') && !gstTerms.includes('including')
    })
    
    const gstExtra = gstExtraProjects.length
    const gstIncluding = gstIncludingProjects.length
    const gstNotSpecified = gstNotSpecifiedProjects.length
    
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
    
    // Projects with value increase
    const projectsWithIncrease = projects.filter(p => 
      p.contract.valueUpdated > p.contract.valueInternal
    ).length
    
    // Status-based value breakdown
    const statusBreakdown = projects.reduce((acc, p) => {
      const status = p.status || 'Not Specified'
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0 }
      }
      acc[status].count++
      acc[status].value += p.contract.valueInternal
      return acc
    }, {} as Record<string, { count: number; value: number }>)
    
    // Top projects by value
    const topProjects = [...projects]
      .sort((a, b) => b.contract.valueInternal - a.contract.valueInternal)
      .slice(0, 5)
    
    return {
      totalOriginalValue,
      totalUpdatedValue,
      totalValueIncrease,
      valueIncreasePercent,
      avgContractValue,
      totalBGValue,
      bgSubmitted,
      bgNotSubmitted,
      bgSubmittedValue,
      gstExtra,
      gstIncluding,
      gstNotSpecified,
      gstExtraProjects,
      gstIncludingProjects,
      gstNotSpecifiedProjects,
      fyBreakdown,
      projectsWithIncrease,
      statusBreakdown,
      topProjects,
      totalProjects: projects.length
    }
  }, [])

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> / <span>Commercial</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Commercial Details</h1>
        <p className="page-subtitle">Contracts, BG, and financial overview</p>
      </div>

      {/* Financial Overview Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialStats.totalOriginalValue)}</div>
              <div className="stat-label">Total Original Contract Value</div>
              <div className="stat-trend">{financialStats.totalProjects} Projects</div>
            </div>
            <div className="stat-icon">💰</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialStats.totalUpdatedValue)}</div>
              <div className="stat-label">Total Updated Contract Value</div>
              <div className="stat-trend up">
                {formatCurrency(financialStats.totalValueIncrease)} ({formatPercent(financialStats.valueIncreasePercent)})
              </div>
            </div>
            <div className="stat-icon">📈</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialStats.totalBGValue)}</div>
              <div className="stat-label">Total Bank Guarantee Value</div>
              <div className="stat-trend">
                {financialStats.bgSubmitted} Submitted / {financialStats.bgNotSubmitted} Pending
              </div>
            </div>
            <div className="stat-icon">🏦</div>
          </div>
        </div>

        <div
          className="stat-card orange"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/value-increase')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/value-increase')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <div>
              <div className="stat-value">{formatCurrency(financialStats.avgContractValue)}</div>
              <div className="stat-label">Average Contract Value</div>
              <div className="stat-trend">
                {financialStats.projectsWithIncrease} / {financialStats.totalProjects} Projects with Value Increase
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '12px', padding: '6px 12px', fontSize: '12px' }}
                onClick={(e) => { e.stopPropagation(); navigate('/value-increase'); }}
              >
                View Projects →
              </button>
            </div>
            <div className="stat-icon">📊</div>
          </div>
        </div>
      </div>

      {/* Contract Value Details */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">💰 Contract Value Overview</div>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Total Original Contract Value</div>
              <div className="info-value">{formatCurrency(financialStats.totalOriginalValue)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Updated Contract Value</div>
              <div className="info-value highlight">{formatCurrency(financialStats.totalUpdatedValue)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Value Increase</div>
              <div className="info-value highlight">
                {formatCurrency(financialStats.totalValueIncrease)} ({formatPercent(financialStats.valueIncreasePercent)})
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Average Contract Value</div>
              <div className="info-value">{formatCurrency(financialStats.avgContractValue)}</div>
            </div>
            <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="info-label">Projects with Value Increase</div>
              <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {financialStats.projectsWithIncrease} / {financialStats.totalProjects}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => navigate('/value-increase')}
                >
                  View Projects →
                </button>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Projects</div>
              <div className="info-value">{financialStats.totalProjects}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Guarantee Details */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">🏦 Bank Guarantee Details</div>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Total BG Value</div>
              <div className="info-value">{formatCurrency(financialStats.totalBGValue)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">BG Submitted</div>
              <div className="info-value">
                <span className="status-badge status-completed">
                  {financialStats.bgSubmitted} Projects
                </span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">BG Submitted Value</div>
              <div className="info-value">{formatCurrency(financialStats.bgSubmittedValue)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">BG Not Submitted</div>
              <div className="info-value">
                <span className="status-badge status-pending">
                  {financialStats.bgNotSubmitted} Projects
                </span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">BG Pending Value</div>
              <div className="info-value">
                {formatCurrency(financialStats.totalBGValue - financialStats.bgSubmittedValue)}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">BG Submission Rate</div>
              <div className="info-value">
                {financialStats.totalProjects > 0 
                  ? ((financialStats.bgSubmitted / financialStats.totalProjects) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GST Terms Breakdown */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">📋 GST Terms Breakdown</div>
          {selectedGSTCategory && (
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedGSTCategory(null)}
            >
              ← Back
            </button>
          )}
        </div>
        <div className="section-content">
          {!selectedGSTCategory ? (
            <div className="info-grid">
              <div 
                className="info-item"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setSelectedGSTCategory('extra')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--light)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="info-label">GST Extra</div>
                <div className="info-value">
                  {financialStats.gstExtra} Projects
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--primary-color)' }}>
                    → View Projects
                  </span>
                </div>
              </div>
              <div 
                className="info-item"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setSelectedGSTCategory('including')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--light)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="info-label">GST Including</div>
                <div className="info-value">
                  {financialStats.gstIncluding} Projects
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--primary-color)' }}>
                    → View Projects
                  </span>
                </div>
              </div>
              <div 
                className="info-item"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setSelectedGSTCategory('not-specified')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--light)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="info-label">Not Specified</div>
                <div className="info-value">
                  {financialStats.gstNotSpecified} Projects
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--primary-color)' }}>
                    → View Projects
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                {selectedGSTCategory === 'extra' && 'GST Extra Projects'}
                {selectedGSTCategory === 'including' && 'GST Including Projects'}
                {selectedGSTCategory === 'not-specified' && 'Not Specified Projects'}
              </div>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', color: '#64748b' }}>
                    <th style={{ padding: '12px' }}>JAN</th>
                    <th style={{ padding: '12px' }}>Client</th>
                    <th style={{ padding: '12px' }}>Work Name</th>
                    <th style={{ padding: '12px' }}>Contract Value</th>
                    <th style={{ padding: '12px' }}>GST Terms</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGSTCategory === 'extra' ? financialStats.gstExtraProjects :
                    selectedGSTCategory === 'including' ? financialStats.gstIncludingProjects :
                    financialStats.gstNotSpecifiedProjects).map((project: Project) => (
                    <tr key={project.jan} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{project.jan}</td>
                      <td style={{ padding: '12px' }}>{project.clientName}</td>
                      <td style={{ padding: '12px' }} title={project.workName}>
                        {project.workName.length > 40 ? project.workName.substring(0, 40) + '...' : project.workName}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>
                        {formatCurrency(project.contract.valueInternal)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {project.contract.gstTerms || 'Not Specified'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          className={`status-badge ${
                            project.status.toLowerCase().includes('ongoing') ||
                            project.status.toLowerCase().includes('progress')
                              ? 'status-ongoing'
                              : 'status-pending'
                          }`}
                        >
                          {project.status.length > 20
                            ? project.status.substring(0, 20) + '...'
                            : project.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => navigate(`/projects/${project.jan}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(selectedGSTCategory === 'extra' ? financialStats.gstExtraProjects :
                selectedGSTCategory === 'including' ? financialStats.gstIncludingProjects :
                financialStats.gstNotSpecifiedProjects).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No projects found</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial Year Breakdown */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">📅 Financial Year Breakdown</div>
        </div>
        <div className="section-content">
          <div style={{ display: 'grid', gap: '16px' }}>
            {Object.entries(financialStats.fyBreakdown)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([fy, data]) => (
                <div key={fy} style={{
                  padding: '16px',
                  background: 'var(--light)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                      {fy}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {data.count} Project{data.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>
                    {formatCurrency(data.value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top Projects by Value */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">🏆 Top 5 Projects by Contract Value</div>
        </div>
        <div className="section-content">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', color: '#64748b' }}>
                <th style={{ padding: '12px' }}>Rank</th>
                <th style={{ padding: '12px' }}>JAN</th>
                <th style={{ padding: '12px' }}>Client</th>
                <th style={{ padding: '12px' }}>Work Name</th>
                <th style={{ padding: '12px' }}>Original Value</th>
                <th style={{ padding: '12px' }}>Updated Value</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {financialStats.topProjects.map((project, index) => (
                <tr key={project.jan} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>#{index + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{project.jan}</td>
                  <td style={{ padding: '12px' }}>{project.clientName}</td>
                  <td style={{ padding: '12px' }} title={project.workName}>
                    {project.workName.length > 40 ? project.workName.substring(0, 40) + '...' : project.workName}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>
                    {formatCurrency(project.contract.valueInternal)}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500', color: 'var(--primary-color)' }}>
                    {formatCurrency(project.contract.valueUpdated)}
                    {project.contract.valueUpdated > project.contract.valueInternal && project.contract.valueInternal > 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--success-color)', marginLeft: '8px' }}>
                        ↑ {formatPercent(((project.contract.valueUpdated - project.contract.valueInternal) / project.contract.valueInternal) * 100)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/projects/${project.jan}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">📊 Financial Overview Chart</div>
        </div>
        <div className="section-content">
          <div className="chart-wrapper" style={{ marginTop: 20 }}>
            <CommercialChart />
          </div>
        </div>
      </div>
    </div>
  )
}

