import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectService } from '../data/projectData'
import type { Project } from '../types/project'
import { exportProjectToPDF } from '../utils/pdfExport'

// Helper for table rows
const DetailRow = ({
    label,
    value,
    onChange,
    isEditing,
    type = 'text'
}: {
    label: string,
    value: string | number | undefined,
    onChange: (val: string) => void,
    isEditing: boolean,
    type?: string
}) => {
    return (
        <tr>
            <th>{label}</th>
            <td>
                {isEditing ? (
                    <input
                        type={type}
                        className="search-input"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ width: '100%', padding: '4px 8px' }}
                    />
                ) : (
                    <span style={{ fontWeight: 500 }}>{value || '-'}</span>
                )}
            </td>
        </tr>
    )
}

export function ProjectDetails() {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState<Project | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Project | null>(null)
    const isNew = !projectId || projectId === 'new' // Check if creating new

    useEffect(() => {
        if (isNew) {
            // Initialize empty project
            const empty = projectService.getEmptyProject()
            setProject(empty)
            setFormData(empty)
            setIsEditing(true) // Default to edit mode for new projects
        } else if (projectId) {
            const p = projectService.getProjectByJan(parseInt(projectId))
            if (p) {
                setProject(p)
                setFormData(p)
            }
        }
    }, [projectId, isNew])

    if (!project || !formData) {
        return <div className="content">Loading...</div>
    }

    const handleSave = () => {
        // In a real app, validation and API call would happen here
        if (isNew) {
            alert('New Project Created! (Stored in local state only for demo)')
            // Could redirect to the list or staying
            navigate('/projects')
        } else {
            setProject(formData)
            setIsEditing(false)
            alert('Changes saved to local view')
        }
    }

    const updateField = (updater: (prev: Project) => Project) => {
        setFormData(prev => prev ? updater(prev) : null)
    }

    return (
        <div className="content">
            <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                    style={{ padding: '6px 12px', fontSize: '13px', marginRight: '4px' }}
                >
                    ← Back
                </button>
                <span style={{ color: 'var(--text-secondary)' }}>|</span>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a> /
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/projects'); }}>Projects</a> /
                <span>{isNew ? 'New Project' : project.jan}</span>
            </div>

            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 className="page-title">{isNew ? 'Create New Project' : project.workName}</h1>
                        {!isNew && (
                            <p className="page-subtitle">JAN: {project.jan} | <span style={{ color: 'var(--primary-color)' }}>{project.clientName}</span> | {project.location.city}</p>
                        )}
                    </div>
                    <div>
                        {isEditing ? (
                            <div className="section-actions">
                                <button className="btn btn-secondary" onClick={() => isNew ? navigate('/projects') : setIsEditing(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave}>{isNew ? 'Create Project' : 'Save Changes'}</button>
                            </div>
                        ) : (
                            <div className="section-actions">
                                <button className="btn btn-secondary" onClick={() => exportProjectToPDF(project)}>📥 Export PDF</button>
                                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>✏️ Edit Project</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="section-grid-2">
                {/* Project Overview */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">ℹ️ Project Overview</div>
                    </div>
                    <div className="section-content" style={{ padding: 0 }}>
                        <table className="details-table">
                            <tbody>
                                <DetailRow label="JAN" value={formData.jan} isEditing={isNew} onChange={v => updateField(p => ({ ...p, jan: parseInt(v) || 0 }))} />
                                <DetailRow label="Current Status" value={formData.status} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, status: v }))} />
                                <DetailRow label="Financial Year" value={formData.financialYear} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, financialYear: v }))} />
                                <DetailRow label="State" value={formData.location.state} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, location: { ...p.location, state: v } }))} />
                                <DetailRow label="City / Place" value={formData.location.city} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, location: { ...p.location, city: v } }))} />
                                <DetailRow label="EIC (Internal)" value={formData.extra.eicName} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, extra: { ...p.extra, eicName: v } }))} />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tender & EMD */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📜 Tender & EMD</div>
                    </div>
                    <div className="section-content" style={{ padding: 0 }}>
                        <table className="details-table">
                            <tbody>
                                <DetailRow label="Tender Ref No." value={formData.tender.referenceNo} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, tender: { ...p.tender, referenceNo: v } }))} />
                                <DetailRow label="Tender ID" value={formData.tender.tenderId} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, tender: { ...p.tender, tenderId: v } }))} />
                                <DetailRow label="Bank / UTR No" value={formData.tender.utrNumber} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, tender: { ...p.tender, utrNumber: v } }))} />
                                <DetailRow label="EMD Status" value={formData.compliance.emdStatus} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, compliance: { ...p.compliance, emdStatus: v } }))} />
                                <DetailRow label="EMD Payment" value={formData.compliance.emdPaymentStatus} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, compliance: { ...p.compliance, emdPaymentStatus: v } }))} />
                                <DetailRow label="PO/LOA Details" value={formData.extra.poDetails} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, extra: { ...p.extra, poDetails: v } }))} />
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Commercials */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">💰 Commercials</div>
                    </div>
                    <div className="section-content" style={{ padding: 0 }}>
                        <table className="details-table">
                            <tbody>
                                <DetailRow label="Contract Value (Internal)" value={formData.contract.valueInternal} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, contract: { ...p.contract, valueInternal: parseFloat(v) || 0 } }))} />
                                <DetailRow label="Updated Value" value={formData.contract.valueUpdated} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, contract: { ...p.contract, valueUpdated: parseFloat(v) || 0 } }))} />
                                <DetailRow label="GST Terms" value={formData.contract.gstTerms} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, contract: { ...p.contract, gstTerms: v } }))} />
                                <DetailRow label="BG Status" value={formData.bankGuarantee.status} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, bankGuarantee: { ...p.bankGuarantee, status: v } }))} />
                                <DetailRow label="BG Value" value={formData.bankGuarantee.value} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, bankGuarantee: { ...p.bankGuarantee, value: parseFloat(v) || 0 } }))} />
                                <DetailRow label="BG Expiry" value={formData.bankGuarantee.expiryDate} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, bankGuarantee: { ...p.bankGuarantee, expiryDate: v } }))} />
                                <DetailRow label="BG Claim Date" value={formData.bankGuarantee.claimDate} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, bankGuarantee: { ...p.bankGuarantee, claimDate: v } }))} />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="section-grid-2" style={{ marginTop: '24px' }}>
                {/* Critical Dates */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📅 Timeline</div>
                    </div>
                    <div className="section-content" style={{ padding: 0 }}>
                        <table className="details-table">
                            <tbody>
                                <DetailRow label="LOA / PO Date" value={formData.dates.loaDate} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, dates: { ...p.dates, loaDate: v } }))} />
                                <DetailRow label="Work Start Date" value={formData.dates.startDate} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, dates: { ...p.dates, startDate: v } }))} />
                                <DetailRow label="Original Completion" value={formData.dates.completionDateOriginal} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, dates: { ...p.dates, completionDateOriginal: v } }))} />
                                <DetailRow label="Latest Completion" value={formData.dates.completionDateLatest} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, dates: { ...p.dates, completionDateLatest: v } }))} />
                                <DetailRow label="Final Completion (Dev)" value={formData.extra.completionDateFinal} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, extra: { ...p.extra, completionDateFinal: v } }))} />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Client Contact */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">👤 Client Contact</div>
                    </div>
                    <div className="section-content" style={{ padding: 0 }}>
                        <table className="details-table">
                            <tbody>
                                <DetailRow label="Auth. Person Name" value={formData.clientContact.name} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, name: v } }))} />
                                <DetailRow label="Designation" value={formData.clientContact.designation} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, designation: v } }))} />
                                <DetailRow label="Mobile No." value={formData.clientContact.mobile} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, mobile: v } }))} />
                                <DetailRow label="Email" value={formData.clientContact.email} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, email: v } }))} />
                                <DetailRow label="Email CC" value={formData.clientContact.emailCC} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, emailCC: v } }))} />
                                <DetailRow label="Billing Address" value={formData.clientContact.billingAddress} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, billingAddress: v } }))} />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="section-grid-2" style={{ marginTop: '24px' }}>
                {/* Compliance & HR */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📋 Compliance & HR</div>
                    </div>
                    <div className="section-content" style={{ padding: 0 }}>
                        <table className="details-table">
                            <tbody>
                                <DetailRow label="HR Clearance" value={formData.compliance.hrClearance} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, compliance: { ...p.compliance, hrClearance: v } }))} />
                                <DetailRow label="Policy Expiry" value={formData.compliance.policyExpiry} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, compliance: { ...p.compliance, policyExpiry: v } }))} />
                                <DetailRow label="Labor License" value={formData.compliance.laborLicense} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, compliance: { ...p.compliance, laborLicense: v } }))} />
                                <DetailRow label="PF/ESIC Status" value={formData.compliance.pfEsicStatus} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, compliance: { ...p.compliance, pfEsicStatus: v } }))} />
                            </tbody>
                        </table>
                    </div>
                </div>


            </div>

            {/* Subcontractor Section - Full Width */}
            <div className="section" style={{ marginTop: '24px' }}>
                <div className="section-header">
                    <div className="section-title">🏗️ Subcontractor Details</div>
                </div>
                <div className="section-content" style={{ padding: 0 }}>
                    <table className="details-table">
                        <tbody>
                            <DetailRow label="Subcontractor Name" value={formData.subcontractor.name} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, name: v } }))} />
                            <DetailRow label="Proprietor" value={formData.subcontractor.proprietor} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, proprietor: v } }))} />
                            <DetailRow label="Work Order No." value={formData.subcontractor.workOrderNo} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, workOrderNo: v } }))} />
                            <DetailRow label="Work Order Date" value={formData.subcontractor.workOrderDate} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, workOrderDate: v } }))} />
                            <DetailRow label="WO % Value" value={formData.subcontractor.workOrderPercent} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, workOrderPercent: v } }))} />
                            <DetailRow label="GSTIN" value={formData.subcontractor.gstin} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, gstin: v } }))} />
                            <DetailRow label="Contact Mobile" value={formData.subcontractor.mobile} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, mobile: v } }))} />
                            <DetailRow label="Contact Email" value={formData.subcontractor.email} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, subcontractor: { ...p.subcontractor, email: v } }))} />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Documents Links */}
            <div className="section" style={{ marginTop: '24px' }}>
                <div className="section-header">
                    <div className="section-title">📄 Documents</div>
                </div>
                <div className="section-content" style={{ padding: 0 }}>
                    <table className="details-table">
                        <tbody>
                            <tr>
                                <th>Client LOA</th>
                                <td>
                                    {isEditing ? (
                                        <input
                                            className="search-input"
                                            value={formData.documents.loaLink || ''}
                                            onChange={(e) => updateField(p => ({ ...p, documents: { ...p.documents, loaLink: e.target.value } }))}
                                            style={{ width: '100%', padding: '4px 8px' }}
                                            placeholder="https://..."
                                        />
                                    ) : (
                                        formData.documents.loaLink ? (
                                            <a href={formData.documents.loaLink} target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                                                {formData.documents.loaLink}
                                            </a>
                                        ) : <span style={{ color: '#999' }}>-</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>Client Agreement</th>
                                <td>
                                    {isEditing ? (
                                        <input
                                            className="search-input"
                                            value={formData.documents.agreementLink || ''}
                                            onChange={(e) => updateField(p => ({ ...p, documents: { ...p.documents, agreementLink: e.target.value } }))}
                                            style={{ width: '100%', padding: '4px 8px' }}
                                            placeholder="https://..."
                                        />
                                    ) : (
                                        formData.documents.agreementLink ? (
                                            <a href={formData.documents.agreementLink} target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                                                {formData.documents.agreementLink}
                                            </a>
                                        ) : <span style={{ color: '#999' }}>-</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>Sub-Contractor WO</th>
                                <td>
                                    {isEditing ? (
                                        <input
                                            className="search-input"
                                            value={formData.documents.subWorkOrderLink || ''}
                                            onChange={(e) => updateField(p => ({ ...p, documents: { ...p.documents, subWorkOrderLink: e.target.value } }))}
                                            style={{ width: '100%', padding: '4px 8px' }}
                                            placeholder="https://..."
                                        />
                                    ) : (
                                        formData.documents.subWorkOrderLink ? (
                                            <a href={formData.documents.subWorkOrderLink} target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                                                {formData.documents.subWorkOrderLink}
                                            </a>
                                        ) : <span style={{ color: '#999' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}
