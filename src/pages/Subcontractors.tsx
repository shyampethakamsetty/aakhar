import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'

interface SubcontractorInfo {
  name: string
  projects: Project[]
  // Details from first project for this subcontractor
  details: {
    proprietor: string
    mobile: string
    email: string
    gstin: string
    workOrderNo: string
    workOrderDate: string
    workOrderPercent: string
  }
}

export function Subcontractors() {
  const navigate = useNavigate()
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Group projects by subcontractor name (only include projects with a subcontractor name)
  const subcontractors = useMemo(() => {
    const projects = projectService.getAllProjects()
    const map = new Map<string, SubcontractorInfo>()

    projects.forEach((project) => {
      const name = (project.subcontractor.name || '').trim()
      if (!name) return
      if (!map.has(name)) {
        map.set(name, {
          name,
          projects: [],
          details: {
            proprietor: project.subcontractor.proprietor,
            mobile: project.subcontractor.mobile,
            email: project.subcontractor.email,
            gstin: project.subcontractor.gstin,
            workOrderNo: project.subcontractor.workOrderNo,
            workOrderDate: project.subcontractor.workOrderDate,
            workOrderPercent: project.subcontractor.workOrderPercent,
          },
        })
      }
      map.get(name)!.projects.push(project)
    })

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const filteredSubcontractors = useMemo(() => {
    if (!searchQuery.trim()) return subcontractors
    const q = searchQuery.toLowerCase().trim()
    return subcontractors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.details.proprietor && s.details.proprietor.toLowerCase().includes(q)) ||
        (s.details.email && s.details.email.toLowerCase().includes(q))
    )
  }, [subcontractors, searchQuery])

  const selectedData = selectedSubcontractor
    ? subcontractors.find((s) => s.name === selectedSubcontractor)
    : null

  const handleSubcontractorClick = (name: string) => {
    setSelectedSubcontractor(name === selectedSubcontractor ? null : name)
  }

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.jan}`)
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span> / </span>
        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedSubcontractor(null); }}>Subcontractors</a>
        {selectedSubcontractor && <span> / {selectedSubcontractor}</span>}
      </div>

      <div className="page-header">
        <h1 className="page-title">
          {selectedSubcontractor ? selectedSubcontractor : 'Subcontractor Details'}
        </h1>
        <p className="page-subtitle">
          {selectedSubcontractor
            ? `${selectedData?.projects.length ?? 0} project${(selectedData?.projects.length ?? 0) !== 1 ? 's' : ''}`
            : `${subcontractors.length} subcontractor${subcontractors.length !== 1 ? 's' : ''} · click to see their projects`}
        </p>
      </div>

      {!selectedSubcontractor ? (
        /* Subcontractor list: only subcontractors, click to show their projects */
        <div className="section">
          <div className="section-header">
            <div className="section-title">🏗️ Subcontractors</div>
          </div>
          <div className="section-content" style={{ padding: '0 24px 24px' }}>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search subcontractors by name, proprietor, or email..."
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
              {filteredSubcontractors.map((sub, index) => (
                <div
                  key={sub.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSubcontractorClick(sub.name)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubcontractorClick(sub.name)}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < filteredSubcontractors.length - 1 ? '1px solid var(--border)' : 'none',
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
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                      }}
                    >
                      🏗️
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
                        {sub.name}
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
                          {sub.projects.length} project{sub.projects.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {sub.details.proprietor && `👤 ${sub.details.proprietor}`}
                        {sub.details.proprietor && sub.details.workOrderPercent && ' · '}
                        {sub.details.workOrderPercent && `WO ${sub.details.workOrderPercent}%`}
                        {!sub.details.proprietor && !sub.details.workOrderPercent && 'Click to view projects'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: 'var(--primary-color)', fontWeight: 500 }}>
                      View projects
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
            {filteredSubcontractors.length === 0 && (
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
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {searchQuery.trim() ? 'No subcontractors match your search' : 'No subcontractors found'}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  {searchQuery.trim() ? 'Try a different search term' : 'Add subcontractor details in project records.'}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Selected subcontractor: details + projects */
        selectedData && (
          <>
            <div className="section" style={{ marginBottom: 20 }}>
              <div className="section-header" style={{ justifyContent: 'flex-start', gap: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedSubcontractor(null)}
                  style={{ order: -1 }}
                >
                  ← Back to Subcontractors
                </button>
                <div className="section-title">🏗️ {selectedData.name}</div>
              </div>
              <div className="section-content">
                <div className="contact-card" style={{ marginBottom: 0 }}>
                  <div className="contact-name">{selectedData.name}</div>
                  <div className="contact-role">Subcontractor</div>
                  <div className="info-grid" style={{ marginTop: 16 }}>
                    {selectedData.details.proprietor && (
                      <div className="info-item">
                        <div className="info-label">Proprietor / Signatory</div>
                        <div className="info-value">{selectedData.details.proprietor}</div>
                      </div>
                    )}
                    {selectedData.details.mobile && (
                      <div className="info-item">
                        <div className="info-label">Contact Number</div>
                        <div className="info-value">
                          <a href={`tel:${selectedData.details.mobile}`} style={{ color: 'var(--primary-color)' }}>
                            {selectedData.details.mobile}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedData.details.email && (
                      <div className="info-item">
                        <div className="info-label">Email Address</div>
                        <div className="info-value">
                          <a href={`mailto:${selectedData.details.email}`} style={{ color: 'var(--primary-color)' }}>
                            {selectedData.details.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedData.details.gstin && (
                      <div className="info-item">
                        <div className="info-label">GSTIN</div>
                        <div className="info-value">{selectedData.details.gstin}</div>
                      </div>
                    )}
                    {selectedData.details.workOrderPercent && (
                      <div className="info-item">
                        <div className="info-label">Work Order %</div>
                        <div className="info-value highlight">{selectedData.details.workOrderPercent}%</div>
                      </div>
                    )}
                    {selectedData.details.workOrderNo && (
                      <div className="info-item">
                        <div className="info-label">Work Order Number</div>
                        <div className="info-value">{selectedData.details.workOrderNo}</div>
                      </div>
                    )}
                    {selectedData.details.workOrderDate && (
                      <div className="info-item">
                        <div className="info-label">Work Order Date</div>
                        <div className="info-value">{selectedData.details.workOrderDate}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <div className="section-title">📁 Projects ({selectedData.projects.length})</div>
              </div>
              <div className="section-content" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13 }}>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>JAN</th>
                        <th style={{ padding: '14px 16px', minWidth: 200 }}>Work name</th>
                        <th style={{ padding: '14px 16px' }}>Client</th>
                        <th style={{ padding: '14px 16px' }}>Location</th>
                        <th style={{ padding: '14px 16px' }}>Status</th>
                        <th style={{ padding: '14px 16px', width: 100 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedData.projects.map((project) => (
                        <tr
                          key={project.jan}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--light)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          onClick={() => handleProjectClick(project)}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{project.jan}</td>
                          <td style={{ padding: '14px 16px' }} title={project.workName}>
                            {project.workName.length > 50 ? project.workName.substring(0, 50) + '...' : project.workName}
                          </td>
                          <td style={{ padding: '14px 16px' }}>{project.clientName}</td>
                          <td style={{ padding: '14px 16px' }}>
                            {project.location.city}, {project.location.state}
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
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleProjectClick(project)
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
                {selectedData.projects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No projects for this subcontractor</div>
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
