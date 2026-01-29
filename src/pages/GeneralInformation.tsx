export function GeneralInformation() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>General Information</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">General Information</h1>
        <p className="page-subtitle">Project summary and identifiers</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">ℹ️ General Information</div>
          <button className="btn btn-secondary" type="button">
            ✏️ Edit
          </button>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Project Status</div>
              <div className="info-value">
                <span className="status-badge status-ongoing">Ongoing</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Job Allocation Number</div>
              <div className="info-value highlight">JAN-2025-104</div>
            </div>
            <div className="info-item">
              <div className="info-label">Tender Reference</div>
              <div className="info-value">APL/TC/EN/O&amp;M/247/24</div>
            </div>
            <div className="info-item">
              <div className="info-label">Tender Date</div>
              <div className="info-value">15 Nov 2025</div>
            </div>
            <div className="info-item">
              <div className="info-label">EIC at Aakar</div>
              <div className="info-value">Mr. R. Sharma</div>
            </div>
            <div className="info-item">
              <div className="info-label">Financial Year</div>
              <div className="info-value">2025-26</div>
            </div>
            <div className="info-item">
              <div className="info-label">Project Location</div>
              <div className="info-value">AEML Chandivali, Mumbai, Maharashtra</div>
            </div>
            <div className="info-item">
              <div className="info-label">Name of Work</div>
              <div className="info-value">220 kV Cable Connectivity Work</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

