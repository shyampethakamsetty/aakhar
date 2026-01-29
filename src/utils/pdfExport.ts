import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Project } from '../types/project'

export function exportProjectsToPDF(projects: Project[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // Main heading - AAkhar constructions
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('AAkhar Constructions', 14, 15)

  // Subtitle
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('All Projects Report', 14, 22)

  // Date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on: ${currentDate}`, 14, 28)
  doc.setTextColor(0, 0, 0)

  // Summary info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Projects: ${projects.length}`, 14, 34)

  // Prepare table data
  const tableData = projects.map((project) => [
    project.jan.toString(),
    project.clientName || '-',
    `${project.location.city || ''}, ${project.location.state || ''}`.trim() || '-',
    project.workName || '-',
    project.status || '-'
  ])

  // Generate table
  autoTable(doc, {
    head: [['JAN', 'Client', 'Location', 'Work Name', 'Status']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { cellWidth: 20 }, // JAN
      1: { cellWidth: 40 }, // Client
      2: { cellWidth: 40 }, // Location
      3: { cellWidth: 80 }, // Work Name
      4: { cellWidth: 40 }  // Status
    },
    margin: { left: 14, right: 14 },
    theme: 'striped'
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
    doc.text(
      'AAkhar Constructions',
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    )
  }

  // Save the PDF
  doc.save(`AAkhar_Projects_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

// Helper function to format currency in Cr (Crores)
function formatCurrency(value: number): string {
  if (!value || value === 0) return '-'
  const crores = value / 10000000 // Convert to crores
  return `₹${crores.toFixed(2)} Cr`
}

// Helper function to format JAN
function formatJAN(jan: number): string {
  const currentYear = new Date().getFullYear()
  return `JAN-${currentYear}-${jan.toString().padStart(3, '0')}`
}

export function exportProjectToPDF(project: Project) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  let yPos = 0

  // Gradient Header Background - Dark blue/purple (#2F4D7B or similar)
  // Since jsPDF doesn't support gradients, we'll use a solid dark blue
  const headerColor = [47, 77, 123] // #2F4D7B - dark blue
  const headerHeight = 25
  
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
  doc.rect(0, yPos, pageWidth, headerHeight, 'F')
  yPos = headerHeight

  // PROJECT SUMMARY title - White, bold, centered
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('PROJECT SUMMARY', pageWidth / 2, 12, { align: 'center' })

  // Work Name subtitle - White, regular, centered
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  const workName = project.workName || 'Project Details'
  doc.text(workName, pageWidth / 2, 18, { align: 'center' })

  // Date/Time stamp (right aligned) - White text on header
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(`${dateStr}, ${timeStr}`, pageWidth - margin, 22, { align: 'right' })
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  yPos += 8

  // Helper function to add section with styled header bar
  const addSection = (title: string, data: Array<[string, string]>) => {
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage()
      yPos = 15
    }

    // Section header bar - Dark blue background (#2F4D7B)
    const sectionHeaderHeight = 8
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    doc.rect(margin, yPos, pageWidth - (margin * 2), sectionHeaderHeight, 'F')
    
    // Section title - White, bold, left-aligned with padding
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(title, margin + 3, yPos + 5.5)
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
    yPos += sectionHeaderHeight + 2

    // Section data as table with alternating rows
    const sectionData = data.map(([label, value]) => [
      label,
      value || '-'
    ])

    autoTable(doc, {
      body: sectionData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineColor: [224, 224, 224], // #E0E0E0 - light gray borders
        lineWidth: 0.5
      },
      columnStyles: {
        0: { 
          cellWidth: 75, 
          fontStyle: 'normal',
          textColor: [102, 102, 102], // #666666 - medium gray for labels
          fillColor: [255, 255, 255] // White background
        },
        1: { 
          cellWidth: 100,
          textColor: [51, 51, 51], // #333333 - dark gray for values
          fillColor: [255, 255, 255] // White background
        }
      },
      margin: { left: margin, right: margin },
      theme: 'plain',
      showHead: false,
      tableLineColor: [224, 224, 224], // #E0E0E0
      tableLineWidth: 0.5,
      alternateRowStyles: {
        fillColor: [240, 240, 240] // #F0F0F0 - very light gray for alternating rows
      },
      didParseCell: function(data: any) {
        // Apply alternating row colors
        if (data.row.index % 2 === 1) {
          // Odd rows get light gray background
          data.cell.styles.fillColor = [240, 240, 240] // #F0F0F0
        } else {
          // Even rows get white background
          data.cell.styles.fillColor = [255, 255, 255] // White
        }
        
        // Keep label column gray, value column dark
        if (data.column.index === 0) {
          data.cell.styles.textColor = [102, 102, 102] // Medium gray for labels
        } else {
          data.cell.styles.textColor = [51, 51, 51] // Dark gray for values
        }
      }
    })

    yPos = (doc as any).lastAutoTable.finalY + 6
  }

  // General Information - matching exact labels from sample PDF
  addSection('General Information', [
    ['Current Status', project.status || '-'],
    ['Tender Reference / NIT & Date', project.tender.referenceNo ? `${project.tender.referenceNo}${project.tender.tenderId ? ' - ' + project.tender.tenderId : ''}` : '-'],
    ['EMD/tender fee Online / Exempted as per MSME bidder', project.compliance.emdStatus || '-'],
    ['EMD / online payment received status', project.compliance.emdPaymentStatus || '-'],
    ['HR required data for HR clearance RA bill released', project.compliance.hrClearance || '-'],
    ['Policy Expired dt./renewal if any', project.compliance.policyExpiry || '-'],
    ['Labour License No./date of reg. & expired dt. / BOCW if any', project.compliance.laborLicense || '-'],
    ['Status of PF/ESIC pending amount for HR clearance Running bills', project.compliance.pfEsicStatus || '-'],
    ['Job Allocation No. (JAN)', formatJAN(project.jan)],
    ['EIC at Aakar', project.extra.eicName || '-']
  ])

  // Client & Location Details - matching sample PDF
  addSection('Client & Location Details', [
    ['Client Name', project.clientName || '-'],
    ['State', project.location.state || '-'],
    ['City/Place', project.location.city || '-'],
    ['Project Location (Client)', project.location.city || '-'],
    ['Name of Work', project.workName || '-']
  ])

  // Contract & Schedule Details - matching sample PDF
  addSection('Contract & Schedule Details', [
    ['LOA / PO Status', project.dates.loaDate ? 'LOA Received' : '-'],
    ['PO/WO/LOA Details', project.extra.poDetails || '-'],
    ['Financial Year', project.financialYear || '-'],
    ['LOA / PO/WO Date', project.dates.loaDate || '-'],
    ['Work Start Date', project.dates.startDate || '-'],
    ['Completion Date as per LOA/PO', project.dates.completionDateOriginal || '-'],
    ['Latest Work Completion Date (as per Time Extension)', project.dates.completionDateLatest || '-'],
    ['Completion Date as per Final Time Extension / Deviation', project.extra.completionDateFinal || '-']
  ])

  // Client Contact Information - matching sample PDF
  addSection('Client Contact Information', [
    ['Client Billing Address', project.clientContact.billingAddress || '-'],
    ['Name of Authorised Person at Client', project.clientContact.name || '-'],
    ['Designation of Authorised Person at Client', project.clientContact.designation || '-'],
    ['Mobile No. of Authorised Person at Client', project.clientContact.mobile || '-'],
    ['Email of Authorised Person at Client', project.clientContact.email || '-'],
    ['Email CC (Client)/C&M', project.clientContact.emailCC || '-']
  ])

  // Commercial Details - matching sample PDF with currency formatting
  addSection('Commercial Details', [
    ['Contract Value Version as per LOI/NOA/LOA/DLOA/PO GST Extra', formatCurrency(project.contract.valueInternal)],
    ['GST Extra / Including', project.contract.gstTerms || '-'],
    ['Updated Contract Value GST Extra', formatCurrency(project.contract.valueUpdated)],
    ['Bank Guarantee Submitted / CPG Not Submitted', project.bankGuarantee.status || '-'],
    ['Bank Guarantee Value', formatCurrency(project.bankGuarantee.value)],
    ['Bank Guarantee Expiry Date', project.bankGuarantee.expiryDate || '-'],
    ['Bank Guarantee Expiry Date (Claim)', project.bankGuarantee.claimDate || '-']
  ])

  // Document References - matching sample PDF
  addSection('Document References', [
    ['Client WO/PO Upload LINK', project.documents.loaLink || '-'],
    ['Client contract agreement LINK', project.documents.agreementLink || '-']
  ])

  // Sub-Contractor Details - matching sample PDF
  const woDetails = project.subcontractor.workOrderNo && project.subcontractor.workOrderDate
    ? `${project.subcontractor.workOrderNo} | ${project.subcontractor.workOrderDate}`
    : (project.subcontractor.workOrderNo || project.subcontractor.workOrderDate || '-')

  addSection('Sub-Contractor Details', [
    ['1st Sub Contractor\'s Name', project.subcontractor.name || '-'],
    ['Proprietor / Auth. Signatory of Sub-Cont', project.subcontractor.proprietor || '-'],
    ['Mobile No. of Sub-Cont. Proprietor / Auth. Signatory\'s', project.subcontractor.mobile || '-'],
    ['Email of Sub-Cont. Proprietor / Auth. Signatory\'s', project.subcontractor.email || '-'],
    ['GSTIN of Sub Contractor', project.subcontractor.gstin || '-'],
    ['WO on % Party', project.subcontractor.workOrderPercent ? `${project.subcontractor.workOrderPercent}%` : '-'],
    ['Work Order No. & Date', woDetails],
    ['Sub-Contractor Work Order (Upload)', project.documents.subWorkOrderLink || '-']
  ])

  // Footer on all pages - matching sample PDF format
  const pageCount = doc.getNumberOfPages()
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Footer text - matching sample PDF
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    
    // Document Generated date (left) - matching sample
    doc.text(`Document Generated: ${generatedDate}`, margin, pageHeight - 10)
    
    // Confidential notice (center) - matching sample
    doc.text('Confidential - For Internal Use Only', pageWidth / 2, pageHeight - 10, { align: 'center' })
    
    // Page number (right) - matching sample
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  // Save the PDF - matching sample filename format
  const fileName = `Project Summary - ${project.clientName || 'Project'} ${project.workName.substring(0, 40) || 'Details'}.pdf`
  doc.save(fileName)
}

export interface FinancialAnalysisData {
  totalOriginalValue: number
  totalUpdatedValue: number
  totalValueIncrease: number
  valueIncreasePercent: number
  avgContractValue: number
  statusBreakdown: Record<string, { count: number; value: number }>
  valueIncreaseProjects: Array<{
    jan: number
    clientName: string
    workName: string
    originalValue: number
    updatedValue: number
    increase: number
    increasePercent: number
  }>
  totalBGValue: number
  bgSubmitted: number
  bgSubmittedValue: number
  bgPendingValue: number
  fyBreakdown: Record<string, { count: number; value: number }>
  totalProjects: number
  filterStatus?: string
  filterFY?: string
}

export function exportFinancialAnalysisToPDF(data: FinancialAnalysisData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  const margin = 14
  let yPos = 20

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Financial Analysis Report', margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, yPos)
  yPos += 6
  if (data.filterStatus || data.filterFY) {
    doc.text(
      `Filters: ${[data.filterStatus && `Status: ${data.filterStatus}`, data.filterFY && `FY: ${data.filterFY}`].filter(Boolean).join(', ')}`,
      margin,
      yPos
    )
    yPos += 6
  }
  doc.setTextColor(0, 0, 0)
  doc.text(`Total projects: ${data.totalProjects}`, margin, yPos)
  yPos += 12

  const addSection = (title: string, rows: Array<[string, string]>) => {
    if (yPos > 260) {
      doc.addPage()
      yPos = 20
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, yPos)
    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    rows.forEach(([label, value]) => {
      doc.text(label, margin, yPos)
      doc.text(value, margin + 80, yPos)
      yPos += 6
    })
    yPos += 6
  }

  const fmt = (n: number) => (n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr` : `₹${n.toLocaleString()}`)

  addSection('Summary', [
    ['Total Original Contract Value', fmt(data.totalOriginalValue)],
    ['Total Updated Contract Value', fmt(data.totalUpdatedValue)],
    ['Total Value Increase', fmt(data.totalValueIncrease)],
    ['Value Increase %', `${data.valueIncreasePercent >= 0 ? '+' : ''}${data.valueIncreasePercent.toFixed(2)}%`],
    ['Average Contract Value', fmt(data.avgContractValue)],
    ['Total BG Value', fmt(data.totalBGValue)],
    ['BG Submitted', fmt(data.bgSubmittedValue)],
    ['BG Pending', fmt(data.bgPendingValue)],
  ])

  addSection(
    'Breakdown by Status',
    Object.entries(data.statusBreakdown).map(([status, d]) => [
      `${status} (${d.count} projects)`,
      fmt(d.value),
    ])
  )

  addSection(
    'Breakdown by Financial Year',
    Object.entries(data.fyBreakdown).map(([fy, d]) => [`${fy} (${d.count} projects)`, fmt(d.value)])
  )

  if (data.valueIncreaseProjects.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Projects with Increased Contract Value', margin, yPos)
    yPos += 10

    const tableData = data.valueIncreaseProjects.map((p) => [
      p.jan.toString(),
      (p.clientName || '-').substring(0, 25),
      fmt(p.originalValue),
      fmt(p.updatedValue),
      `+${fmt(p.increase)} (${p.increasePercent.toFixed(2)}%)`,
    ])
    autoTable(doc, {
      head: [['JAN', 'Client', 'Original', 'Updated', 'Increase']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 55 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 45 },
      },
      margin: { left: margin, right: margin },
    })
    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} - AAKAR Financial Analysis`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  doc.save(`AAKAR_Financial_Analysis_${new Date().toISOString().split('T')[0]}.pdf`)
}
