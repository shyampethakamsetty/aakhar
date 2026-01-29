import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'

function hasValidLink(link: string): boolean {
  if (!link || link.trim() === '') return false
  const lower = link.toLowerCase()
  if (lower === 'not found' || lower.includes('not found')) return false
  return link.startsWith('http://') || link.startsWith('https://')
}

function projectHasLinks(p: Project): boolean {
  return (
    hasValidLink(p.documents.loaLink) ||
    hasValidLink(p.documents.agreementLink) ||
    hasValidLink(p.documents.subWorkOrderLink)
  )
}

interface ClientWithDocs {
  name: string
  projects: Project[]
}

export function Documents() {
  const navigate = useNavigate()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Group projects by client – only clients that have at least one project with document links
  const clientsWithDocs = useMemo(() => {
    const all = projectService.getAllProjects()
    const withLinks = all.filter(projectHasLinks)
    const clientMap = new Map<string, Project[]>()

    withLinks.forEach((project) => {
      const clientName = project.clientName || 'Unknown Client'
      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, [])
      }
      clientMap.get(clientName)!.push(project)
    })

    return Array.from(clientMap.entries())
      .map(([name, projects]) => ({ name, projects }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const selectedClientData: ClientWithDocs | null = selectedClient
    ? clientsWithDocs.find((c) => c.name === selectedClient) ?? null
    : null


  const filteredClientsWithDocs = useMemo(() => {
    if (!searchQuery.trim()) return clientsWithDocs
    const q = searchQuery.toLowerCase().trim()
    return clientsWithDocs.filter((c) => c.name.toLowerCase().includes(q))
  }, [clientsWithDocs, searchQuery])

  const LinkCell = ({ url, label }: { url: string; label: string }) => {
    if (!hasValidLink(url)) {
      return <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>—</span>
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          color: 'var(--primary-color)',
          textDecoration: 'underline',
          fontSize: '13px',
          wordBreak: 'break-all'
        }}
      >
        {label}
      </a>
    )
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> /{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedClient(null); }}>Documents</a>
        {selectedClient && <span> / {selectedClient}</span>}
      </div>

      <div className="page-header">
        <h1 className="page-title">
          {selectedClient ? selectedClient : 'Documents &amp; Links'}
        </h1>
        <p className="page-subtitle">
          {selectedClient
            ? `${selectedClientData?.projects.length ?? 0} project${selectedClientData?.projects.length !== 1 ? 's' : ''} with document links`
            : `${clientsWithDocs.length} client${clientsWithDocs.length !== 1 ? 's' : ''} · click a client to see their document links`
          }
        </p>
      </div>

      {!selectedClient ? (
        /* Client list view */
        <div className="section">
          <div className="section-header">
            <div className="section-title">👥 Clients</div>
          </div>
          <div className="section-content" style={{ padding: '0 24px 24px' }}>
            {clientsWithDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>No document links found</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>Add LOA, agreement or subcontractor links in project details</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search clients by name..."
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
                    background: 'white'
                  }}
                >
                  {filteredClientsWithDocs.map((client, index) => (
                  <div
                    key={client.name}
                    onClick={() => setSelectedClient(client.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedClient(client.name)}
                    style={{
                      padding: '20px 24px',
                      borderBottom: index < filteredClientsWithDocs.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20
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
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                        }}
                      >
                        📄
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {client.projects.length} project{client.projects.length !== 1 ? 's' : ''} with document links
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--primary-color)', fontWeight: 500 }}>View projects</span>
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
                          transition: 'all 0.2s ease'
                        }}
                      >
                        →
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                {filteredClientsWithDocs.length === 0 && searchQuery.trim() && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>No clients match your search</div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>Try a different search term</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Selected client: list of projects with document links */
        selectedClientData && (
          <>
            <div className="section" style={{ marginBottom: 20 }}>
              <div className="section-header" style={{ justifyContent: 'flex-start', gap: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedClient(null)}
                  style={{ order: -1 }}
                >
                  ← Back to clients
                </button>
                <div className="section-title">📄 {selectedClientData.name}</div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <div className="section-title">Project documents</div>
              </div>
              <div className="section-content" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13 }}>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>JAN</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, minWidth: 200 }}>Work Name</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>Client LOA/PO</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>Agreement</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>Subcontractor WO</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, width: 90 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClientData.projects.map((project) => (
                        <tr
                          key={project.jan}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--light)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{project.jan}</td>
                          <td style={{ padding: '14px 16px', maxWidth: 280 }} title={project.workName}>
                            {project.workName.length > 50 ? project.workName.substring(0, 50) + '...' : project.workName}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <LinkCell url={project.documents.loaLink} label="🔗 Open" />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <LinkCell url={project.documents.agreementLink} label="🔗 Open" />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <LinkCell url={project.documents.subWorkOrderLink} label="🔗 Open" />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/projects/${project.jan}`)
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
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
