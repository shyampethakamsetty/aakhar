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
        <div className="logo-icon">A</div>
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

