import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'

interface ClientGroup {
  name: string
  projects: Project[]
  totalValue: number
}

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

// Helper function to format value in crores for display
const formatInCrores = (value: number): string => {
  if (!value || value === 0 || isNaN(value)) return '0.0'
  const crores = Number(value) / 10000000
  if (crores < 1) return crores.toFixed(2)
  if (crores < 10) return (Math.floor(crores * 10) / 10).toFixed(1)
  return Math.floor(crores).toFixed(0)
}

export function TotalValue() {
  const navigate = useNavigate()
  const allProjects = projectService.getAllProjects()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  // Group projects by client and calculate total value for each
  const clients = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, Project[]>()
    allProjects.forEach((p) => {
      const name = p.clientName || 'Unknown Client'
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(p)
    })
    return Array.from(map.entries())
      .map(([name, projects]) => ({
        name,
        projects,
        totalValue: projects.reduce((sum, p) => sum + p.contract.valueInternal, 0)
      }))
      .sort((a, b) => b.totalValue - a.totalValue) // Sort by total value descending
  }, [allProjects])

  const selectedClientData = selectedClient
    ? clients.find((c) => c.name === selectedClient)
    : null

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Home</a> / 
        <span> Total Value</span>
        {selectedClient && <span> / {selectedClient}</span>}
      </div>

      <div className="page-header">
        <h1 className="page-title">
          {selectedClient ? `Projects · ${selectedClient}` : 'Total Value by Client'}
        </h1>
        <p className="page-subtitle">
          {selectedClient
            ? `${selectedClientData?.projects.length ?? 0} project${(selectedClientData?.projects.length ?? 0) !== 1 ? 's' : ''}`
            : `${clients.length} client${clients.length !== 1 ? 's' : ''} · Total: ${formatCurrency(clients.reduce((sum, c) => sum + c.totalValue, 0))}`
          }
        </p>
        {selectedClient && (
          <div style={{ marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedClient(null)
              }}
            >
              ← Back to Clients
            </button>
          </div>
        )}
      </div>

      {!selectedClient ? (
        /* Client list with total values */
        <div className="section">
          <div className="section-header">
            <div className="section-title">👥 Clients by Total Value</div>
          </div>
          <div className="section-content" style={{ padding: 0 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'white',
              }}
            >
              {clients.map((client, index) => (
                <div
                  key={client.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedClient(client.name)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedClient(client.name)
                    }
                  }}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < clients.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 20,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%)'
                    e.currentTarget.style.paddingLeft = '28px'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.paddingLeft = '24px'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                      }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {client.name}
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--primary-color)',
                            background: 'rgba(102, 126, 234, 0.1)',
                            padding: '2px 8px',
                            borderRadius: 12,
                          }}
                        >
                          {client.projects.length} project{client.projects.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Click to view projects
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-color)' }}>
                      {formatCurrency(client.totalValue)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>
                      Total Value
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClient(client.name)
                      }}
                      style={{ padding: '6px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      View Projects
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {clients.length === 0 && (
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
                <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>No clients found</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>Add projects to see clients here.</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Selected client: show their projects as cards */
        selectedClientData && (
          <>
            <div className="section" style={{ marginBottom: 20 }}>
              <div className="section-header" style={{ justifyContent: 'flex-start', gap: 16 }}>
                <div className="section-title">📁 {selectedClientData.name}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Total: {formatCurrency(selectedClientData.totalValue)}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <div className="section-title">Projects</div>
              </div>
              <div className="section-content">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>JAN</th>
                        <th style={{ padding: '14px 16px', minWidth: 200 }}>Work Name</th>
                        <th style={{ padding: '14px 16px' }}>Location</th>
                        <th style={{ padding: '14px 16px' }}>Contract Value</th>
                        <th style={{ padding: '14px 16px' }}>Updated Value</th>
                        <th style={{ padding: '14px 16px' }}>Status</th>
                        <th style={{ padding: '14px 16px', width: 100 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClientData.projects.map((project) => (
                        <tr
                          key={project.jan}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--light)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{project.jan}</td>
                          <td style={{ padding: '14px 16px' }} title={project.workName}>
                            {project.workName.length > 50 ? project.workName.substring(0, 50) + '...' : project.workName}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {project.location.city}, {project.location.state}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--primary-color)' }}>
                            {formatCurrency(project.contract.valueInternal)}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: project.contract.valueUpdated > project.contract.valueInternal ? '#10b981' : 'var(--text-primary)' }}>
                            {formatCurrency(project.contract.valueUpdated)}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              className={`status-badge ${
                                project.status.toLowerCase().includes('ongoing') || project.status.toLowerCase().includes('progress')
                                  ? 'status-ongoing'
                                  : 'status-pending'
                              }`}
                            >
                              {project.status.length > 24 ? project.status.substring(0, 24) + '...' : project.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
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

                {selectedClientData.projects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No projects found</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
