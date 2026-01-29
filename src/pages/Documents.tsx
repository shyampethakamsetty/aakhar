export function Documents() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Documents</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Documents &amp; Links</h1>
        <p className="page-subtitle">Project references and uploads</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">📄 Documents &amp; Links</div>
          <button className="btn btn-primary" type="button">
            ⬆️ Upload Document
          </button>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Client WO/PO Upload</div>
              <div className="info-value">
                <a href="#" style={{ color: 'var(--primary-color)' }}>
                  🔗 Drive Link
                </a>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Client Contract Agreement</div>
              <div className="info-value">
                <a href="#" style={{ color: 'var(--primary-color)' }}>
                  🔗 Drive Link
                </a>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Subcontractor Work Order</div>
              <div className="info-value">
                <a href="#" style={{ color: 'var(--primary-color)' }}>
                  🔗 Drive Link
                </a>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Bank Guarantee Document</div>
              <div className="info-value">
                <a href="#" style={{ color: 'var(--primary-color)' }}>
                  📥 Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

