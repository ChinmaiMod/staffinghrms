/**
 * Colorful Icons for HRMS Sidebar
 * Custom SVG icons with colors matching modern UI design
 */

// Compliance Dashboard - Orange/Red warning color
export function ComplianceIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <path d="M10 2L2 4V9C2 13 5 16 10 18C15 16 18 13 18 9V4L10 2Z" fill="#F59E0B" />
      <path d="M10 6V10M10 14H10.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Employee Tickets - Blue
export function TicketsIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <rect x="4" y="5" width="12" height="10" rx="1" fill="#3B82F6" />
      <path d="M6 8H14M6 11H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Employee Management - Purple
export function EmployeesIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <circle cx="7" cy="7" r="2" fill="#8B5CF6" />
      <circle cx="13" cy="7" r="2" fill="#8B5CF6" />
      <path d="M4 14C4 12 5 11 7 11H13C15 11 16 12 16 14" stroke="#8B5CF6" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

// Client Management - Teal
export function ClientsIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <rect x="5" y="5" width="10" height="10" rx="1" fill="#14B8A6" />
      <path d="M7 8H13M7 11H13M7 14H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Vendor Management - Orange
export function VendorsIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <rect x="4" y="6" width="12" height="8" rx="1" fill="#F97316" />
      <circle cx="7" cy="10" r="1" fill="white" />
      <circle cx="10" cy="10" r="1" fill="white" />
      <circle cx="13" cy="10" r="1" fill="white" />
    </svg>
  )
}

// Employee Projects - Indigo
export function ProjectsIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <rect x="5" y="5" width="10" height="10" rx="1" fill="#6366F1" />
      <path d="M7 8L10 11L13 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12L10 9L13 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Document Management - Blue/Gray
export function DocumentsIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <path d="M6 4V16H14V6H10V4H6Z" fill="#0EA5E9" />
      <path d="M10 4V6H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 9H13M7 12H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Visa & Immigration - Blue/Teal
export function ImmigrationIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <circle cx="10" cy="10" r="5" fill="#06B6D4" />
      <path d="M10 6V10L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1" fill="white" />
    </svg>
  )
}

// Timesheet Management - Green
export function TimesheetsIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <circle cx="10" cy="10" r="5" fill="#10B981" />
      <path d="M10 7V10L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Data Administration - Gray
export function AdminIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <circle cx="10" cy="7" r="2.5" fill="#6B7280" />
      <path d="M5 15C5 13 6 12 8 12H12C14 12 15 13 15 15" stroke="#6B7280" strokeWidth="1.5" fill="none" />
      <circle cx="10" cy="10" r="1.5" fill="#6B7280" />
    </svg>
  )
}

// Newsletter - Red/Pink
export function NewsletterIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <rect x="4" y="5" width="12" height="10" rx="1" fill="#EC4899" />
      <path d="M6 8H14M6 11H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Profile & Settings - Gray/Blue
export function ProfileIcon({ className, style }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      <circle cx="10" cy="8" r="2.5" fill="#3B82F6" />
      <path d="M5 16C5 14 6 13 8 13H12C14 13 15 14 15 16" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

