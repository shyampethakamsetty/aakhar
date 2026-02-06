import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { projectService } from '../data/projectData'
import { exportProjectsToPDF } from '../utils/pdfExport'
import type { Project } from '../types/project'

// Helper function to parse date string (YYYY-MM-DD format)
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'nil') {
    return null
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

interface ClientGroup {
  name: string
  projects: Project[]
}

export function Projects() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const allProjects = projectService.getAllProjects()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Get filter from URL params
  const urlFilter = searchParams.get('filter') || 'all'
  
  // Apply filter based on URL parameter
  const filteredByType = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (urlFilter) {
      case 'ongoing': {
        return allProjects.filter(p => {
          const status = p.status.toLowerCase()
          return status.includes('progress') || 
                 status.includes('ongoing') ||
                 status.includes('work in progress') ||
                 (status.includes('work') && !status.includes('complete') && !status.includes('stop'))
        })
      }
      case 'completed': {
        return allProjects.filter(p => {
          const status = p.status.toLowerCase()
          const isCompletedByStatus = status.includes('complete') || status.includes('completed')
          
          if (p.dates.completionDateLatest) {
            const completionDate = parseDate(p.dates.completionDateLatest)
            if (completionDate) {
              const compDate = new Date(completionDate)
              compDate.setHours(0, 0, 0, 0)
              if (compDate < today && !status.includes('ongoing') && !status.includes('progress')) {
                return true
              }
            }
          }
          
          return isCompletedByStatus
        })
      }
      case 'on-time': {
        return allProjects.filter(p => {
          // Must have both dates
          if (!p.dates.completionDateOriginal || !p.dates.completionDateLatest) return false
          
          const originalDate = parseDate(p.dates.completionDateOriginal)
          const latestDate = parseDate(p.dates.completionDateLatest)
          
          if (!originalDate || !latestDate) return false
          
          const origDate = new Date(originalDate)
          origDate.setHours(0, 0, 0, 0)
          const latDate = new Date(latestDate)
          latDate.setHours(0, 0, 0, 0)
          
          const status = p.status.toLowerCase()
          const isCompleted = status.includes('complete') || status.includes('completed')
          
          // Completed and on-time (latest <= original)
          return (isCompleted || latDate <= today) && latDate <= origDate
        })
      }
      case 'delayed': {
        return allProjects.filter(p => {
          if (!p.dates.completionDateOriginal || !p.dates.completionDateLatest) return false
          
          const originalDate = parseDate(p.dates.completionDateOriginal)
          const latestDate = parseDate(p.dates.completionDateLatest)
          
          if (!originalDate || !latestDate) return false
          
          const origDate = new Date(originalDate)
          origDate.setHours(0, 0, 0, 0)
          const latDate = new Date(latestDate)
          latDate.setHours(0, 0, 0, 0)
          
          const status = p.status.toLowerCase()
          const isCompleted = status.includes('complete') || status.includes('completed')
          
          // Completed and delayed (latest > original)
          return (isCompleted || latDate <= today) && latDate > origDate
        })
      }
      default:
        return allProjects
    }
  }, [allProjects, urlFilter])

  // Group projects by client (use filtered projects if filter is active)
  const projectsToShow = urlFilter !== 'all' ? filteredByType : allProjects
  
  // Group projects by client
  const clients = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, Project[]>()
    projectsToShow.forEach((p) => {
      const name = p.clientName || 'Unknown Client'
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(p)
    })
    return Array.from(map.entries())
      .map(([name, projects]) => ({ name, projects }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [projectsToShow])

  const selectedClientData = selectedClient
    ? clients.find((c) => c.name === selectedClient)
    : null

  // When a client is selected, filter their projects
  // If filter is active and no client selected, show filtered projects directly
  const clientProjects = selectedClient ? (selectedClientData?.projects ?? []) : (urlFilter !== 'all' ? filteredByType : [])
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>()
    clientProjects.forEach((p) => {
      if (p.status?.trim()) set.add(p.status.trim())
    })
    return Array.from(set).sort()
  }, [clientProjects])

  const filteredProjects = useMemo(() => {
    // If no client selected and filter is active, return filtered projects directly
    if (!selectedClient && urlFilter !== 'all') {
      return filteredByType.filter((p) => {
        if (selectedStatus && p.status !== selectedStatus) return false
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        const text = [
          p.jan.toString(),
          p.clientName || '',
          p.workName || '',
          p.location.city || '',
          p.location.state || '',
          p.status || '',
          p.financialYear || '',
          p.clientContact.name || '',
          p.clientContact.email || '',
          p.clientContact.mobile || '',
        ].join(' ').toLowerCase()
        return text.includes(q)
      })
    }
    
    // Otherwise, filter client projects
    return clientProjects.filter((p) => {
      if (selectedStatus && p.status !== selectedStatus) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const text = [
        p.jan.toString(),
        p.clientName || '',
        p.workName || '',
        p.location.city || '',
        p.location.state || '',
        p.status || '',
        p.financialYear || '',
        p.clientContact.name || '',
        p.clientContact.email || '',
        p.clientContact.mobile || '',
      ].join(' ').toLowerCase()
      return text.includes(q)
    })
  }, [clientProjects, searchQuery, selectedStatus, selectedClient, urlFilter, filteredByType])
  
  // Update page title based on filter
  const getPageTitle = () => {
    if (selectedClient) return `Projects · ${selectedClient}`
    switch (urlFilter) {
      case 'ongoing': return 'Ongoing Projects'
      case 'completed': return 'Completed Projects'
      case 'on-time': return 'On-Time Delivery Projects'
      case 'delayed': return 'Delayed Projects'
      default: return 'All Projects'
    }
  }
  
  const getPageSubtitle = () => {
    if (selectedClient) {
      return `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`
    }
    switch (urlFilter) {
      case 'ongoing': return `${filteredProjects.length} ongoing project${filteredProjects.length !== 1 ? 's' : ''}`
      case 'completed': return `${filteredProjects.length} completed project${filteredProjects.length !== 1 ? 's' : ''}`
      case 'on-time': return `${filteredProjects.length} on-time project${filteredProjects.length !== 1 ? 's' : ''}`
      case 'delayed': return `${filteredProjects.length} delayed project${filteredProjects.length !== 1 ? 's' : ''}`
      default: return `${clients.length} client${clients.length !== 1 ? 's' : ''} · ${allProjects.length} project${allProjects.length !== 1 ? 's' : ''}`
    }
  }

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProjects = filteredProjects.slice(startIndex, endIndex)

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  const onFilterChange = () => setCurrentPage(1)
  
  // Clear URL filter when needed
  const clearFilter = () => {
    setSearchParams({})
    setSelectedClient(null)
    setSearchQuery('')
    setSelectedStatus('')
    setCurrentPage(1)
  }

  return (
    <div className="content">
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Home</a>
        <span> / </span>
        <a href="#" onClick={(e) => { e.preventDefault(); clearFilter(); }}>All Projects</a>
        {urlFilter !== 'all' && <span> / {getPageTitle()}</span>}
        {selectedClient && <span> / {selectedClient}</span>}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '13px' }}
        >
          Go to Dashboard
        </button>
      </div>

      <div className="page-header">
        <h1 className="page-title">
          {getPageTitle()}
        </h1>
        <p className="page-subtitle">
          {getPageSubtitle()}
        </p>
        {urlFilter !== 'all' && (
          <div style={{ marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={clearFilter}
            >
              ← Back to All Projects
            </button>
          </div>
        )}
        {selectedClient && (
          <div style={{ marginTop: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/projects/new')}
            >
              ➕ New Project
            </button>
          </div>
        )}
      </div>

      {!selectedClient && urlFilter === 'all' ? (
        /* Client list: only clients, click to show their projects */
        <div className="section">
          <div className="section-header">
            <div className="section-title">👥 Clients</div>
            <div className="section-actions">
              <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
                ➕ New Project
              </button>
            </div>
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
                    setSearchQuery('')
                    setSelectedStatus('')
                    setCurrentPage(1)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedClient(client.name)
                      setSearchQuery('')
                      setSelectedStatus('')
                      setCurrentPage(1)
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
        /* Selected client or filtered view: show projects */
        <>
          {selectedClient && selectedClientData && (
            <div className="section" style={{ marginBottom: 20 }}>
              <div className="section-header" style={{ justifyContent: 'flex-start', gap: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedClient(null)
                    setCurrentPage(1)
                  }}
                  style={{ order: -1 }}
                >
                  ← Back to clients
                </button>
                <div className="section-title">📁 {selectedClientData.name}</div>
              </div>
            </div>
          )}

          <div className="section">
            <div className="section-header">
              <div className="section-title">Project list</div>
              <div className="section-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => exportProjectsToPDF(filteredProjects)}
                >
                  📥 Export
                </button>
              </div>
            </div>
              <div className="section-content">
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 24,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by JAN, work name, location, status..."
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
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        onFilterChange()
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 18,
                      }}
                    >
                      🔍
                    </span>
                  </div>
                  <div style={{ minWidth: 200 }}>
                    <select
                      className="search-input"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: 14,
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'white',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2364748b\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: 36,
                      }}
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value)
                        onFilterChange()
                      }}
                    >
                      <option value="">All statuses</option>
                      {uniqueStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {(searchQuery || selectedStatus) && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedStatus('')
                        onFilterChange()
                      }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '14px 16px', fontWeight: 600 }}>JAN</th>
                        <th style={{ padding: '14px 16px', minWidth: 200 }}>Work name</th>
                        <th style={{ padding: '14px 16px' }}>Location</th>
                        <th style={{ padding: '14px 16px' }}>Status</th>
                        <th style={{ padding: '14px 16px', width: 100 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProjects.map((p) => (
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
                          <td style={{ padding: '14px 16px' }} title={p.workName}>
                            {p.workName.length > 50 ? p.workName.substring(0, 50) + '...' : p.workName}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {p.location.city}, {p.location.state}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              className={`status-badge ${
                                p.status.toLowerCase().includes('ongoing') || p.status.toLowerCase().includes('progress')
                                  ? 'status-ongoing'
                                  : 'status-pending'
                              }`}
                            >
                              {p.status.length > 24 ? p.status.substring(0, 24) + '...' : p.status}
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

                {filteredProjects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>No projects match your filters</div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>
                      Try clearing search or status filter.
                    </div>
                  </div>
                )}

                {filteredProjects.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 24,
                      paddingTop: 20,
                      borderTop: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Show:</label>
                      <select
                        className="search-input"
                        style={{
                          padding: '6px 12px',
                          fontSize: 14,
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          background: 'white',
                          cursor: 'pointer',
                          minWidth: 70,
                        }}
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>entries</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {startIndex + 1}–{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 14, opacity: currentPage === 1 ? 0.5 : 1 }}
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        ««
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 14, opacity: currentPage === 1 ? 0.5 : 1 }}
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        ‹
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let n: number
                        if (totalPages <= 5) n = i + 1
                        else if (currentPage <= 3) n = i + 1
                        else if (currentPage >= totalPages - 2) n = totalPages - 4 + i
                        else n = currentPage - 2 + i
                        return (
                          <button
                            key={n}
                            className={currentPage === n ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ padding: '6px 12px', fontSize: 14, minWidth: 36 }}
                            onClick={() => goToPage(n)}
                          >
                            {n}
                          </button>
                        )
                      })}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 14, opacity: currentPage === totalPages ? 0.5 : 1 }}
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        ›
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 14, opacity: currentPage === totalPages ? 0.5 : 1 }}
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        »»
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      }
    </div>
  )
}
