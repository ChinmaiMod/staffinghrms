import { Routes, Route } from 'react-router-dom'
import VendorList from './VendorList'
import VendorDetail from './VendorDetail'
import VendorForm from './VendorForm'

/**
 * VendorManagement - Main routing component for vendor features
 * Based on UI_DESIGN_DOCS/07_VENDOR_MANAGEMENT.md
 */
function VendorManagement() {
  return (
    <Routes>
      <Route index element={<VendorList />} />
      <Route path="new" element={<VendorForm />} />
      <Route path=":vendorId" element={<VendorDetail />} />
      <Route path=":vendorId/edit" element={<VendorForm />} />
    </Routes>
  )
}

export default VendorManagement
