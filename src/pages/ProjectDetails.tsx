import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { projectService } from '../data/projectData'
import { clientService } from '../data/clientData'
import type { Project } from '../types/project'
import { exportProjectToPDF } from '../utils/pdfExport'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { PromptModal } from '../components/modals/PromptModal'
import { SuccessModal } from '../components/modals/SuccessModal'

// Helper for table rows
const DetailRow = ({
    label,
    value,
    onChange,
    isEditing,
    type = 'text',
    options
}: {
    label: string,
    value: string | number | undefined,
    onChange: (val: string) => void,
    isEditing: boolean,
    type?: string,
    options?: string[]
}) => {
    return (
        <tr>
            <th>{label}</th>
            <td>
                {isEditing ? (
                    options ? (
                        <select
                            className="search-input"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            style={{ width: '100%', padding: '4px 8px' }}
                        >
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={type}
                            className="search-input"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            style={{ width: '100%', padding: '4px 8px' }}
                        />
                    )
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
    const location = useLocation()
    const [project, setProject] = useState<Project | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Project | null>(null)
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [clientSearchQuery, setClientSearchQuery] = useState('')
    const [showClientDropdown, setShowClientDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const isNew = !projectId || projectId === 'new' // Check if creating new
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showDeletePrompt, setShowDeletePrompt] = useState(false)
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0) // Force refresh when clients change

    // Get all clients (refresh when refreshKey changes)
    const allClients = useMemo(() => clientService.getAllClients(), [refreshKey])
    
    // Get latest 4 clients (most recently added)
    const latestClients = useMemo(() => {
        return [...allClients]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4)
    }, [allClients])

    // Filter clients based on search query
    const filteredClients = useMemo(() => {
        if (!clientSearchQuery.trim()) {
            return latestClients // Show latest 4 when no search
        }
        return clientService.searchClients(clientSearchQuery)
    }, [clientSearchQuery, latestClients])

    // Find selected client
    const selectedClient = useMemo(() => {
        if (!selectedClientId) return null
        return clientService.getClientById(selectedClientId) || clientService.getClientByName(selectedClientId)
    }, [selectedClientId])

    // Refresh when component mounts or location changes (to catch new clients added)
    useEffect(() => {
        // Trigger refresh when component mounts or when navigating back from Add Client
        setRefreshKey(Date.now())
    }, [location.key])

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
                // Try to find client by name
                const client = clientService.getClientByName(p.clientName)
                if (client) {
                    setSelectedClientId(client.id)
                }
            }
        }
    }, [projectId, isNew])

    // Auto-populate client contact when client is selected
    useEffect(() => {
        if (selectedClient && isEditing) {
            setFormData(prev => prev ? {
                ...prev,
                clientName: selectedClient.name,
                clientContact: {
                    name: selectedClient.contact.name,
                    designation: selectedClient.contact.designation,
                    mobile: selectedClient.contact.mobile,
                    email: selectedClient.contact.email,
                    emailCC: selectedClient.contact.emailCC,
                    billingAddress: selectedClient.contact.billingAddress,
                }
            } : null)
        }
    }, [selectedClient, isEditing])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowClientDropdown(false)
            }
        }
        if (showClientDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showClientDropdown])

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

    const handleDeleteClick = () => {
        if (!project || isNew) return
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = () => {
        setShowDeleteConfirm(false)
        setShowDeletePrompt(true)
    }

    const handleDeleteFinal = () => {
        if (!project) return
        
        const success = projectService.deleteProject(project.jan)
        if (success) {
            setShowDeletePrompt(false)
            setShowDeleteSuccess(true)
        } else {
            setShowDeletePrompt(false)
            alert('Failed to delete project.')
        }
    }

    const handleSuccessClose = () => {
        setShowDeleteSuccess(false)
        navigate('/projects')
    }

    const updateField = (updater: (prev: Project) => Project) => {
        setFormData(prev => prev ? updater(prev) : null)
    }

    return (
        <div className="content">
            <div style={{ marginBottom: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    ← Back
                </button>
            </div>
            <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                            <div style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                alignItems: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => exportProjectToPDF(project)}
                                    style={{
                                        padding: '10px 18px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    📥 Export PDF
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        padding: '10px 18px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    ✏️ Edit Project
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleDeleteClick}
                                    style={{ 
                                        padding: '10px 18px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        height: '40px',
                                        background: '#ef4444', 
                                        color: 'white',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    🗑️ Delete Project
                                </button>
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
                                <DetailRow 
                                    label="Current Status" 
                                    value={formData.status} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, status: v }))} 
                                    options={['ongoing', 'completed', 'delayed', 'stopped']}
                                />
                                <DetailRow label="Reason (optional)" value={formData.statusReason} isEditing={isEditing} onChange={v => updateField(p => ({ ...p, statusReason: v }))} />
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
                    <div className="section-content">
                        {isEditing && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Select Client
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => navigate('/client/add')}
                                        style={{ padding: '8px 16px', fontSize: '13px' }}
                                    >
                                        ➕ New Client
                                    </button>
                                </div>
                                
                                {/* Search Bar with Dropdown */}
                                <div style={{ position: 'relative', marginBottom: '12px' }} ref={dropdownRef}>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="🔍 Search client or click to see latest clients..."
                                        value={clientSearchQuery}
                                        onChange={(e) => {
                                            setClientSearchQuery(e.target.value)
                                            setShowClientDropdown(true)
                                        }}
                                        onFocus={() => {
                                            setShowClientDropdown(true)
                                        }}
                                        style={{ width: '100%', padding: '12px 16px 12px 44px', fontSize: '14px' }}
                                    />
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>
                                        🔍
                                    </span>

                                    {/* Client Dropdown */}
                                    {showClientDropdown && filteredClients.length > 0 && (
                                        <div 
                                            style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            zIndex: 1000,
                                            background: 'white',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            marginTop: '4px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            padding: '4px'
                                        }}
                                        >
                                        {filteredClients.map((client, index) => (
                                            <div
                                                key={client.id}
                                                onClick={() => {
                                                    setSelectedClientId(client.id)
                                                    setClientSearchQuery(client.name)
                                                    setShowClientDropdown(false)
                                                }}
                                                style={{
                                                    padding: '10px 12px',
                                                    background: selectedClientId === client.id ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                                                    borderBottom: index < filteredClients.length - 1 ? '1px solid var(--border)' : 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (selectedClientId !== client.id) {
                                                        e.currentTarget.style.background = 'var(--light)'
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedClientId !== client.id) {
                                                        e.currentTarget.style.background = 'transparent'
                                                    }
                                                }}
                                            >
                                                {client.logo ? (
                                                    <img
                                                        src={client.logo}
                                                        alt={client.name}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '6px',
                                                            objectFit: 'cover',
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '6px',
                                                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0
                                                    }}>
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ 
                                                        fontWeight: 600, 
                                                        fontSize: '14px',
                                                        color: 'var(--text-primary)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {client.name}
                                                    </div>
                                                    {client.contact.email && (
                                                        <div style={{ 
                                                            fontSize: '12px', 
                                                            color: 'var(--text-secondary)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {client.contact.email}
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedClientId === client.id && (
                                                    <div style={{
                                                        fontSize: '16px',
                                                        color: 'var(--primary-color)',
                                                        flexShrink: 0
                                                    }}>
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        </div>
                                    )}
                                </div>

                                {allClients.length === 0 && (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        background: 'var(--light)',
                                        borderRadius: '8px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            No clients available
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => navigate('/client/add')}
                                            style={{ padding: '8px 16px', fontSize: '13px' }}
                                        >
                                            Add Your First Client
                                        </button>
                                    </div>
                                )}

                                {!showClientDropdown && allClients.length > 4 && (
                                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => navigate('/client')}
                                            style={{ padding: '8px 20px', fontSize: '13px' }}
                                        >
                                            See More ({allClients.length} clients)
                                        </button>
                                    </div>
                                )}

                                {selectedClient && (
                                    <div style={{
                                        padding: '12px',
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        {selectedClient.logo && (
                                            <img
                                                src={selectedClient.logo}
                                                alt={selectedClient.name}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>Selected: {selectedClient.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                Contact details will be auto-filled
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setSelectedClientId('')}
                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <table className="details-table">
                            <tbody>
                                {isEditing && (
                                    <tr>
                                        <th>Client Name</th>
                                        <td>
                                            <input
                                                type="text"
                                                className="search-input"
                                                value={formData.clientName}
                                                onChange={(e) => updateField(p => ({ ...p, clientName: e.target.value }))}
                                                placeholder="Client name (auto-filled when client selected)"
                                                style={{ width: '100%', padding: '8px 12px' }}
                                            />
                                        </td>
                                    </tr>
                                )}
                                {!isEditing && (
                                    <tr>
                                        <th>Client Name</th>
                                        <td><span style={{ fontWeight: 500 }}>{formData.clientName || '-'}</span></td>
                                    </tr>
                                )}
                                <DetailRow 
                                    label="Auth. Person Name" 
                                    value={formData.clientContact.name} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, name: v } }))} 
                                />
                                <DetailRow 
                                    label="Designation" 
                                    value={formData.clientContact.designation} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, designation: v } }))} 
                                />
                                <DetailRow 
                                    label="Mobile No." 
                                    value={formData.clientContact.mobile} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, mobile: v } }))} 
                                />
                                <DetailRow 
                                    label="Email" 
                                    value={formData.clientContact.email} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, email: v } }))} 
                                />
                                <DetailRow 
                                    label="Email CC" 
                                    value={formData.clientContact.emailCC} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, emailCC: v } }))} 
                                />
                                <DetailRow 
                                    label="Billing Address" 
                                    value={formData.clientContact.billingAddress} 
                                    isEditing={isEditing} 
                                    onChange={v => updateField(p => ({ ...p, clientContact: { ...p.clientContact, billingAddress: v } }))} 
                                />
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

            {/* Delete Confirmation Modals */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Project"
                message={`Are you sure you want to delete this project?\n\nJAN: ${project?.jan}\nProject: ${project?.workName}\nClient: ${project?.clientName}\n\nThis action cannot be undone.`}
                confirmText="Yes, Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                confirmButtonColor="#ef4444"
            />
            <PromptModal
                isOpen={showDeletePrompt}
                title="Confirm Deletion"
                message={`Please type the project name to confirm deletion:\n\nProject name: "${formData?.workName || project?.workName}"`}
                placeholder={`Type "${formData?.workName || project?.workName}" to confirm`}
                expectedValue={formData?.workName || project?.workName || ''}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteFinal}
                onCancel={() => setShowDeletePrompt(false)}
                confirmButtonColor="#ef4444"
            />
            <SuccessModal
                isOpen={showDeleteSuccess}
                title="Deleted"
                message={`Project JAN ${project?.jan} has been deleted successfully.`}
                onClose={handleSuccessClose}
            />
        </div>
    )
}
