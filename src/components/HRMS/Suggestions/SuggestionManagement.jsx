import { Routes, Route } from 'react-router-dom'
import SuggestionList from './SuggestionList'
import SuggestionForm from './SuggestionForm'
import SuggestionDetail from './SuggestionDetail'

/**
 * SuggestionManagement - Router component for suggestions management
 * Handles routing for /hrms/suggestions/*
 */
function SuggestionManagement() {
  return (
    <Routes>
      <Route index element={<SuggestionList />} />
      <Route path="new" element={<SuggestionForm />} />
      <Route path=":suggestionId" element={<SuggestionDetail />} />
      <Route path=":suggestionId/edit" element={<SuggestionForm />} />
    </Routes>
  )
}

export default SuggestionManagement
