import { NavLink } from 'react-router-dom'

export type NavItem = {
  label: string
  icon: string
  to: string
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export function Sidebar({
  isOpen,
  sections,
  onNavigate,
}: {
  isOpen: boolean
  sections: NavSection[]
  onNavigate: () => void
}) {
  return (
    <div className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="logo">
        <img 
          src="/aakarlogo.jpeg" 
          alt="AAKAR Logo" 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            objectFit: 'contain',
            background: 'white',
            padding: '4px'
          }}
        />
        <div className="logo-text">AAKAR</div>
      </div>

      {sections.map((section) => (
        <div className="nav-section" key={section.title}>
          <div className="nav-title">{section.title}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              to={item.to}
              onClick={onNavigate}
              end
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </div>
  )
}

