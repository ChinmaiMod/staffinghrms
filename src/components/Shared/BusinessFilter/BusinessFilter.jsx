import { useState, useRef, useEffect } from 'react'
import { BuildingOfficeIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useTenant } from '../../../contexts/TenantProvider'
import './BusinessFilter.css'

/**
 * BusinessFilter - Reusable business filter dropdown component
 * To be placed at the top of all HRMS pages for filtering by business
 */
function BusinessFilter() {
  const { businesses, selectedBusiness, setSelectedBusiness } = useTenant()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if no businesses available
  if (!businesses || businesses.length === 0) {
    return null
  }

  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business)
    setShowDropdown(false)
  }

  return (
    <div className="business-filter" ref={dropdownRef}>
      <label className="business-filter-label">Filter by Business:</label>
      <div className="business-filter-dropdown">
        <button
          type="button"
          className="business-filter-btn"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        >
          <BuildingOfficeIcon className="business-filter-icon" aria-hidden="true" />
          <span className="business-filter-text">
            {selectedBusiness?.business_name || 'All Businesses'}
          </span>
          <ChevronDownIcon 
            className={`business-filter-chevron ${showDropdown ? 'open' : ''}`} 
            aria-hidden="true" 
          />
        </button>
        
        {showDropdown && (
          <div className="business-filter-menu" role="listbox">
            <button
              type="button"
              className={`business-filter-option ${!selectedBusiness ? 'selected' : ''}`}
              onClick={() => handleBusinessSelect(null)}
              role="option"
              aria-selected={!selectedBusiness}
            >
              <span>All Businesses</span>
            </button>
            {businesses.map((business) => (
              <button
                key={business.business_id}
                type="button"
                className={`business-filter-option ${selectedBusiness?.business_id === business.business_id ? 'selected' : ''}`}
                onClick={() => handleBusinessSelect(business)}
                role="option"
                aria-selected={selectedBusiness?.business_id === business.business_id}
              >
                <span>{business.business_name}</span>
                {business.division_type && (
                  <span className="business-filter-type">{business.division_type}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessFilter

