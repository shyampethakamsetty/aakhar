import type { Project } from '../types/project'

export function exportProjectsToExcel(projects: Project[]) {
  // Create CSV content (can be opened in Excel)
  const headers = [
    'JAN',
    'Client Name',
    'Work Name',
    'Location',
    'Status',
    'Value (Cr)',
    'Start Date',
    'Completion Date',
    'Project Manager',
    'Financial Year'
  ]

  const rows = projects.map(project => [
    project.jan.toString(),
    project.clientName || '',
    project.workName || '',
    `${project.location.city || ''}, ${project.location.state || ''}`.trim(),
    project.status || '',
    ((project.contract.valueInternal || 0) / 10000000).toFixed(2),
    project.dates.startDate || '',
    project.dates.completionDateLatest || project.dates.completionDateOriginal || '',
    project.eic || '',
    project.financialYear || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `projects_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
