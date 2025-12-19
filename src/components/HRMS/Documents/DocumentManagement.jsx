import { Routes, Route, Navigate } from 'react-router-dom'
import DocumentList from './DocumentList'
import DocumentUpload from './DocumentUpload'
import DocumentViewer from './DocumentViewer'

/**
 * DocumentManagement - Main routing component for document management
 * URL: /hrms/documents/*
 */
function DocumentManagement() {
  return (
    <Routes>
      <Route index element={<DocumentList />} />
      <Route path="upload" element={<DocumentUpload />} />
      <Route path=":documentId" element={<DocumentViewer />} />
      <Route path="*" element={<Navigate to="/hrms/documents" replace />} />
    </Routes>
  )
}

export default DocumentManagement
