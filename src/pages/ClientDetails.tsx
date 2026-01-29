export function ClientDetails() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Client Details</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Client &amp; Contact Information</h1>
        <p className="page-subtitle">Client contacts and communication</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">👥 Client &amp; Contact Information</div>
          <button className="btn btn-secondary" type="button">
            📞 Contact
          </button>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="contact-card">
              <div className="contact-name">AEML (Adani Electricity Mumbai Limited)</div>
              <div className="contact-role">Client Company</div>
              <div className="contact-info">
                <div className="contact-detail">📍 AEML, Mumbai Head Office</div>
                <div className="contact-detail">📞 Maharashtra, Mumbai</div>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-name">Mr. S. Patil</div>
              <div className="contact-role">Deputy Manager - Project Manager</div>
              <div className="contact-info">
                <div className="contact-detail">
                  📱 <a href="tel:9876543210">9876543210</a>
                </div>
                <div className="contact-detail">
                  ✉️ <a href="mailto:patil@aeml.co.in">patil@aeml.co.in</a>
                </div>
                <div className="contact-detail">
                  📧 CC: <a href="mailto:cm@aakar.co.in">cm@aakar.co.in</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

