import { useMemo } from 'react'
import { projectService } from '../data/projectData'

export function Dashboard() {
  const stats = useMemo(() => {
    const projects = projectService.getAllProjects()
    const totalValue = projectService.getTotalContractValue()
    const totalProjects = projects.length

    // Status counts
    const ongoing = projects.filter(p =>
      p.status?.toLowerCase().includes('progress') ||
      p.status?.toLowerCase().includes('ongoing')
    ).length

    // Find expiring BGs (dummy logic for now, or real date parsing)
    // For now, let's just find one with a future date close to now
    const expiringBg = projects.find(p => p.bankGuarantee.expiryDate)

    return { totalValue, totalProjects, ongoing, expiringBg }
  }, [])

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Dashboard</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Project Dashboard</h1>
        <p className="page-subtitle">Overview of All {stats.totalProjects} Projects</p>
      </div>

      {stats.expiringBg && (
        <div className="alert alert-warning">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <div className="alert-title">Bank Guarantee Alert</div>
            <div className="alert-message">
              BG for project {stats.expiringBg.jan} ({stats.expiringBg.clientName}) expires on {stats.expiringBg.bankGuarantee.expiryDate}.
            </div>
          </div>
        </div>
      )}

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
                  <td style={{ padding: '10px' }}>{p.workName?.substring(0, 40)}...</td>
                  <td style={{ padding: '10px' }}>
                    <span className="status-badge status-ongoing">{p.status?.substring(0, 20)}</span>
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

