export function Subcontractors() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Subcontractors</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Subcontractor Details</h1>
        <p className="page-subtitle">Vendors, work orders, and key contacts</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">🏗️ Subcontractor Details</div>
          <button className="btn btn-secondary" type="button">
            ➕ Add Subcontractor
          </button>
        </div>
        <div className="section-content">
          <div className="contact-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: 16,
              }}
            >
              <div>
                <div className="contact-name">ABC Infra Services</div>
                <div className="contact-role">Primary Subcontractor (80% Work Order)</div>
              </div>
              <span className="status-badge status-ongoing">Active</span>
            </div>

            <div className="info-grid" style={{ marginTop: 16 }}>
              <div className="info-item">
                <div className="info-label">Proprietor / Signatory</div>
                <div className="info-value">Mr. Anil Kumar</div>
              </div>
              <div className="info-item">
                <div className="info-label">Contact Number</div>
                <div className="info-value">
                  <a href="tel:9123456789" style={{ color: 'var(--primary-color)' }}>
                    9123456789
                  </a>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Email Address</div>
                <div className="info-value">
                  <a
                    href="mailto:anil@abcinfra.com"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    anil@abcinfra.com
                  </a>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">GSTIN</div>
                <div className="info-value">27ABCDE1234F1Z5</div>
              </div>
              <div className="info-item">
                <div className="info-label">Work Order Percentage</div>
                <div className="info-value highlight">80%</div>
              </div>
              <div className="info-item">
                <div className="info-label">Work Order Number</div>
                <div className="info-value">WO-458/2025</div>
              </div>
              <div className="info-item">
                <div className="info-label">Work Order Date</div>
                <div className="info-value">08 Dec 2025</div>
              </div>
              <div className="info-item">
                <div className="info-label">Documents</div>
                <div className="info-value">
                  <a href="#" style={{ color: 'var(--primary-color)' }}>
                    📄 View Work Order
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

