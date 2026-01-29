import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'

function complianceSummary(p: Project): string {
  const c = p.compliance
  const parts: string[] = []
  if (c.hrClearance) parts.push('HR cleared')
  if (c.pfEsicStatus && !c.pfEsicStatus.toLowerCase().includes('pending')) parts.push('PF/ESIC ok')
  if (c.policyExpiry) parts.push('Policy')
  if (c.laborLicense) parts.push('Labour lic.')
  return parts.length ? parts.join(' · ') : '—'
}

export function HrCompliance() {
  const navigate = useNavigate()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const projects = useMemo(() => projectService.getAllProjects(), [])

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase().trim()
    return projects.filter(
      (p) =>
        p.jan.toString().includes(q) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.workName && p.workName.toLowerCase().includes(q)) ||
        (p.compliance.hrClearance && p.compliance.hrClearance.toLowerCase().includes(q)) ||
        (p.compliance.pfEsicStatus && p.compliance.pfEsicStatus.toLowerCase().includes(q))
    )
  }, [projects, searchQuery])

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span> / </span>
        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedProject(null); }}>HR / Compliance</a>
        {selectedProject && <span> / JAN {selectedProject.jan}</span>}
      </div>

      <div className="page-header">
        <h1 className="page-title">
          {selectedProject ? `HR Compliance · JAN ${selectedProject.jan}` : 'HR / Compliance'}
        </h1>
        <p className="page-subtitle">
          {selectedProject
            ? `${selectedProject.clientName} · ${selectedProject.workName.length > 50 ? selectedProject.workName.substring(0, 50) + '...' : selectedProject.workName}`
            : `${projects.length} project${projects.length !== 1 ? 's' : ''} · click a project to see HR compliance details`}
        </p>
      </div>

      {!selectedProject ? (
        /* Project list */
        <div className="section">
          <div className="section-header">
            <div className="section-title">🛡️ All Projects</div>
          </div>
          <div className="section-content" style={{ padding: '0 24px 24px' }}>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search by JAN, client, work name, HR clearance, PF/ESIC..."
                className="search-input"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'white',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>
                🔍
              </span>
            </div>
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
              {filteredProjects.map((project, index) => (
                <div
                  key={project.jan}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProject(project)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedProject(project)}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < filteredProjects.length - 1 ? '1px solid var(--border)' : 'none',
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
                    const arrow = e.currentTarget.querySelector('[data-arrow]') as HTMLElement
                    if (arrow) {
                      arrow.style.background = 'var(--primary-color)'
                      arrow.style.color = 'white'
                      arrow.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.paddingLeft = '24px'
                    const arrow = e.currentTarget.querySelector('[data-arrow]') as HTMLElement
                    if (arrow) {
                      arrow.style.background = 'rgba(102, 126, 234, 0.1)'
                      arrow.style.color = 'var(--primary-color)'
                      arrow.style.transform = 'translateX(0)'
                    }
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
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                      }}
                    >
                      🛡️
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
                        JAN {project.jan}
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {project.clientName}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {project.workName.length > 60 ? project.workName.substring(0, 60) + '...' : project.workName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--primary-color)' }}>
                        {complianceSummary(project)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: 'var(--primary-color)', fontWeight: 500 }}>
                      View compliance
                    </span>
                    <div
                      data-arrow
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(102, 126, 234, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)',
                        fontSize: 14,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredProjects.length === 0 && (
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
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {searchQuery.trim() ? 'No projects match your search' : 'No projects found'}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  {searchQuery.trim() ? 'Try a different search term' : 'Add projects to see HR compliance.'}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Selected project: HR compliance details */
        <>
          <div className="section" style={{ marginBottom: 20 }}>
            <div className="section-header" style={{ justifyContent: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedProject(null)}
                style={{ order: -1 }}
              >
                ← Back to list
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/projects/${selectedProject.jan}`)}
              >
                View Project →
              </button>
              <div className="section-title">🛡️ JAN {selectedProject.jan}</div>
            </div>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">EMD / Tender fee (MSME)</div>
                  <div className="info-value">
                    {selectedProject.compliance.emdStatus ? (
                      <span className="status-badge status-ongoing">{selectedProject.compliance.emdStatus}</span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">EMD payment received status</div>
                  <div className="info-value">{selectedProject.compliance.emdPaymentStatus || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">HR clearance / RA bill released</div>
                  <div className="info-value">
                    {selectedProject.compliance.hrClearance ? (
                      <span
                        className={`status-badge ${
                          selectedProject.compliance.hrClearance.toLowerCase().includes('release') ||
                          selectedProject.compliance.hrClearance.toLowerCase().includes('submit')
                            ? 'status-completed'
                            : 'status-pending'
                        }`}
                      >
                        {selectedProject.compliance.hrClearance}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Policy expiry / renewal</div>
                  <div className="info-value">{selectedProject.compliance.policyExpiry || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Labour license / BOCW</div>
                  <div className="info-value">{selectedProject.compliance.laborLicense || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">PF/ESIC status (HR clearance)</div>
                  <div className="info-value">
                    {selectedProject.compliance.pfEsicStatus ? (
                      <span
                        className={`status-badge ${
                          selectedProject.compliance.pfEsicStatus.toLowerCase().includes('pending')
                            ? 'status-pending'
                            : 'status-completed'
                        }`}
                      >
                        {selectedProject.compliance.pfEsicStatus}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="section">
            <div className="section-header">
              <div className="section-title">Project summary</div>
            </div>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Client</div>
                  <div className="info-value">{selectedProject.clientName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Work name</div>
                  <div className="info-value">{selectedProject.workName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Location</div>
                  <div className="info-value">
                    {selectedProject.location.city}, {selectedProject.location.state}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Status</div>
                  <div className="info-value">
                    <span className="status-badge status-ongoing">{selectedProject.status}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/projects/${selectedProject.jan}`)}
                >
                  Open full project details →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
