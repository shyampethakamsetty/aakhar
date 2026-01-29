import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar, type NavSection } from './Sidebar'

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navSections: NavSection[] = useMemo(
    () => [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', icon: '📊', to: '/dashboard' },
          { label: 'All Projects', icon: '📁', to: '/projects' },
          { label: 'Schedule & Timeline', icon: '📅', to: '/schedule' },
        ],
      },
      {
        title: 'Project Management',
        items: [
          { label: 'Client Details', icon: '👥', to: '/client' },
          { label: 'Commercial', icon: '💰', to: '/commercial' },
        ],
      },
      {
        title: 'Compliance & Legal',
        items: [
          { label: 'HR / Compliance', icon: '🛡️', to: '/hr' },
          { label: 'Documents', icon: '📄', to: '/documents' },
          { label: 'Subcontractors', icon: '🏗️', to: '/subcontractors' },
        ],
      },
      {
        title: 'Analytics',
        items: [
          { label: 'Reports', icon: '📈', to: '/reports' },
          { label: 'Analytics', icon: '📊', to: '/analytics' },
          { label: 'Analysis', icon: '📉', to: '/analysis' },
        ],
      },
    ],
    [],
  )

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onNavigate={() => setIsSidebarOpen(false)}
        sections={navSections}
      />
      <div className="main-content">
        <Header onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />
        <Outlet />
      </div>
    </>
  )
}

