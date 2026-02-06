import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientService } from '../data/clientData'
import type { Client } from '../types/client'

export function AddClient() {
  const navigate = useNavigate()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    logo: undefined,
    contact: {
      name: '',
      designation: '',
      mobile: '',
      email: '',
      emailCC: '',
      billingAddress: '',
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setLogoPreview(base64String)
        setFormData(prev => ({ ...prev, logo: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      alert('Client name is required')
      return
    }

    // Check if client with same name already exists
    const existingClient = clientService.getClientByName(formData.name)
    if (existingClient) {
      if (!confirm(`Client "${formData.name}" already exists. Do you want to update it?`)) {
        return
      }
      // Update existing client
      clientService.updateClient(existingClient.id, formData)
      alert('Client updated successfully!')
    } else {
      // Create new client
      clientService.createClient(formData)
      alert('Client added successfully!')
    }

    // Navigate to client page
    navigate('/client')
  }

  const updateContactField = (field: keyof Client['contact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }))
  }

  return (
    <div className="content">
      <div style={{ marginBottom: '12px' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '6px 12px', fontSize: '13px' }}>
          ← Back
        </button>
      </div>
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Home</a> / 
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/client'); }}>Client Details</a> / 
        <span>Add Client</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Add New Client</h1>
        <p className="page-subtitle">Enter client information and upload logo</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section">
          <div className="section-header">
            <div className="section-title">📷 Client Logo</div>
          </div>
          <div className="section-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
              {logoPreview && (
                <div style={{
                  width: '150px',
                  height: '150px',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--light)',
                }}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  id="logo-upload"
                  style={{
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                  }}
                />
                {logoPreview && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setLogoPreview(null)
                      setFormData(prev => ({ ...prev, logo: undefined }))
                      // Reset the file input
                      const fileInput = document.getElementById('logo-upload') as HTMLInputElement
                      if (fileInput) {
                        fileInput.value = ''
                      }
                    }}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div className="section-title">📋 Client Information</div>
          </div>
          <div className="section-content" style={{ padding: 0 }}>
            <table className="details-table">
              <tbody>
                <tr>
                  <th>Client Name *</th>
                  <td>
                    <input
                      type="text"
                      className="search-input"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter client name"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div className="section-title">👤 Contact Information</div>
          </div>
          <div className="section-content" style={{ padding: 0 }}>
            <table className="details-table">
              <tbody>
                <tr>
                  <th>Authorized Person Name</th>
                  <td>
                    <input
                      type="text"
                      className="search-input"
                      value={formData.contact.name}
                      onChange={(e) => updateContactField('name', e.target.value)}
                      placeholder="Enter contact person name"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Designation</th>
                  <td>
                    <input
                      type="text"
                      className="search-input"
                      value={formData.contact.designation}
                      onChange={(e) => updateContactField('designation', e.target.value)}
                      placeholder="Enter designation"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Mobile Number</th>
                  <td>
                    <input
                      type="tel"
                      className="search-input"
                      value={formData.contact.mobile}
                      onChange={(e) => updateContactField('mobile', e.target.value)}
                      placeholder="Enter mobile number"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>
                    <input
                      type="email"
                      className="search-input"
                      value={formData.contact.email}
                      onChange={(e) => updateContactField('email', e.target.value)}
                      placeholder="Enter email address"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Email CC</th>
                  <td>
                    <input
                      type="email"
                      className="search-input"
                      value={formData.contact.emailCC}
                      onChange={(e) => updateContactField('emailCC', e.target.value)}
                      placeholder="Enter CC email address"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Billing Address</th>
                  <td>
                    <textarea
                      className="search-input"
                      value={formData.contact.billingAddress}
                      onChange={(e) => updateContactField('billingAddress', e.target.value)}
                      placeholder="Enter billing address"
                      rows={3}
                      style={{ width: '100%', padding: '8px 12px', resize: 'vertical' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button type="submit" className="btn btn-primary">
            Save Client
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/client')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
