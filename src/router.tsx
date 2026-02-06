import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard.tsx'
import { ProjectDetails } from './pages/ProjectDetails.tsx'
import { ClientDetails } from './pages/ClientDetails.tsx'
import { Commercial } from './pages/Commercial.tsx'
import { Documents } from './pages/Documents.tsx'
import { HrCompliance } from './pages/HrCompliance.tsx'
import { Projects } from './pages/Projects.tsx'
import { Subcontractors } from './pages/Subcontractors.tsx'
import { PlaceholderPage } from './pages/PlaceholderPage.tsx'
import { Reports } from './pages/Reports.tsx'
import { Alerts } from './pages/Alerts.tsx'
import { ProjectsWithValueIncrease } from './pages/ProjectsWithValueIncrease.tsx'
import { TotalValue } from './pages/TotalValue.tsx'
import { AddClient } from './pages/AddClient.tsx'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectDetails />} />
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/client" element={<ClientDetails />} />
        <Route path="/client/add" element={<AddClient />} />
        <Route path="/commercial" element={<Commercial />} />
        <Route path="/value-increase" element={<ProjectsWithValueIncrease />} />
        <Route path="/total-value" element={<TotalValue />} />
        <Route path="/schedule" element={<Alerts />} />
        <Route path="/hr" element={<HrCompliance />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/subcontractors" element={<Subcontractors />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="/analysis" element={<PlaceholderPage title="Analysis" />} />
        <Route path="*" element={<PlaceholderPage title="Not Found" />} />
      </Route>
    </Routes>
  )
}

