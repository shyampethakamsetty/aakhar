import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'

export function Projects() {
  const navigate = useNavigate()
  const projects = projectService.getAllProjects()

  const [filters, setFilters] = useState({
    jan: '',
    clientName: '',
    city: '',
    workName: '',
    status: ''
  })

  // Global search is redundant if we have column filters, but keeping it for flexibility if needed, 
  // or we can remove it. The user asked for "header filters". 
  // Let's keep the global search as a "quick filter" or remove it if it clutters. 
  // I will replace global search with this granular filtering as per request.

  const filteredProjects = projects.filter((p) => {
    return (
      p.jan.toString().includes(filters.jan) &&
      (p.clientName || '').toLowerCase().includes(filters.clientName.toLowerCase()) &&
      (p.location.city || '').toLowerCase().includes(filters.city.toLowerCase()) &&
      (p.workName || '').toLowerCase().includes(filters.workName.toLowerCase()) &&
      (p.status || '').toLowerCase().includes(filters.status.toLowerCase())
    )
  })

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> / <span>Projects</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">All Projects ({filteredProjects.length})</h1>
        <p className="page-subtitle">Manage and track all ongoing and completed projects</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">Project List</div>
          <div className="section-actions">
            <button className="btn btn-primary" onClick={() => alert('Export feature pending')}>
              📥 Export
            </button>
          </div>
        </div>
        <div className="section-content">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', color: '#64748b' }}>
                <th style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>JAN</div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="search-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                    value={filters.jan}
                    onChange={(e) => handleFilterChange('jan', e.target.value)}
                  />
                </th>
                <th style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>Client</div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="search-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                    value={filters.clientName}
                    onChange={(e) => handleFilterChange('clientName', e.target.value)}
                  />
                </th>
                <th style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>Location</div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="search-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </th>
                <th style={{ padding: '12px', width: '30%' }}>
                  <div style={{ marginBottom: '8px' }}>Work Name</div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="search-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                    value={filters.workName}
                    onChange={(e) => handleFilterChange('workName', e.target.value)}
                  />
                </th>
                <th style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>Status</div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="search-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  />
                </th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => (
                <tr key={p.jan} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.jan}</td>
                  <td style={{ padding: '12px' }}>{p.clientName}</td>
                  <td style={{ padding: '12px' }}>{p.location.city}, {p.location.state}</td>
                  <td style={{ padding: '12px' }} title={p.workName}>
                    {p.workName?.length > 40 ? p.workName.substring(0, 40) + '...' : p.workName}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      className={`status-badge ${p.status?.toLowerCase().includes('ongoing') || p.status?.toLowerCase().includes('progress')
                        ? 'status-ongoing'
                        : 'status-pending'
                        }`}
                    >
                      {p.status?.length > 20 ? p.status.substring(0, 20) + '...' : p.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/projects/${p.jan}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No projects found matching filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
