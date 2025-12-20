/**
 * Custom Dashboard Icon - Colorful bar chart matching source CRM
 * Features colored bars (red, green, blue) on white background
 */
function DashboardIcon({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* White background square */}
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F3F4F6" />
      
      {/* Colored bars */}
      {/* Red bar */}
      <rect x="4" y="12" width="2.5" height="4" fill="#EF4444" />
      
      {/* Green bar */}
      <rect x="7.5" y="10" width="2.5" height="6" fill="#10B981" />
      
      {/* Light blue bar */}
      <rect x="11" y="8" width="2.5" height="8" fill="#60A5FA" />
      
      {/* Dark blue bar */}
      <rect x="14.5" y="6" width="2.5" height="10" fill="#3B82F6" />
    </svg>
  )
}

export default DashboardIcon

