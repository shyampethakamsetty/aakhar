import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'

// Helper function to parse date string (YYYY-MM-DD format)
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'nil') {
    return null
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

// Helper function to calculate days until date
function daysUntil(date: Date | null): number | null {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper function to check if date is overdue
function isOverdue(date: Date | null): boolean {
  if (!date) return false
  const days = daysUntil(date)
  return days !== null && days < 0
}

interface Alert {
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  project: Project
  daysRemaining?: number | null
  action?: string
  category: 'bank-guarantee' | 'compliance' | 'due-dates' | 'missing-docs' | 'hr-pf'
}

export function Alerts() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Get all alerts organized by category
  const alertsByCategory = useMemo(() => {
    const projects = projectService.getAllProjects()
    const alerts: Alert[] = []

    projects.forEach((project) => {
      // 1. Bank Guarantee expiry alerts (30/60/90 days)
      if (project.bankGuarantee.expiryDate) {
        const bgExpiryDate = parseDate(project.bankGuarantee.expiryDate)
        if (bgExpiryDate) {
          const daysRemaining = daysUntil(bgExpiryDate)
          if (daysRemaining !== null) {
            if (daysRemaining < 0) {
              alerts.push({
                type: 'critical',
                title: 'Bank Guarantee Expired',
                message: `BG for project ${project.jan} (${project.clientName}) expired ${Math.abs(daysRemaining)} day(s) ago`,
                project,
                daysRemaining,
                action: 'Renew immediately',
                category: 'bank-guarantee'
              })
            } else if (daysRemaining <= 30) {
              alerts.push({
                type: 'critical',
                title: 'Bank Guarantee Expiring Soon',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Renew now',
                category: 'bank-guarantee'
              })
            } else if (daysRemaining <= 60) {
              alerts.push({
                type: 'warning',
                title: 'Bank Guarantee Expiring',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Plan renewal',
                category: 'bank-guarantee'
              })
            } else if (daysRemaining <= 90) {
              alerts.push({
                type: 'info',
                title: 'Bank Guarantee Expiring',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Monitor',
                category: 'bank-guarantee'
              })
            }
          }
        }
      }

      // 2. Compliance expiry alerts (Policy, Labour License)
      // Policy Expiry
      if (project.compliance.policyExpiry) {
        const policyDate = parseDate(project.compliance.policyExpiry)
        if (policyDate) {
          const daysRemaining = daysUntil(policyDate)
          if (daysRemaining !== null && daysRemaining <= 90) {
            const alertType = daysRemaining < 0 ? 'critical' : daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'info'
            alerts.push({
              type: alertType,
              title: daysRemaining < 0 ? 'Policy Expired' : 'Policy Expiring',
              message: `Policy for project ${project.jan} (${project.clientName}) ${daysRemaining < 0 ? `expired ${Math.abs(daysRemaining)} day(s) ago` : `expires in ${daysRemaining} day(s)`}`,
              project,
              daysRemaining,
              action: daysRemaining < 0 ? 'Renew immediately' : 'Renew soon',
              category: 'compliance'
            })
          }
        }
      }

      // Labour License Expiry
      if (project.compliance.laborLicense) {
        const dateMatch = project.compliance.laborLicense.match(/\d{4}-\d{2}-\d{2}/)
        if (dateMatch) {
          const licenseDate = parseDate(dateMatch[0])
          if (licenseDate) {
            const daysRemaining = daysUntil(licenseDate)
            if (daysRemaining !== null && daysRemaining <= 90) {
              const alertType = daysRemaining < 0 ? 'critical' : daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'info'
              alerts.push({
                type: alertType,
                title: daysRemaining < 0 ? 'Labour License Expired' : 'Labour License Expiring',
                message: `Labour License for project ${project.jan} (${project.clientName}) ${daysRemaining < 0 ? `expired ${Math.abs(daysRemaining)} day(s) ago` : `expires in ${daysRemaining} day(s)`}`,
                project,
                daysRemaining,
                action: daysRemaining < 0 ? 'Renew immediately' : 'Renew soon',
                category: 'compliance'
              })
            }
          }
        }
      }

      // 3. Projects approaching completion dates (within 30 days)
      if (project.dates.completionDateLatest) {
        const completionDate = parseDate(project.dates.completionDateLatest)
        if (completionDate) {
          const daysRemaining = daysUntil(completionDate)
          if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30) {
            alerts.push({
              type: 'info',
              title: 'Project Approaching Completion',
              message: `Project ${project.jan} (${project.clientName}) is completing in ${daysRemaining} day(s)`,
              project,
              daysRemaining,
              action: 'Review status',
              category: 'due-dates'
            })
          }
        }
      }

      // 4. Projects overdue for completion
      if (project.dates.completionDateLatest) {
        const completionDate = parseDate(project.dates.completionDateLatest)
        if (completionDate && isOverdue(completionDate)) {
          const daysOverdue = daysUntil(completionDate)
          alerts.push({
            type: 'critical',
            title: 'Project Overdue',
            message: `Project ${project.jan} (${project.clientName}) is ${daysOverdue ? Math.abs(daysOverdue) : 'overdue'} day(s) overdue`,
            project,
            daysRemaining: daysOverdue,
            action: 'Take action',
            category: 'due-dates'
          })
        }
      }

      // 5. Missing documents
      if (!project.documents.loaLink || project.documents.loaLink.trim() === '') {
        alerts.push({
          type: 'warning',
          title: 'Missing LOA Document',
          message: `Project ${project.jan} (${project.clientName}) is missing LOA/PO upload link`,
          project,
          action: 'Upload document',
          category: 'missing-docs'
        })
      }

      if (!project.documents.agreementLink || project.documents.agreementLink.trim() === '' || project.documents.agreementLink.toLowerCase().includes('not found')) {
        alerts.push({
          type: 'warning',
          title: 'Missing Agreement Document',
          message: `Project ${project.jan} (${project.clientName}) is missing contract agreement link`,
          project,
          action: 'Upload document',
          category: 'missing-docs'
        })
      }

      // 6. HR clearance pending projects
      if (!project.compliance.hrClearance || project.compliance.hrClearance.trim() === '' || project.compliance.hrClearance.toLowerCase().includes('pending')) {
        alerts.push({
          type: 'warning',
          title: 'HR Clearance Pending',
          message: `Project ${project.jan} (${project.clientName}) has pending HR clearance`,
          project,
          action: 'Complete clearance',
          category: 'hr-pf'
        })
      }

      // 7. PF/ESIC pending projects
      if (!project.compliance.pfEsicStatus || project.compliance.pfEsicStatus.trim() === '' || project.compliance.pfEsicStatus.toLowerCase().includes('pending')) {
        alerts.push({
          type: 'warning',
          title: 'PF/ESIC Pending',
          message: `Project ${project.jan} (${project.clientName}) has pending PF/ESIC status`,
          project,
          action: 'Resolve pending',
          category: 'hr-pf'
        })
      }
    })

    // Organize by category
    const categorized: Record<string, Alert[]> = {
      'bank-guarantee': [],
      'compliance': [],
      'due-dates': [],
      'missing-docs': [],
      'hr-pf': []
    }

    alerts.forEach(alert => {
      categorized[alert.category].push(alert)
    })

    // Sort each category by priority
    Object.keys(categorized).forEach(key => {
      categorized[key].sort((a, b) => {
        const priorityOrder = { critical: 0, warning: 1, info: 2 }
        if (priorityOrder[a.type] !== priorityOrder[b.type]) {
          return priorityOrder[a.type] - priorityOrder[b.type]
        }
        const aDays = a.daysRemaining ?? Infinity
        const bDays = b.daysRemaining ?? Infinity
        return aDays - bDays
      })
    })

    return categorized
  }, [])

  const totalAlerts = Object.values(alertsByCategory).reduce((sum, alerts) => sum + alerts.length, 0)

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const alertColors = {
      critical: { bg: '#fee2e2', border: '#ef4444', icon: '🔴', text: '#991b1b' },
      warning: { bg: '#fef3c7', border: '#f59e0b', icon: '🟡', text: '#92400e' },
      info: { bg: '#dbeafe', border: '#3b82f6', icon: '🔵', text: '#1e40af' }
    }
    const colors = alertColors[alert.type]

    return (
      <div
        onClick={() => navigate(`/projects/${alert.project.jan}`)}
        style={{
          padding: '16px',
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 4px 12px ${colors.border}40`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>{colors.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.text,
              marginBottom: '4px'
            }}>
              {alert.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              {alert.message}
            </div>
            {alert.daysRemaining !== null && alert.daysRemaining !== undefined && (
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: colors.text,
                marginTop: '8px',
                padding: '4px 8px',
                background: 'white',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {alert.daysRemaining < 0 
                  ? `${Math.abs(alert.daysRemaining)} days overdue`
                  : `${alert.daysRemaining} days remaining`
                }
              </div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: `1px solid ${colors.border}40`
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}>
            JAN: {alert.project.jan} • {alert.project.clientName}
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: colors.border,
            textTransform: 'uppercase'
          }}>
            {alert.action} →
          </div>
        </div>
      </div>
    )
  }

  const categoryConfig = {
    'bank-guarantee': { title: '🏦 Bank Guarantee Alerts', icon: '🏦' },
    'compliance': { title: '📋 Compliance Alerts', icon: '📋' },
    'due-dates': { title: '📅 Due Dates & Completion', icon: '📅' },
    'missing-docs': { title: '📄 Missing Documents', icon: '📄' },
    'hr-pf': { title: '👥 HR & PF/ESIC Alerts', icon: '👥' }
  }

  // Filter alerts by search query
  const filteredAlertsByCategory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return alertsByCategory

    const filterAlert = (alert: Alert) => {
      const searchableText = [
        alert.title,
        alert.message,
        String(alert.project.jan),
        alert.project.clientName,
        alert.project.workName,
        alert.action ?? ''
      ].join(' ').toLowerCase()
      return searchableText.includes(query)
    }

    const filtered: Record<string, Alert[]> = {
      'bank-guarantee': alertsByCategory['bank-guarantee'].filter(filterAlert),
      'compliance': alertsByCategory['compliance'].filter(filterAlert),
      'due-dates': alertsByCategory['due-dates'].filter(filterAlert),
      'missing-docs': alertsByCategory['missing-docs'].filter(filterAlert),
      'hr-pf': alertsByCategory['hr-pf'].filter(filterAlert)
    }
    return filtered
  }, [alertsByCategory, searchQuery])

  const filteredTotalAlerts = Object.values(filteredAlertsByCategory).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> / <span>Schedule & Timeline</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Schedule & Timeline</h1>
        <p className="page-subtitle">
          {totalAlerts === 0 
            ? 'No active alerts' 
            : searchQuery.trim()
              ? `${filteredTotalAlerts} of ${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''} match your search`
              : `${totalAlerts} active alert${totalAlerts !== 1 ? 's' : ''} requiring attention`
          }
        </p>
      </div>

      {/* Search bar */}
      {totalAlerts > 0 && (
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search alerts by JAN, client, work name, alert title..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white'
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '18px'
            }}
          >
            🔍
          </span>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
                color: 'var(--text-secondary)'
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Severity legend - colors and how dangerous they are */}
      <div
        className="section"
        style={{
          marginBottom: '24px',
          padding: '16px 20px',
          background: 'var(--light)',
          border: '1px solid var(--border)',
          borderRadius: '10px'
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Alert severity guide
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              flex: '1',
              minWidth: '200px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔴</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#991b1b' }}>Critical</div>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>Most urgent — act immediately (expired, overdue)</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              flex: '1',
              minWidth: '200px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🟡</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#92400e' }}>Warning</div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>Needs attention soon (pending, missing items)</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: '#dbeafe',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              flex: '1',
              minWidth: '200px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔵</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e40af' }}>Info</div>
              <div style={{ fontSize: '12px', color: '#2563eb' }}>Monitor — approaching deadlines (30–90 days)</div>
            </div>
          </div>
        </div>
      </div>

      {totalAlerts === 0 ? (
        <div className="section">
          <div className="section-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              All Clear!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              No active alerts at this time. All projects are on track.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Bank Guarantee Section */}
          {filteredAlertsByCategory['bank-guarantee'].length > 0 && (
            <div className="section" style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <div className="section-title">
                  {categoryConfig['bank-guarantee'].icon} Bank Guarantee Alerts ({filteredAlertsByCategory['bank-guarantee'].length})
                </div>
              </div>
              <div className="section-content" style={{ padding: '0' }}>
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                  {filteredAlertsByCategory['bank-guarantee'].map((alert, index) => (
                    <AlertCard key={`bg-${alert.project.jan}-${index}`} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Section */}
          {filteredAlertsByCategory['compliance'].length > 0 && (
            <div className="section" style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <div className="section-title">
                  {categoryConfig['compliance'].icon} Compliance Alerts ({filteredAlertsByCategory['compliance'].length})
                </div>
              </div>
              <div className="section-content" style={{ padding: '0' }}>
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                  {filteredAlertsByCategory['compliance'].map((alert, index) => (
                    <AlertCard key={`compliance-${alert.project.jan}-${index}`} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Due Dates Section */}
          {filteredAlertsByCategory['due-dates'].length > 0 && (
            <div className="section" style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <div className="section-title">
                  {categoryConfig['due-dates'].icon} Due Dates & Completion ({filteredAlertsByCategory['due-dates'].length})
                </div>
              </div>
              <div className="section-content" style={{ padding: '0' }}>
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                  {filteredAlertsByCategory['due-dates'].map((alert, index) => (
                    <AlertCard key={`due-${alert.project.jan}-${index}`} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Missing Documents Section */}
          {filteredAlertsByCategory['missing-docs'].length > 0 && (
            <div className="section" style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <div className="section-title">
                  {categoryConfig['missing-docs'].icon} Missing Documents ({filteredAlertsByCategory['missing-docs'].length})
                </div>
              </div>
              <div className="section-content" style={{ padding: '0' }}>
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                  {filteredAlertsByCategory['missing-docs'].map((alert, index) => (
                    <AlertCard key={`docs-${alert.project.jan}-${index}`} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HR & PF/ESIC Section */}
          {filteredAlertsByCategory['hr-pf'].length > 0 && (
            <div className="section" style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <div className="section-title">
                  {categoryConfig['hr-pf'].icon} HR & PF/ESIC Alerts ({filteredAlertsByCategory['hr-pf'].length})
                </div>
              </div>
              <div className="section-content" style={{ padding: '0' }}>
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                  {filteredAlertsByCategory['hr-pf'].map((alert, index) => (
                    <AlertCard key={`hrpf-${alert.project.jan}-${index}`} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results when searching */}
          {searchQuery.trim() && filteredTotalAlerts === 0 && (
            <div className="section">
              <div className="section-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  No alerts match your search
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Try searching by JAN, client name, work name, or alert title
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
