import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'

interface ClientInfo {
  name: string
  projects: Project[]
  contactInfo: {
    name: string
    designation: string
    mobile: string
    email: string
    emailCC: string
    billingAddress: string
  } | null
}

export function ClientDetails() {
  const navigate = useNavigate()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Group projects by client name
  const clients = useMemo(() => {
    const projects = projectService.getAllProjects()
    const clientMap = new Map<string, ClientInfo>()

    projects.forEach((project) => {
      const clientName = project.clientName || 'Unknown Client'
      
      if (!clientMap.has(clientName)) {
        // Get contact info from the first project for this client
        const contactInfo = project.clientContact.name
          ? {
              name: project.clientContact.name,
              designation: project.clientContact.designation,
              mobile: project.clientContact.mobile,
              email: project.clientContact.email,
              emailCC: project.clientContact.emailCC,
              billingAddress: project.clientContact.billingAddress,
            }
          : null

        clientMap.set(clientName, {
          name: clientName,
          projects: [],
          contactInfo,
        })
      }

      clientMap.get(clientName)!.projects.push(project)
    })

    return Array.from(clientMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }, [])

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const q = searchQuery.toLowerCase().trim()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contactInfo?.name && c.contactInfo.name.toLowerCase().includes(q)) ||
        (c.contactInfo?.billingAddress && c.contactInfo.billingAddress.toLowerCase().includes(q))
    )
  }, [clients, searchQuery])

  const selectedClientData = selectedClient
    ? clients.find((c) => c.name === selectedClient)
    : null

  const handleClientClick = (clientName: string) => {
    setSelectedClient(clientName === selectedClient ? null : clientName)
  }

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.jan}`)
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> / 
        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedClient(null); }}>Client Details</a>
        {selectedClient && <span> / {selectedClient}</span>}
      </div>

      <div className="page-header">
        <h1 className="page-title">
          {selectedClient ? `${selectedClient}` : 'Client &amp; Contact Information'}
        </h1>
        <p className="page-subtitle">
          {selectedClient
            ? `${selectedClientData?.projects.length ?? 0} project${(selectedClientData?.projects.length ?? 0) !== 1 ? 's' : ''}`
            : `${clients.length} client${clients.length !== 1 ? 's' : ''} · click a client to see their projects`}
        </p>
      </div>

      {!selectedClient ? (
        /* Client list: only clients, click to show their projects */
        <div className="section">
          <div className="section-header">
            <div className="section-title">👥 Clients</div>
          </div>
          <div className="section-content" style={{ padding: '0 24px 24px' }}>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search clients by name, contact, or address..."
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'white'
            }}>
              {filteredClients.map((client, index) => (
                <div
                  key={client.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleClientClick(client.name)}
                  onKeyDown={(e) => e.key === 'Enter' && handleClientClick(client.name)}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < filteredClients.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
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
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {client.name}
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'var(--primary-color)',
                          background: 'rgba(102, 126, 234, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {client.projects.length} {client.projects.length === 1 ? 'Project' : 'Projects'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        {client.contactInfo?.billingAddress && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📍 {client.contactInfo.billingAddress.length > 40 
                              ? client.contactInfo.billingAddress.substring(0, 40) + '...' 
                              : client.contactInfo.billingAddress}
                          </span>
                        )}
                        {client.contactInfo?.name && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👤 {client.contactInfo.name}
                            {client.contactInfo.designation && (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                • {client.contactInfo.designation}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--primary-color)',
                      fontWeight: '500',
                      opacity: 0.7
                    }}>
                      View Projects
                    </div>
                    <div 
                      data-arrow
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(102, 126, 234, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredClients.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)',
                background: 'white',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {searchQuery.trim() ? 'No clients match your search' : 'No clients found'}
                </div>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>
                  {searchQuery.trim() ? 'Try a different search term' : 'Start by adding projects with client information'}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Show selected client's projects
        selectedClientData && (
          <>
            <div className="section" style={{ marginBottom: '20px' }}>
              <div className="section-header" style={{ justifyContent: 'flex-start', gap: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedClient(null)}
                  style={{ order: -1 }}
                >
                  ← Back to Clients
                </button>
                <div className="section-title">
                  👥 {selectedClientData.name}
                </div>
              </div>
              <div className="section-content">
                {selectedClientData.contactInfo && (
                  <div className="info-grid" style={{ marginBottom: '20px' }}>
                    <div className="contact-card">
                      <div className="contact-name">{selectedClientData.name}</div>
                      <div className="contact-role">Client Company</div>
                      <div className="contact-info">
                        {selectedClientData.contactInfo.billingAddress && (
                          <div className="contact-detail">
                            📍 {selectedClientData.contactInfo.billingAddress}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedClientData.contactInfo.name && (
                      <div className="contact-card">
                        <div className="contact-name">{selectedClientData.contactInfo.name}</div>
                        <div className="contact-role">
                          {selectedClientData.contactInfo.designation || 'Contact Person'}
                        </div>
                        <div className="contact-info">
                          {selectedClientData.contactInfo.mobile && (
                            <div className="contact-detail">
                              📱 <a href={`tel:${selectedClientData.contactInfo.mobile}`}>
                                {selectedClientData.contactInfo.mobile}
                              </a>
                            </div>
                          )}
                          {selectedClientData.contactInfo.email && (
                            <div className="contact-detail">
                              ✉️ <a href={`mailto:${selectedClientData.contactInfo.email}`}>
                                {selectedClientData.contactInfo.email}
                              </a>
                            </div>
                          )}
                          {selectedClientData.contactInfo.emailCC && (
                            <div className="contact-detail">
                              📧 CC: <a href={`mailto:${selectedClientData.contactInfo.emailCC}`}>
                                {selectedClientData.contactInfo.emailCC}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <div className="section-title">📁 Projects ({selectedClientData.projects.length})</div>
              </div>
              <div className="section-content" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13 }}>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>JAN</th>
                        <th style={{ padding: '14px 16px', minWidth: 200 }}>Work name</th>
                        <th style={{ padding: '14px 16px' }}>Location</th>
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
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--light)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          onClick={() => handleProjectClick(project)}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{project.jan}</td>
                          <td style={{ padding: '14px 16px' }} title={project.workName}>
                            {project.workName.length > 50
                              ? project.workName.substring(0, 50) + '...'
                              : project.workName}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {project.location.city}, {project.location.state}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              className={`status-badge ${
                                project.status.toLowerCase().includes('ongoing') ||
                                project.status.toLowerCase().includes('progress')
                                  ? 'status-ongoing'
                                  : 'status-pending'
                              }`}
                            >
                              {project.status.length > 24
                                ? project.status.substring(0, 24) + '...'
                                : project.status}
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
                {selectedClientData.projects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No projects for this client</div>
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

