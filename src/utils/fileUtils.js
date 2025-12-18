export const createUniqueFileName = (originalName) => {
  const safeName = (originalName || 'file')
    .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
    .toLowerCase()

  const timestamp = Date.now()
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

  const dotIndex = safeName.lastIndexOf('.')
  const base = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName
  const extension = dotIndex > 0 ? safeName.slice(dotIndex) : ''

  return `${base}-${timestamp}-${random}${extension}`
}

export const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${Math.round(value * 100) / 100} ${sizes[i]}`
}
