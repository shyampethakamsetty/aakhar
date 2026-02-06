import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService, normalizeProjectStatus } from '../data/projectData'
import type { Project } from '../types/project'
import { FinancialYearChart } from '../components/charts/FinancialYearChart'
import { ProjectsByStatusChart } from '../components/charts/ProjectsByStatusChart'
import { MonthlyProgressChart } from '../components/charts/MonthlyProgressChart'
import { TopProjectsBarChart } from '../components/charts/TopProjectsBarChart'
import { exportProjectsToExcel } from '../utils/excelExport'

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

// Helper function to format percentage
const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

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
}

export function Dashboard() {
  const navigate = useNavigate()
  
  // Project filtering state
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [itemsPerPage, setItemsPerPage] = useState<number>(9)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedManager, setSelectedManager] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [minValue, setMinValue] = useState<number>(0)
  const [maxValue, setMaxValue] = useState<number>(50)
  
  const stats = useMemo(() => {
    const projects = projectService.getAllProjects()
    const totalValue = projectService.getTotalContractValue()
    const totalProjects = projects.length

    // Status counts and values - normalize raw statuses to 4 categories
    const ongoingProjects = projects.filter(p => normalizeProjectStatus(p.status) === 'ongoing')
    const completedProjectsList = projects.filter(p => normalizeProjectStatus(p.status) === 'completed')
    const ongoing = ongoingProjects.length
    const completed = completedProjectsList.length
    const totalValueOngoing = ongoingProjects.reduce((s, p) => s + (p.contract?.valueInternal || 0), 0)
    const totalValueCompleted = completedProjectsList.reduce((s, p) => s + (p.contract?.valueInternal || 0), 0)

    // Calculate on-time delivery percentage and value
    // A project is "on-time" if it was completed on or before the original completion date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all projects that have an original completion date (the deadline)
    const projectsWithOriginalDate = projects.filter(p => {
      return p.dates.completionDateOriginal &&
             p.dates.completionDateOriginal.trim() !== '' &&
             p.dates.completionDateOriginal.toLowerCase() !== 'nil'
    })

    let completedProjects = 0
    let onTimeProjects = 0
    let delayedProjects = 0
    let totalValueOnTime = 0
    let totalValueDelayed = 0

    projectsWithOriginalDate.forEach(p => {
      const originalDate = parseDate(p.dates.completionDateOriginal)
      if (!originalDate) return

      const origDate = new Date(originalDate)
      origDate.setHours(0, 0, 0, 0)

      // Check if project is completed (by status or by date)
      const status = p.status.toLowerCase()
      const isCompletedByStatus = status.includes('complete') || status.includes('completed')

      // Determine actual completion date
      let actualCompletionDate: Date | null = null

      // First, check if there's a latest completion date
      if (p.dates.completionDateLatest) {
        const latestDate = parseDate(p.dates.completionDateLatest)
        if (latestDate) {
          const latDate = new Date(latestDate)
          latDate.setHours(0, 0, 0, 0)

          // If latest date has passed or project is marked completed, use latest date
          if (latDate <= today || isCompletedByStatus) {
            actualCompletionDate = latDate
          }
        }
      }

      // If no latest date but project is marked completed, use original date as completion
      if (!actualCompletionDate && isCompletedByStatus) {
        if (origDate <= today) {
          actualCompletionDate = origDate
        }
      }

      // If we have an actual completion date, the project is completed
      if (actualCompletionDate) {
        completedProjects++

        // Check if completed on or before original date (on-time)
        if (actualCompletionDate <= origDate) {
          onTimeProjects++
          totalValueOnTime += p.contract?.valueInternal || 0
        } else {
          // Delayed: completed after original date
          delayedProjects++
          totalValueDelayed += p.contract?.valueInternal || 0
        }
      }
    })

    // Calculate percentage: (on-time projects / completed projects) * 100
    const onTimeDelivery = completedProjects > 0
      ? Math.round((onTimeProjects / completedProjects) * 100)
      : 0

    return {
      totalValue,
      totalValueOngoing,
      totalValueCompleted,
      totalValueOnTime,
      totalValueDelayed,
      totalProjects,
      ongoing,
      completed,
      delayed: delayedProjects,
      onTimeDelivery
    }
  }, [])

  // Financial Overview Data
  const financialData = useMemo(() => {
    const projects = projectService.getAllProjects()
    
    // Total contract values
    const totalOriginalValue = projects.reduce((sum, p) => sum + p.contract.valueInternal, 0)
    const totalUpdatedValue = projects.reduce((sum, p) => sum + p.contract.valueUpdated, 0)
    const totalValueIncrease = totalUpdatedValue - totalOriginalValue
    const valueIncreasePercent = totalOriginalValue > 0 
      ? ((totalValueIncrease / totalOriginalValue) * 100) 
      : 0
    const avgContractValue = projects.length > 0 ? totalOriginalValue / projects.length : 0

    // Status breakdown
    const statusBreakdown = projects.reduce((acc, p) => {
      const status = p.status || 'Not Specified'
      // Normalize status for grouping
      let normalizedStatus = status
      if (status.toLowerCase().includes('progress') || status.toLowerCase().includes('ongoing')) {
        normalizedStatus = 'In Progress'
      } else if (status.toLowerCase().includes('complete')) {
        normalizedStatus = 'Completed'
      } else if (status.toLowerCase().includes('pending')) {
        normalizedStatus = 'Pending'
      }
      
      if (!acc[normalizedStatus]) {
        acc[normalizedStatus] = { count: 0, value: 0 }
      }
      acc[normalizedStatus].count++
      acc[normalizedStatus].value += p.contract.valueInternal
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    // Projects with value increase
    const projectsWithIncrease = projects.filter(p => 
      p.contract.valueUpdated > p.contract.valueInternal
    )
    const valueIncreaseProjects = projectsWithIncrease.map(p => ({
      jan: p.jan,
      clientName: p.clientName,
      workName: p.workName,
      originalValue: p.contract.valueInternal,
      updatedValue: p.contract.valueUpdated,
      increase: p.contract.valueUpdated - p.contract.valueInternal,
      increasePercent: p.contract.valueInternal > 0 
        ? ((p.contract.valueUpdated - p.contract.valueInternal) / p.contract.valueInternal) * 100 
        : 0
    })).sort((a, b) => b.increase - a.increase)

    // Bank Guarantee Summary
    const totalBGValue = projects.reduce((sum, p) => sum + p.bankGuarantee.value, 0)
    const bgSubmitted = projects.filter(p => 
      p.bankGuarantee.status && 
      p.bankGuarantee.status.toLowerCase().includes('submitted')
    )
    const bgPending = projects.filter(p => 
      !p.bankGuarantee.status || 
      !p.bankGuarantee.status.toLowerCase().includes('submitted')
    )
    const bgSubmittedValue = bgSubmitted.reduce((sum, p) => sum + p.bankGuarantee.value, 0)
    const bgPendingValue = bgPending.reduce((sum, p) => sum + p.bankGuarantee.value, 0)

    // Top 5 projects by value
    const topProjects = [...projects]
      .sort((a, b) => b.contract.valueInternal - a.contract.valueInternal)
      .slice(0, 5)
      .map(p => ({
        jan: p.jan,
        clientName: p.clientName,
        workName: p.workName,
        value: p.contract.valueInternal,
        status: p.status
      }))

    // Financial Year Breakdown
    const fyBreakdown = projects.reduce((acc, p) => {
      const fy = p.financialYear || 'Not Specified'
      if (!acc[fy]) {
        acc[fy] = { count: 0, value: 0 }
      }
      acc[fy].count++
      acc[fy].value += p.contract.valueInternal
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    const fyChartData = Object.entries(fyBreakdown).map(([year, data]) => ({
      year,
      value: data.value,
      count: data.count
    }))

    return {
      totalOriginalValue,
      totalUpdatedValue,
      totalValueIncrease,
      valueIncreasePercent,
      avgContractValue,
      statusBreakdown,
      valueIncreaseProjects,
      totalBGValue,
      bgSubmitted: bgSubmitted.length,
      bgPending: bgPending.length,
      bgSubmittedValue,
      bgPendingValue,
      topProjects,
      fyChartData
    }
  }, [])

  // Critical Alerts & Notifications (used for future Alerts UI)
  const alerts = useMemo(() => {
    const projects = projectService.getAllProjects()
    const alertList: Alert[] = []

    projects.forEach((project) => {
      // 1. Bank Guarantee expiry alerts (30/60/90 days)
      if (project.bankGuarantee.expiryDate) {
        const bgExpiryDate = parseDate(project.bankGuarantee.expiryDate)
        if (bgExpiryDate) {
          const daysRemaining = daysUntil(bgExpiryDate)
          if (daysRemaining !== null) {
            if (daysRemaining < 0) {
              alertList.push({
                type: 'critical',
                title: 'Bank Guarantee Expired',
                message: `BG for project ${project.jan} (${project.clientName}) expired ${Math.abs(daysRemaining)} day(s) ago`,
                project,
                daysRemaining,
                action: 'Renew immediately'
              })
            } else if (daysRemaining <= 30) {
              alertList.push({
                type: 'critical',
                title: 'Bank Guarantee Expiring Soon',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Renew now'
              })
            } else if (daysRemaining <= 60) {
              alertList.push({
                type: 'warning',
                title: 'Bank Guarantee Expiring',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Plan renewal'
              })
            } else if (daysRemaining <= 90) {
              alertList.push({
                type: 'info',
                title: 'Bank Guarantee Expiring',
                message: `BG for project ${project.jan} (${project.clientName}) expires in ${daysRemaining} day(s)`,
                project,
                daysRemaining,
                action: 'Monitor'
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
            alertList.push({
              type: alertType,
              title: daysRemaining < 0 ? 'Policy Expired' : 'Policy Expiring',
              message: `Policy for project ${project.jan} (${project.clientName}) ${daysRemaining < 0 ? `expired ${Math.abs(daysRemaining)} day(s) ago` : `expires in ${daysRemaining} day(s)`}`,
              project,
              daysRemaining,
              action: daysRemaining < 0 ? 'Renew immediately' : 'Renew soon'
            })
          }
        }
      }

      // Labour License Expiry (extract date from string if possible)
      if (project.compliance.laborLicense) {
        // Try to extract date from the license string
        const dateMatch = project.compliance.laborLicense.match(/\d{4}-\d{2}-\d{2}/)
        if (dateMatch) {
          const licenseDate = parseDate(dateMatch[0])
          if (licenseDate) {
            const daysRemaining = daysUntil(licenseDate)
            if (daysRemaining !== null && daysRemaining <= 90) {
              const alertType = daysRemaining < 0 ? 'critical' : daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'info'
              alertList.push({
                type: alertType,
                title: daysRemaining < 0 ? 'Labour License Expired' : 'Labour License Expiring',
                message: `Labour License for project ${project.jan} (${project.clientName}) ${daysRemaining < 0 ? `expired ${Math.abs(daysRemaining)} day(s) ago` : `expires in ${daysRemaining} day(s)`}`,
                project,
                daysRemaining,
                action: daysRemaining < 0 ? 'Renew immediately' : 'Renew soon'
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
            alertList.push({
              type: 'info',
              title: 'Project Approaching Completion',
              message: `Project ${project.jan} (${project.clientName}) is completing in ${daysRemaining} day(s)`,
              project,
              daysRemaining,
              action: 'Review status'
            })
          }
        }
      }

      // 4. Projects overdue for completion
      if (project.dates.completionDateLatest) {
        const completionDate = parseDate(project.dates.completionDateLatest)
        if (completionDate && isOverdue(completionDate)) {
          const daysOverdue = daysUntil(completionDate)
          alertList.push({
            type: 'critical',
            title: 'Project Overdue',
            message: `Project ${project.jan} (${project.clientName}) is ${daysOverdue ? Math.abs(daysOverdue) : 'overdue'} day(s) overdue`,
            project,
            daysRemaining: daysOverdue,
            action: 'Take action'
          })
        }
      }

      // 5. Missing documents
      if (!project.documents.loaLink || project.documents.loaLink.trim() === '') {
        alertList.push({
          type: 'warning',
          title: 'Missing LOA Document',
          message: `Project ${project.jan} (${project.clientName}) is missing LOA/PO upload link`,
          project,
          action: 'Upload document'
        })
      }

      if (!project.documents.agreementLink || project.documents.agreementLink.trim() === '' || project.documents.agreementLink.toLowerCase().includes('not found')) {
        alertList.push({
          type: 'warning',
          title: 'Missing Agreement Document',
          message: `Project ${project.jan} (${project.clientName}) is missing contract agreement link`,
          project,
          action: 'Upload document'
        })
      }

      // 6. HR clearance pending projects
      if (!project.compliance.hrClearance || project.compliance.hrClearance.trim() === '' || project.compliance.hrClearance.toLowerCase().includes('pending')) {
        alertList.push({
          type: 'warning',
          title: 'HR Clearance Pending',
          message: `Project ${project.jan} (${project.clientName}) has pending HR clearance`,
          project,
          action: 'Complete clearance'
        })
      }

      // 7. PF/ESIC pending projects
      if (!project.compliance.pfEsicStatus || project.compliance.pfEsicStatus.trim() === '' || project.compliance.pfEsicStatus.toLowerCase().includes('pending')) {
        alertList.push({
          type: 'warning',
          title: 'PF/ESIC Pending',
          message: `Project ${project.jan} (${project.clientName}) has pending PF/ESIC status`,
          project,
          action: 'Resolve pending'
        })
      }
    })

    // Sort alerts by priority: critical first, then by days remaining
    return alertList.sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, info: 2 }
      if (priorityOrder[a.type] !== priorityOrder[b.type]) {
        return priorityOrder[a.type] - priorityOrder[b.type]
      }
      const aDays = a.daysRemaining ?? Infinity
      const bDays = b.daysRemaining ?? Infinity
      return aDays - bDays
    })
  }, [])
  void alerts // reserved for Alerts UI

  // Analytics & Insights Data
  const analyticsData = useMemo(() => {
    const projects = projectService.getAllProjects()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Status breakdown for donut chart - normalize raw statuses to 4 categories
    let ongoing = 0
    let completed = 0
    let delayed = 0
    let stopped = 0

    projects.forEach(p => {
      const normalized = normalizeProjectStatus(p.status)
      switch (normalized) {
        case 'ongoing':
          ongoing++
          break
        case 'completed':
          completed++
          break
        case 'delayed':
          delayed++
          break
        case 'stopped':
          stopped++
          break
      }
    })

    // Monthly Progress Data
    // Generate months from Jul 2025 to Jan 2026 (or based on actual data range)
    const monthLabels = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26']
    const monthlyData: { month: string; completed: number; started: number }[] = []

    monthLabels.forEach((monthLabel) => {
      // Calculate month/year from label (e.g., "Jul 25" -> July 2025)
      const year = monthLabel.includes('25') ? 2025 : 2026
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthLabel.split(' ')[0]
      const monthIndex = monthNames.indexOf(monthName)
      
      if (monthIndex === -1) return

      const monthStart = new Date(year, monthIndex, 1)
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)

      // Count projects completed in this month
      const completedInMonth = projects.filter(p => {
        const status = p.status.toLowerCase()
        const isCompleted = status.includes('complete') || status.includes('completed')
        
        if (!isCompleted) return false

        // Check completion date
        const completionDate = parseDate(p.dates.completionDateLatest) || parseDate(p.dates.completionDateOriginal)
        if (!completionDate) return false

        const compDate = new Date(completionDate)
        compDate.setHours(0, 0, 0, 0)
        return compDate >= monthStart && compDate <= monthEnd
      }).length

      // Count projects started in this month
      const startedInMonth = projects.filter(p => {
        const startDate = parseDate(p.dates.startDate) || parseDate(p.dates.loaDate)
        if (!startDate) return false

        const sDate = new Date(startDate)
        sDate.setHours(0, 0, 0, 0)
        return sDate >= monthStart && sDate <= monthEnd
      }).length

      monthlyData.push({
        month: monthLabel,
        completed: completedInMonth,
        started: startedInMonth
      })
    })

    // Top 5 Projects by Value (reuse from financialData)
    const topProjects = [...projects]
      .sort((a, b) => b.contract.valueInternal - a.contract.valueInternal)
      .slice(0, 5)
      .map(p => ({
        jan: p.jan,
        clientName: p.clientName,
        workName: p.workName,
        value: p.contract.valueInternal,
        status: p.status
      }))

    return {
      statusData: {
        ongoing,
        completed,
        delayed,
        stopped
      },
      monthlyProgress: monthlyData,
      topProjects
    }
  }, [])

  // Get all projects for filtering
  const allProjectsForFilter = useMemo(() => projectService.getAllProjects(), [])

  // Get unique values for dropdowns
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>()
    allProjectsForFilter.forEach(p => {
      if (p.clientName) clients.add(p.clientName)
    })
    return Array.from(clients).sort()
  }, [allProjectsForFilter])

  const uniqueManagers = useMemo(() => {
    const managers = new Set<string>()
    allProjectsForFilter.forEach(p => {
      if (p.extra?.eicName) managers.add(p.extra.eicName)
    })
    return Array.from(managers).sort()
  }, [allProjectsForFilter])

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    allProjectsForFilter.forEach(p => {
      const loc = `${p.location.city || ''}, ${p.location.state || ''}`.trim()
      if (loc) locations.add(loc)
    })
    return Array.from(locations).sort()
  }, [allProjectsForFilter])

  // Filter projects based on all criteria
  const filteredProjects = useMemo(() => {
    let filtered = [...allProjectsForFilter]

    // Status filter - use normalized status (ongoing, completed, delayed, stopped)
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(p => normalizeProjectStatus(p.status) === selectedStatusFilter)
    }

    // Client filter
    if (selectedClient !== 'all') {
      filtered = filtered.filter(p => p.clientName === selectedClient)
    }

    // Manager filter
    if (selectedManager !== 'all') {
      filtered = filtered.filter(p => p.extra?.eicName === selectedManager)
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(p => {
        const loc = `${p.location.city || ''}, ${p.location.state || ''}`.trim()
        return loc === selectedLocation
      })
    }

    // Value range filter
    filtered = filtered.filter(p => {
      const valueInCr = (p.contract.valueInternal || 0) / 10000000
      return valueInCr >= minValue && valueInCr <= maxValue
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          const dateA = parseDate(a.dates.loaDate || a.dates.startDate || '') || new Date(0)
          const dateB = parseDate(b.dates.loaDate || b.dates.startDate || '') || new Date(0)
          return dateB.getTime() - dateA.getTime()
        case 'date-asc':
          const dateA2 = parseDate(a.dates.loaDate || a.dates.startDate || '') || new Date(0)
          const dateB2 = parseDate(b.dates.loaDate || b.dates.startDate || '') || new Date(0)
          return dateA2.getTime() - dateB2.getTime()
        case 'value-desc':
          return (b.contract.valueInternal || 0) - (a.contract.valueInternal || 0)
        case 'value-asc':
          return (a.contract.valueInternal || 0) - (b.contract.valueInternal || 0)
        case 'name-asc':
          return (a.workName || '').localeCompare(b.workName || '')
        case 'name-desc':
          return (b.workName || '').localeCompare(a.workName || '')
        default:
          return 0
      }
    })

    return filtered
  }, [allProjectsForFilter, selectedStatusFilter, selectedClient, selectedManager, selectedLocation, selectedTag, minValue, maxValue, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  const handleClearFilters = () => {
    setSelectedStatusFilter('all')
    setSelectedClient('all')
    setSelectedManager('all')
    setSelectedLocation('all')
    setSelectedTag('all')
    setMinValue(0)
    setMaxValue(50)
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase().trim()
    switch (s) {
      case 'ongoing':
        return '#10b981' // Green
      case 'completed':
        return '#3b82f6' // Blue
      case 'delayed':
        return '#ef4444' // Red
      case 'stopped':
        return '#6b7280' // Gray
      default:
        return '#6b7280' // Gray (default)
    }
  }

  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Dashboard</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Project Dashboard</h1>
        <p className="page-subtitle">Overview of All {stats.totalProjects} Projects</p>
      </div>

      {/* Top Dashboard Cards Section */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        {/* Total Projects Card */}
        <div 
          className="stat-card blue"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/projects')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/projects')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-value">{stats.totalProjects}</div>
              <div className="stat-label">Total Projects</div>
              <div className="stat-label" style={{ marginTop: 4, fontSize: 13 }}>
                {(() => { const v = Number(stats.totalValue) || 0; return v === 0 ? '0.00' : (v / 10000000).toFixed(2); })()} Cr total value
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📁
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="stat-card-arrow" style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
          </div>
        </div>

        {/* Ongoing Projects Card */}
        <div 
          className="stat-card green"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/projects?filter=ongoing')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/projects?filter=ongoing')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-value">{stats.ongoing}</div>
              <div className="stat-label">Ongoing Projects</div>
              <div className="stat-label" style={{ marginTop: 4, fontSize: 13 }}>
                {(() => { const v = Number(stats.totalValueOngoing) || 0; return v === 0 ? '0.00' : (v / 10000000).toFixed(2); })()} Cr total value
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🚧
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="stat-card-arrow" style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
          </div>
        </div>

        {/* Completed Projects Card */}
        <div 
          className="stat-card purple"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/projects?filter=completed')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/projects?filter=completed')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed Projects</div>
              <div className="stat-label" style={{ marginTop: 4, fontSize: 13 }}>
                {(() => { const v = Number(stats.totalValueCompleted) || 0; return v === 0 ? '0.00' : (v / 10000000).toFixed(2); })()} Cr total value
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✅
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="stat-card-arrow" style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
          </div>
        </div>

        {/* Total Value Card */}
        <div 
          className="stat-card orange"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/total-value')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/total-value')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-value">
                {(() => {
                  const val = Number(stats.totalValue) || 0
                  if (val === 0) return '0.00'
                  const cr = val / 10000000
                  return cr.toFixed(2)
                })()} Cr
              </div>
              <div className="stat-label">Total projects value</div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              💰
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="stat-card-arrow" style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
          </div>
        </div>

        {/* On-Time Delivery Card */}
        <div 
          className="stat-card red"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/projects?filter=on-time')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/projects?filter=on-time')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-value">{stats.onTimeDelivery}%</div>
              <div className="stat-label">On-Time Delivery</div>
              <div className="stat-label" style={{ marginTop: 4, fontSize: 13 }}>
                {(() => { const v = Number(stats.totalValueOnTime) || 0; return v === 0 ? '0.00' : (v / 10000000).toFixed(2); })()} Cr total value
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📊
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="stat-card-arrow" style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
          </div>
        </div>

        {/* Delayed Projects Card */}
        <div 
          className="stat-card yellow"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/projects?filter=delayed')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/projects?filter=delayed')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div className="stat-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-value">{stats.delayed}</div>
              <div className="stat-label">Delayed Projects</div>
              <div className="stat-label" style={{ marginTop: 4, fontSize: 13 }}>
                {(() => { const v = Number(stats.totalValueDelayed) || 0; return v === 0 ? '0.00' : (v / 10000000).toFixed(2); })()} Cr total value
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏳
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="stat-card-arrow" style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>→</span>
          </div>
        </div>
      </div>

      {/* Analytics & Insights Section */}
      <div className="section" style={{ marginBottom: '32px' }}>
        <div className="section-header">
          <div className="section-title">
            📊 Analytics & Insights
          </div>
        </div>
        <div className="section-content">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Projects by Status - Donut Chart */}
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Projects by Status
              </h3>
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProjectsByStatusChart data={analyticsData.statusData} />
              </div>
            </div>

            {/* Monthly Progress - Line Chart */}
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Monthly Progress
              </h3>
              <div style={{ minHeight: '300px' }}>
                <MonthlyProgressChart data={analyticsData.monthlyProgress} />
              </div>
            </div>
          </div>

          {/* Top 5 Projects by Value - Horizontal Bar Chart */}
          <div style={{
            padding: '20px',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px'
          }}>
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginBottom: '16px', 
              color: 'var(--text-primary)'
            }}>
              Top 5 Projects by Value
            </h3>
            <div style={{ height: '280px', width: '100%' }}>
              <TopProjectsBarChart projects={analyticsData.topProjects} />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Widgets - HIDDEN */}
      {false && (
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            💰 Financial Overview
          </div>
        </div>
        <div className="section-content">
          {/* Total Contract Value with Status Breakdown */}
          <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              marginBottom: '24px', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              Total Contract Value
            </h3>
            <div className="info-grid" style={{ marginBottom: '24px' }}>
              <div className="info-item" style={{ padding: '20px', background: 'var(--light)', borderRadius: '10px' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total Original Value
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalOriginalValue)}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total Updated Value
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalUpdatedValue)}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total Value Increase
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalValueIncrease)}
                </div>
                <div style={{ fontSize: '14px', color: '#10b981', marginTop: '4px', fontWeight: '600' }}>
                  {formatPercent(financialData.valueIncreasePercent)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Breakdown by Status
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '16px'
              }}>
                {Object.entries(financialData.statusBreakdown).map(([status, data]) => (
                  <div key={status} style={{
                    padding: '20px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                      {status}
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.2' }}>
                      {formatCurrency(data.value)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      {data.count} project{data.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value Increase Tracker - max 6 projects */}
          {financialData.valueIncreaseProjects.length > 0 && (
            <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    marginBottom: '8px', 
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em'
                  }}>
                    Projects with Value Increase
                  </h3>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {financialData.valueIncreaseProjects.length} / {stats.totalProjects} projects with increased contract value (showing max 6)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/value-increase')}
                  className="btn btn-primary"
                  style={{ flexShrink: 0 }}
                >
                  View All Projects →
                </button>
              </div>
              <div style={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
              }}>
                {financialData.valueIncreaseProjects.slice(0, 6).map((project) => (
                  <div
                    key={project.jan}
                    onClick={() => navigate(`/projects/${project.jan}`)}
                    style={{
                      padding: '20px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
                      e.currentTarget.style.borderColor = 'var(--primary-color)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)', 
                      marginBottom: '6px',
                      lineHeight: '1.4'
                    }}>
                      JAN {project.jan}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)', 
                      marginBottom: '12px',
                      fontWeight: '500'
                    }}>
                      {project.clientName}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      {project.workName.length > 60 ? `${project.workName.substring(0, 60)}...` : project.workName}
                    </div>
                    <div style={{ 
                      padding: '12px', 
                      background: 'var(--light)', 
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Original Value:</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {formatCurrency(project.originalValue)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Updated Value:</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>
                          {formatCurrency(project.updatedValue)}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.1))',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <div style={{ fontSize: '12px', color: '#059669', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Increase
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981', lineHeight: '1.3' }}>
                        +{formatCurrency(project.increase)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                        {formatPercent(project.increasePercent)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Guarantee Summary */}
          <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              marginBottom: '24px', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              Bank Guarantee Summary
            </h3>
            <div className="info-grid" style={{ marginBottom: '24px' }}>
              <div className="info-item" style={{ padding: '20px', background: 'var(--light)', borderRadius: '10px' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Total BG Value
                </div>
                <div className="info-value highlight" style={{ fontSize: '24px', fontWeight: '700', lineHeight: '1.2' }}>
                  {formatCurrency(financialData.totalBGValue)}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Submitted
                </div>
                <div className="info-value" style={{ fontSize: '22px', fontWeight: '700', color: '#10b981', lineHeight: '1.2', marginBottom: '6px' }}>
                  {formatCurrency(financialData.bgSubmittedValue)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {financialData.bgSubmitted} project{financialData.bgSubmitted !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="info-item" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="info-label" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                  Pending
                </div>
                <div className="info-value" style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b', lineHeight: '1.2', marginBottom: '6px' }}>
                  {formatCurrency(financialData.bgPendingValue)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {financialData.bgPending} project{financialData.bgPending !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Submission Progress
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {financialData.totalBGValue > 0 
                    ? `${((financialData.bgSubmittedValue / financialData.totalBGValue) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                background: 'var(--light)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  height: '100%',
                  width: financialData.totalBGValue > 0 
                    ? `${(financialData.bgSubmittedValue / financialData.totalBGValue) * 100}%` 
                    : '0%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.5s ease',
                  borderRadius: '6px'
                }} />
              </div>
            </div>
          </div>

          {/* Average Contract Value & Top 5 Projects */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '24px',
            marginBottom: '40px',
            paddingBottom: '32px',
            borderBottom: '2px solid var(--border)'
          }}>
            {/* Average Contract Value */}
            <div style={{
              padding: '32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ fontSize: '15px', opacity: 0.95, marginBottom: '12px', fontWeight: '500', letterSpacing: '0.3px' }}>
                Average Contract Value
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.2' }}>
                {formatCurrency(financialData.avgContractValue)}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>
                Across {stats.totalProjects} project{stats.totalProjects !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Top 5 Projects by Value */}
            <div style={{
              padding: '24px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Top 5 Projects by Value
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {financialData.topProjects.map((project, index) => (
                  <div
                    key={project.jan}
                    onClick={() => navigate(`/projects/${project.jan}`)}
                    style={{
                      padding: '16px',
                      background: 'var(--light)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e8f0'
                      e.currentTarget.style.borderColor = 'var(--primary-color)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--light)'
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          JAN {project.jan}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '40px', fontWeight: '500', lineHeight: '1.4' }}>
                        {project.clientName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '4px', lineHeight: '1.2' }}>
                        {formatCurrency(project.value)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {project.status.length > 25 ? `${project.status.substring(0, 25)}...` : project.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Year Breakdown Chart */}
          {financialData.fyChartData.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '24px', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Financial Year Breakdown
              </h3>
              <FinancialYearChart data={financialData.fyChartData} />
            </div>
          )}
        </div>
      </div>
      )}

      {/* Projects Filtering & Display Section */}
      <div className="section" style={{ marginTop: '32px' }}>
        <div className="section-header">
          <div className="section-title">📁 Projects</div>
        </div>
        <div className="section-content" style={{ padding: 0 }}>
          {/* Filter Panel */}
          <div style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            {/* Top Row: View Mode & Status Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>View:</span>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--light)', padding: '4px', borderRadius: '8px' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent',
                      color: viewMode === 'grid' ? 'white' : 'var(--text-primary)',
                      fontWeight: viewMode === 'grid' ? '600' : '400'
                    }}
                  >
                    ⬜ Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent',
                      color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
                      fontWeight: viewMode === 'list' ? '600' : '400'
                    }}
                  >
                    ☰ List
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: viewMode === 'compact' ? 'var(--primary-color)' : 'transparent',
                      color: viewMode === 'compact' ? 'white' : 'var(--text-primary)',
                      fontWeight: viewMode === 'compact' ? '600' : '400'
                    }}
                  >
                    ⚬ Compact
                  </button>
                </div>
                <button
                  onClick={() => setSelectedStatusFilter('all')}
                  style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    background: selectedStatusFilter === 'all' ? 'var(--primary-color)' : 'white',
                    color: selectedStatusFilter === 'all' ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: selectedStatusFilter === 'all' ? '600' : '400'
                  }}
                >
                  All
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => exportProjectsToExcel(filteredProjects)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📥 Export Excel
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { key: 'ongoing', label: 'Ongoing', color: '#10b981' },
                { key: 'completed', label: 'Completed', color: '#3b82f6' },
                { key: 'delayed', label: 'Delayed', color: '#ef4444' },
                { key: 'stopped', label: 'Stopped', color: '#6b7280' }
              ].map(status => (
                <button
                  key={status.key}
                  onClick={() => setSelectedStatusFilter(status.key)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '20px',
                    background: selectedStatusFilter === status.key ? status.color : 'var(--light)',
                    color: selectedStatusFilter === status.key ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: selectedStatusFilter === status.key ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: selectedStatusFilter === status.key ? 'white' : status.color
                  }} />
                  {status.label}
                </button>
              ))}
            </div>

            {/* Sort & Show Controls */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    minWidth: '180px'
                  }}
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="value-desc">Value (High to Low)</option>
                  <option value="value-asc">Value (Low to High)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  <option value={6}>6 per page</option>
                  <option value={9}>9 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={18}>18 per page</option>
                  <option value={24}>24 per page</option>
                </select>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value)
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Clients</option>
                  {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Project Manager</label>
                <select
                  value={selectedManager}
                  onChange={(e) => {
                    setSelectedManager(e.target.value)
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Managers</option>
                  {uniqueManagers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value)
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Tags</label>
                <select
                  value={selectedTag}
                  onChange={(e) => {
                    setSelectedTag(e.target.value)
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Tags</option>
                </select>
              </div>
            </div>

            {/* Value Range Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Min Value (Cr)</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => {
                    setMinValue(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '120px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Max Value (Cr)</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => {
                    setMaxValue(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '120px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          {paginatedProjects.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {paginatedProjects.map(project => {
                  const valueInCr = ((project.contract.valueInternal || 0) / 10000000).toFixed(2)
                  const statusColor = getStatusColor(project.status)
                  
                  return (
                    <div
                      key={project.jan}
                      onClick={() => navigate(`/projects/${project.jan}`)}
                      style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                        e.currentTarget.style.borderColor = 'var(--primary-color)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '12px',
                          background: statusColor,
                          color: 'white'
                        }}>
                          {project.status.length > 20 ? project.status.substring(0, 20) + '...' : project.status}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        lineHeight: '1.4'
                      }}>
                        {project.workName}
                      </h3>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginBottom: '12px',
                        fontWeight: '500'
                      }}>
                        {project.clientName ? `${project.clientName} · ` : ''}JAN-{project.jan}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--primary-color)'
                      }}>
                        ₹{valueInCr} Cr
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '24px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    ‹ Prev
                  </button>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', padding: '0 12px' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    Next ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                No projects match your filters
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Try adjusting your filters or clearing them to see all projects
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

