import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import { exportProjectsToPDF } from '../utils/pdfExport'


export function Projects() {
  const navigate = useNavigate()
  const allProjects = projectService.getAllProjects()
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>()
    allProjects.forEach(p => {
      if (p.clientName) clients.add(p.clientName)
    })
    return Array.from(clients).sort()
  }, [allProjects])

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>()
    allProjects.forEach((p) => {
      if (p.status?.trim()) set.add(p.status.trim())
    })
    return Array.from(set).sort()
  }, [allProjects])

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (selectedClient && p.clientName !== selectedClient) return false
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
  }, [allProjects, searchQuery, selectedStatus, selectedClient])

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProjects = filteredProjects.slice(startIndex, endIndex)

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  const onFilterChange = () => setCurrentPage(1)

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span> / </span>
        <span>Projects</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">All Projects</h1>
        <p className="page-subtitle">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </p>
        <div style={{ marginTop: '8px' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/projects/new')}
          >
            ➕ New Project
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">Project List</div>
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
                placeholder="Search by JAN, client, work name, location..."
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
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value)
                  onFilterChange()
                }}
              >
                <option value="">All Clients</option>
                {uniqueClients.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
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
                <option value="">All Statuses</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {(searchQuery || selectedStatus || selectedClient) && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedStatus('')
                  setSelectedClient('')
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
                  <th style={{ padding: '14px 16px' }}>Client</th>
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
                    <td style={{ padding: '14px 16px' }}>{p.clientName}</td>
                    <td style={{ padding: '14px 16px' }} title={p.workName}>
                      {p.workName.length > 50 ? p.workName.substring(0, 50) + '...' : p.workName}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {p.location.city}, {p.location.state}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        className={`status-badge ${p.status.toLowerCase().includes('ongoing') || p.status.toLowerCase().includes('progress')
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
                Try clearing search or filters.
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
    </div>
  )
}
