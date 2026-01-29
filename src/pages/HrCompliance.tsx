export function HrCompliance() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>HR / Compliance</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">HR / Compliance</h1>
        <p className="page-subtitle">Certificates, clearances, and statutory status</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">🛡️ HR / Compliance</div>
          <button className="btn btn-secondary" type="button">
            📋 View Certificates
          </button>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">MSME Status</div>
              <div className="info-value">
                <span className="status-badge status-completed">Exempted under MSME</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">EMD Payment Status</div>
              <div className="info-value">Not Applicable</div>
            </div>
            <div className="info-item">
              <div className="info-label">Insurance Policy Status</div>
              <div className="info-value">
                <span className="status-badge status-ongoing">Valid up to 31 Mar 2026</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Labour License Number</div>
              <div className="info-value">LL-45872</div>
            </div>
            <div className="info-item">
              <div className="info-label">Labour License Validity</div>
              <div className="info-value">
                <span className="status-badge status-ongoing">Valid till 31 Mar 2026</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">PF/ESIC Status</div>
              <div className="info-value">
                <span className="status-badge status-completed">No pending dues</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">HR Clearance Status</div>
              <div className="info-value">
                <span className="status-badge status-completed">Data Submitted</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">RA Bill Status</div>
              <div className="info-value">
                <span className="status-badge status-completed">Released</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

