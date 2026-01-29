import { CommercialChart } from '../components/charts/CommercialChart'

export function Commercial() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Commercial</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Commercial Details</h1>
        <p className="page-subtitle">Contracts, BG, and financial overview</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">💰 Commercial Details</div>
          <button className="btn btn-secondary" type="button">
            📊 View Financial Reports
          </button>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Original Contract Value</div>
              <div className="info-value">₹12.50 Crores</div>
            </div>
            <div className="info-item">
              <div className="info-label">Updated Contract Value</div>
              <div className="info-value highlight">₹13.20 Crores</div>
            </div>
            <div className="info-item">
              <div className="info-label">GST Status</div>
              <div className="info-value">GST Extra</div>
            </div>
            <div className="info-item">
              <div className="info-label">Value Increase</div>
              <div className="info-value">₹0.70 Cr (5.6%)</div>
            </div>
            <div className="info-item">
              <div className="info-label">Bank Guarantee Status</div>
              <div className="info-value">
                <span className="status-badge status-completed">Submitted</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Bank Guarantee Value</div>
              <div className="info-value">₹1.25 Crores</div>
            </div>
            <div className="info-item">
              <div className="info-label">Bank Name</div>
              <div className="info-value">Canara Bank</div>
            </div>
            <div className="info-item">
              <div className="info-label">BG Expiry Date</div>
              <div className="info-value">31 Dec 2026</div>
            </div>
            <div className="info-item">
              <div className="info-label">LOA Number</div>
              <div className="info-value">NTECL/C&amp;M/NIT-143/CS-2726 / LOA-2749</div>
            </div>
            <div className="info-item">
              <div className="info-label">LOA Date</div>
              <div className="info-value">11 Oct 2017 (Issued: 05 Dec 2025)</div>
            </div>
          </div>

          <div className="chart-wrapper" style={{ marginTop: 30 }}>
            <CommercialChart />
          </div>
        </div>
      </div>
    </div>
  )
}

