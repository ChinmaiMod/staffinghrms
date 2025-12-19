import { Routes, Route } from 'react-router-dom'
import NewsletterList from './NewsletterList'
import NewsletterForm from './NewsletterForm'
import NewsletterDetail from './NewsletterDetail'

/**
 * NewsletterManagement - Router component for newsletter management
 * Handles routing for /hrms/newsletters/*
 */
function NewsletterManagement() {
  return (
    <Routes>
      <Route index element={<NewsletterList />} />
      <Route path="new" element={<NewsletterForm />} />
      <Route path=":newsletterId" element={<NewsletterDetail />} />
      <Route path=":newsletterId/edit" element={<NewsletterForm />} />
    </Routes>
  )
}

export default NewsletterManagement
