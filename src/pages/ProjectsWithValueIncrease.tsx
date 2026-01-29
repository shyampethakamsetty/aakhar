import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import { exportProjectsToPDF } from '../utils/pdfExport'
import type { Project } from '../types/project'

const formatCurrency = (value: number): string => {
  if (value === 0 || !value) return '₹0'
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`
  return `₹${value.toLocaleString('en-IN')}`
}

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function ProjectsWithValueIncrease() {
  const navigate = useNavigate()

  const { projects, totalProjects } = useMemo(() => {
    const all = projectService.getAllProjects()
    const withIncrease = all
      .filter((p) => p.contract.valueUpdated > p.contract.valueInternal)
      .map((p) => ({
        ...p,
        increase: p.contract.valueUpdated - p.contract.valueInternal,
        increasePercent:
          p.contract.valueInternal > 0
            ? ((p.contract.valueUpdated - p.contract.valueInternal) / p.contract.valueInternal) * 100
            : 0,
      }))
      .sort((a, b) => b.increase - a.increase)
    return { projects: withIncrease, totalProjects: all.length }
  }, [])

  const handleExport = () => {
    exportProjectsToPDF(projects)
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span> / </span>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Dashboard</a>
        <span> / Projects with Value Increase</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Projects with Value Increase</h1>
        <p className="page-subtitle">
          {projects.length} / {totalProjects} projects have increased contract value
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">📈 Value Increase ({projects.length} projects)</div>
          <div className="section-actions">
            <button type="button" className="btn btn-primary" onClick={handleExport}>
              📥 Export
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        <div className="section-content" style={{ padding: 0 }}>
          {projects.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)',
                background: 'white',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>No projects with value increase</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                Contract value increases will appear here when updated value exceeds original.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13 }}>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>JAN</th>
                    <th style={{ padding: '14px 16px', minWidth: 160 }}>Client</th>
                    <th style={{ padding: '14px 16px', minWidth: 200 }}>Work name</th>
                    <th style={{ padding: '14px 16px' }}>Original</th>
                    <th style={{ padding: '14px 16px' }}>Updated</th>
                    <th style={{ padding: '14px 16px' }}>Increase</th>
                    <th style={{ padding: '14px 16px' }}>%</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', width: 100 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr
                      key={p.jan}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--light)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      onClick={() => navigate(`/projects/${p.jan}`)}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{p.jan}</td>
                      <td style={{ padding: '14px 16px' }}>{p.clientName}</td>
                      <td style={{ padding: '14px 16px' }} title={p.workName}>
                        {p.workName.length > 50 ? p.workName.substring(0, 50) + '...' : p.workName}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {formatCurrency(p.contract.valueInternal)}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#10b981', fontWeight: 600 }}>
                        {formatCurrency(p.contract.valueUpdated)}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#10b981', fontWeight: 600 }}>
                        +{formatCurrency(p.increase)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#10b981', fontWeight: 600 }}>
                        {formatPercent(p.increasePercent)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className={`status-badge ${
                            p.status.toLowerCase().includes('ongoing') || p.status.toLowerCase().includes('progress')
                              ? 'status-ongoing'
                              : 'status-pending'
                          }`}
                        >
                          {p.status.length > 20 ? p.status.substring(0, 20) + '...' : p.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/projects/${p.jan}`)
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
