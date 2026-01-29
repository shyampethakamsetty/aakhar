export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="icon-btn"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          title="Menu"
        >
          ☰
        </button>
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search projects, clients, documents..."
          />
        </div>
      </div>

      <div className="header-actions">
        <button className="notification-btn" type="button">
          🔔
          <span className="notification-badge" />
        </button>
        <div className="user-profile">
          <div className="user-avatar">RS</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>R. Sharma</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              EIC Manager
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

