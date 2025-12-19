import { Routes, Route } from 'react-router-dom'
import ProjectList from './ProjectList'
import ProjectDetail from './ProjectDetail'
import ProjectForm from './ProjectForm'

/**
 * ProjectManagement - Router component for project management
 * Handles routing for /hrms/projects/*
 */
function ProjectManagement() {
  return (
    <Routes>
      <Route index element={<ProjectList />} />
      <Route path="new" element={<ProjectForm />} />
      <Route path=":projectId" element={<ProjectDetail />} />
      <Route path=":projectId/edit" element={<ProjectForm />} />
    </Routes>
  )
}

export default ProjectManagement
