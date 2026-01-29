import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard.tsx'
import { ProjectDetails } from './pages/ProjectDetails.tsx'
import { ClientDetails } from './pages/ClientDetails.tsx'
import { Commercial } from './pages/Commercial.tsx'
import { Documents } from './pages/Documents.tsx'
import { GeneralInformation } from './pages/GeneralInformation.tsx'
import { HrCompliance } from './pages/HrCompliance.tsx'
import { Projects } from './pages/Projects.tsx'
import { ScheduleTimeline } from './pages/ScheduleTimeline.tsx'
import { Subcontractors } from './pages/Subcontractors.tsx'
import { PlaceholderPage } from './pages/PlaceholderPage.tsx'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/general" element={<GeneralInformation />} />
        <Route path="/client" element={<ClientDetails />} />
        <Route path="/commercial" element={<Commercial />} />
        <Route path="/schedule" element={<ScheduleTimeline />} />
        <Route path="/hr" element={<HrCompliance />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/subcontractors" element={<Subcontractors />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="*" element={<PlaceholderPage title="Not Found" />} />
      </Route>
    </Routes>
  )
}

