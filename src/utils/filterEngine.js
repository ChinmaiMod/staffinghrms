/**
 * Advanced Filter Engine
 * Applies complex filter conditions to contact data
 */

/**
 * Apply a single condition to a contact
 */
function applyCondition(contact, condition) {
  const { field, operator, value } = condition
  const contactValue = contact[field]

  // Handle null/undefined values
  if (operator === 'is_empty') {
    return !contactValue || contactValue === ''
  }
  if (operator === 'is_not_empty') {
    return contactValue && contactValue !== ''
  }

  // For other operators, if contact value is empty, no match
  if (!contactValue) return false

  const contactValueStr = String(contactValue).toLowerCase()
  const valueStr = String(value).toLowerCase()

  switch (operator) {
    case 'equals':
      return contactValueStr === valueStr

    case 'not_equals':
      return contactValueStr !== valueStr

    case 'contains':
      return contactValueStr.includes(valueStr)

    case 'not_contains':
      return !contactValueStr.includes(valueStr)

    case 'starts_with':
      return contactValueStr.startsWith(valueStr)

    case 'ends_with':
      return contactValueStr.endsWith(valueStr)

    default:
      return false
  }
}

/**
 * Apply all conditions in a group with AND/OR logic
 */
function applyGroup(contact, group) {
  const { conditions, operator, logicalOperator } = group
  // Support both 'operator' and 'logicalOperator' properties (AdvancedFilterBuilder uses logicalOperator)
  const groupOperator = operator || logicalOperator || 'AND'

  if (groupOperator === 'and' || groupOperator === 'AND') {
    // All conditions must match
    return conditions.every(condition => applyCondition(contact, condition))
  } else {
    // Any condition can match (OR)
    return conditions.some(condition => applyCondition(contact, condition))
  }
}

/**
 * Apply all filter groups with AND/OR logic between groups
 */
export function applyAdvancedFilters(contacts, filterConfig) {
  if (!filterConfig || !filterConfig.groups || filterConfig.groups.length === 0) {
    return contacts
  }

  const { groups, groupOperator = 'OR' } = filterConfig  // Default to OR if not specified

  return contacts.filter(contact => {
    if (groupOperator === 'AND' || groupOperator === 'and') {
      // All groups must match
      return groups.every(group => applyGroup(contact, group))
    } else {
      // Any group can match (OR)
      return groups.some(group => applyGroup(contact, group))
    }
  })
}

/**
 * Build a Supabase query from filter configuration
 * (For future use when connected to database)
 */
export function buildSupabaseQuery(supabase, filterConfig) {
  let query = supabase.from('contacts').select('*')

  if (!filterConfig || !filterConfig.groups || filterConfig.groups.length === 0) {
    return query
  }

  const { groups } = filterConfig

  // For complex AND/OR logic, we may need to fetch all and filter client-side
  // Or build complex SQL using .or() and .and() chains
  // This is a simplified version - for production, consider using RPC functions

  // Example for simple single-group filters:
  if (groups.length === 1) {
    const group = groups[0]
    group.conditions.forEach((condition) => {
      const { field, operator, value } = condition

      if (operator === 'is_empty') {
        query = query.is(field, null)
      } else if (operator === 'is_not_empty') {
        query = query.not(field, 'is', null)
      } else if (operator === 'equals') {
        query = query.eq(field, value)
      } else if (operator === 'not_equals') {
        query = query.neq(field, value)
      } else if (operator === 'contains') {
        query = query.ilike(field, `%${value}%`)
      } else if (operator === 'starts_with') {
        query = query.ilike(field, `${value}%`)
      } else if (operator === 'ends_with') {
        query = query.ilike(field, `%${value}`)
      }
    })
  }

  return query
}

/**
 * Generate a human-readable description of the filter
 */
export function describeFilter(filterConfig) {
  if (!filterConfig || !filterConfig.groups || filterConfig.groups.length === 0) {
    return 'No filters applied'
  }

  const { groups, groupOperator } = filterConfig

  const groupDescriptions = groups.map((group) => {
    const conditionDescriptions = group.conditions.map(condition => {
      const { field, operator, value } = condition
      const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      
      let operatorText = operator.replace(/_/g, ' ')
      let valueText = value || '(empty)'

      if (operator === 'is_empty') return `${fieldLabel} is empty`
      if (operator === 'is_not_empty') return `${fieldLabel} is not empty`

      return `${fieldLabel} ${operatorText} "${valueText}"`
    })

    const groupOperatorText = group.operator || 'and'
    const groupDesc = conditionDescriptions.join(` ${groupOperatorText} `)
    return groups.length > 1 ? `(${groupDesc})` : groupDesc
  })

  return groupDescriptions.join(` ${groupOperator} `)
}

/**
 * Count how many contacts match the filter
 */
export function countMatchingContacts(contacts, filterConfig) {
  const filtered = applyAdvancedFilters(contacts, filterConfig)
  return filtered.length
}

/**
 * Check if filter is empty/default
 */
export function isFilterEmpty(filterConfig) {
  if (!filterConfig || !filterConfig.groups) return true
  
  // Check if all conditions have empty values
  return filterConfig.groups.every(group => 
    group.conditions.every(condition => 
      !condition.value && !['is_empty', 'is_not_empty'].includes(condition.operator)
    )
  )
}

/**
 * Validate filter configuration
 */
export function validateFilter(filterConfig) {
  const errors = []

  if (!filterConfig || !filterConfig.groups || filterConfig.groups.length === 0) {
    return { valid: true, errors: [] }
  }

  filterConfig.groups.forEach((group, groupIndex) => {
    group.conditions.forEach((condition, condIndex) => {
      const { field, operator, value } = condition

      if (!field) {
        errors.push(`Group ${groupIndex + 1}, Condition ${condIndex + 1}: Field is required`)
      }

      if (!operator) {
        errors.push(`Group ${groupIndex + 1}, Condition ${condIndex + 1}: Operator is required`)
      }

      if (!['is_empty', 'is_not_empty'].includes(operator) && !value) {
        errors.push(`Group ${groupIndex + 1}, Condition ${condIndex + 1}: Value is required`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  applyAdvancedFilters,
  buildSupabaseQuery,
  describeFilter,
  countMatchingContacts,
  isFilterEmpty,
  validateFilter
}
