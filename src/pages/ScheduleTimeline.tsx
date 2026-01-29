import { ScheduleChart } from '../components/charts/ScheduleChart'

export function ScheduleTimeline() {
  return (
    <div className="content">
      <div className="breadcrumb">
        <a href="#">Home</a> / <span>Schedule &amp; Timeline</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Schedule &amp; Timeline</h1>
        <p className="page-subtitle">Dates, milestones, and progress tracking</p>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">📅 Schedule &amp; Timeline</div>
          <button className="btn btn-secondary" type="button">
            📥 Export Schedule
          </button>
        </div>
        <div className="section-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">LOA Received Date</div>
              <div className="info-value">05 Dec 2025</div>
            </div>
            <div className="info-item">
              <div className="info-label">Work Start Date</div>
              <div className="info-value">10 Dec 2025</div>
            </div>
            <div className="info-item">
              <div className="info-label">Original Completion Date</div>
              <div className="info-value">10 Jun 2026</div>
            </div>
            <div className="info-item">
              <div className="info-label">Extended Completion Date</div>
              <div className="info-value highlight">30 Jun 2026</div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Project Duration</div>
              <div className="info-value">7 Months</div>
            </div>
            <div className="info-item">
              <div className="info-label">Time Extension</div>
              <div className="info-value">20 Days</div>
            </div>
            <div className="info-item">
              <div className="info-label">Days Elapsed</div>
              <div className="info-value">48 Days</div>
            </div>
            <div className="info-item">
              <div className="info-label">Days Remaining</div>
              <div className="info-value">202 Days</div>
            </div>
          </div>

          <div className="chart-wrapper" style={{ marginTop: 30 }}>
            <ScheduleChart />
          </div>
        </div>
      </div>
    </div>
  )
}

