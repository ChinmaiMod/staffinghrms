import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { validateTextField } from '../../../utils/validators'

const TABLE_CONFIG = {
  visa_status: {
    tableName: 'visa_status',
    valueColumn: 'visa_status',
    orderBy: 'visa_status',
  },
  job_titles_it: {
    tableName: 'job_title',
    valueColumn: 'job_title',
    filters: { field: 'IT' },
    insertDefaults: { field: 'IT' },
    orderBy: 'job_title',
  },
  job_titles_healthcare: {
    tableName: 'job_title',
    valueColumn: 'job_title',
    filters: { field: 'Healthcare' },
    insertDefaults: { field: 'Healthcare' },
    orderBy: 'job_title',
  },
  reasons_for_contact: {
    tableName: 'reason_for_contact',
    valueColumn: 'reason_for_contact',
    orderBy: 'reason_for_contact',
  },
  statuses: {
    tableName: 'workflow_status',
    valueColumn: 'workflow_status',
    orderBy: 'workflow_status',
  },
  role_types: {
    tableName: 'type_of_roles',
    valueColumn: 'type_of_roles',
    orderBy: 'type_of_roles',
  },
  type_of_contact: {
    tableName: 'type_of_contact',
    valueColumn: 'type_of_contact',
    orderBy: 'type_of_contact',
  },
  referral_sources: {
    tableName: 'referral_sources',
    valueColumn: 'referral_source',
    orderBy: 'referral_source',
  },
  years_experience: {
    tableName: 'years_of_experience',
    valueColumn: 'years_of_experience',
    orderBy: 'years_of_experience',
  },
  countries: {
    tableName: 'countries',
    valueColumn: 'name',
    primaryKeyCandidates: ['country_id'],
    orderBy: 'name',
    isGlobal: true, // No tenant or business filtering
    hideIdColumn: true,
    additionalColumns: [
      { key: 'code', label: 'Code', width: '100px' }
    ],
  },
  states: {
    tableName: 'states',
    valueColumn: 'name',
    primaryKeyCandidates: ['state_id'],
    orderBy: 'name',
    isGlobal: true, // No tenant or business filtering
    hideIdColumn: true,
    needsRelation: 'country', // Need to select country when adding
    selectQuery: '*, countries(name, code)',
    additionalColumns: [
      { key: 'code', label: 'State Code', width: '120px' },
      { key: 'country_name', label: 'Country', width: '150px', accessor: (item) => item.raw?.countries?.name }
    ],
  },
  cities: {
    tableName: 'cities',
    valueColumn: 'name',
    primaryKeyCandidates: ['city_id'],
    orderBy: 'name',
    isGlobal: true, // No tenant or business filtering
    hideIdColumn: true,
    needsRelation: 'state', // Need to select state when adding
    selectQuery: '*, states(name, code, countries(name, code))',
    additionalColumns: [
      { key: 'state_name', label: 'State', width: '150px', accessor: (item) => item.raw?.states?.name },
      { key: 'country_name', label: 'Country', width: '150px', accessor: (item) => item.raw?.states?.countries?.name }
    ],
  },
}

const MOCK_DATA = {
  visa_status: ['F1', 'OPT', 'STEM OPT', 'H1B', 'H4', 'H4 EAD', 'GC EAD', 'L1B', 'L2S', 'B1/B2', 'J1', 'TN', 'E3', 'GC', 'USC'],
  statuses: ['Initial Contact', 'Spoke to candidate', 'Resume needs to be prepared', 'Resume prepared and sent for review', 'Assigned to Recruiter', 'Recruiter started marketing', 'Placed into Job'],
  role_types: ['Remote', 'Hybrid Local', 'Onsite Local', 'Open to Relocate'],
  countries: ['USA', 'India'],
  years_experience: ['0', '1 to 3', '4 to 6', '7 to 9', '10 -15', '15+'],
  referral_sources: ['FB', 'Google', 'Friend'],
}

const extractPrimaryKey = (row, config) => {
  const candidates = [
    ...(config?.primaryKeyCandidates || []),
    'id',
    `${config?.tableName}_id`,
    `${config?.tableName?.replace(/s$/, '')}_id`,
  ].filter(Boolean)

  for (const key of candidates) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) {
      return { key, value: row[key] }
    }
  }

  const fallbackKey = row
    ? Object.keys(row).find(field => field.endsWith('_id'))
    : null

  if (fallbackKey) {
    return { key: fallbackKey, value: row[fallbackKey] }
  }

  return { key: 'id', value: row?.id ?? null }
}

const mapRowToItem = (row, config) => {
  const { key: primaryKeyColumn, value: primaryKeyValue } = extractPrimaryKey(row, config)

  return {
    id: primaryKeyValue,
    primaryKeyColumn,
    value: row?.[config?.valueColumn ?? 'value'] ?? '',
    business_id: row?.business_id ?? null,
    is_active: row?.[config?.toggleField] ?? row?.is_active,
    raw: row,
  }
}

const normalizeBusinessId = (value) => {
  if (!value && value !== 0) return ''
  return String(value)
}

export default function ReferenceTableEditor({ table }) {
  const { tenant } = useTenant()
  const tableConfig = TABLE_CONFIG[table.id]
  const isSupabaseBacked = Boolean(tableConfig)

  const [businesses, setBusinesses] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newItemValue, setNewItemValue] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  
  // For global tables with relations (states need countries, cities need states)
  const [relationData, setRelationData] = useState([])
  const [selectedRelationId, setSelectedRelationId] = useState('')

  const canToggleStatus = useMemo(() => Boolean(tableConfig?.toggleField), [tableConfig])

  const loadBusinesses = useCallback(async () => {
    if (!isSupabaseBacked || !tenant?.tenant_id) {
      setBusinesses([])
      return
    }

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('tenant_id', tenant.tenant_id)
      .order('created_at', { ascending: true })

    if (businessError) {
      setError(businessError.message)
      setBusinesses([])
      return
    }

    const mapped = (data || []).map((biz) => ({
      id: normalizeBusinessId(biz.id ?? biz.business_id),
      name: biz.business_name || 'Unnamed Business',
    }))

    setBusinesses(mapped)

    setSelectedBusinessId((prev) => {
      if (prev) return prev
      return mapped.length > 0 ? mapped[0].id : ''
    })
  }, [isSupabaseBacked, tenant?.tenant_id])

  const loadRelationData = useCallback(async () => {
    if (!tableConfig?.needsRelation) {
      setRelationData([])
      return
    }

    try {
      let relationTable = ''
      let selectFields = '*'
      
      if (tableConfig.needsRelation === 'country') {
        relationTable = 'countries'
        selectFields = 'country_id, name, code'
      } else if (tableConfig.needsRelation === 'state') {
        relationTable = 'states'
        selectFields = 'state_id, name, code, countries(name)'
      }

      const { data, error: relationError } = await supabase
        .from(relationTable)
        .select(selectFields)
        .order('name', { ascending: true })

      if (relationError) throw relationError

      setRelationData(data || [])
      
      // Auto-select first item if available
      if (data && data.length > 0 && !selectedRelationId) {
        const idField = tableConfig.needsRelation === 'country' ? 'country_id' : 'state_id'
        setSelectedRelationId(data[0][idField])
      }
    } catch (err) {
      console.error('Error loading relation data:', err)
      setRelationData([])
    }
  }, [tableConfig?.needsRelation, selectedRelationId])

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      if (!isSupabaseBacked) {
        const data = (MOCK_DATA[table.id] || []).map((value, index) => ({
          id: index + 1,
          value,
          business_id: null,
          is_active: true,
        }))
        setItems(data)
        setLoading(false)
        return
      }

      // Global tables don't require tenant context
      if (!tableConfig.isGlobal && !tenant?.tenant_id) {
        setItems([])
        setLoading(false)
        return
      }

      let query = supabase
        .from(tableConfig.tableName)
        .select(tableConfig.selectQuery || '*')

      // Only filter by tenant_id for non-global tables
      if (!tableConfig.isGlobal) {
        query = query.eq('tenant_id', tenant.tenant_id)
      }

      if (tableConfig.filters) {
        Object.entries(tableConfig.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Only filter by business_id for non-global tables
      if (!tableConfig.isGlobal && selectedBusinessId) {
        query = query.or(`business_id.eq.${selectedBusinessId},business_id.is.null`)
      }

      if (tableConfig.orderBy) {
        query = query.order(tableConfig.orderBy, { ascending: true })
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setItems((data || []).map((row) => mapRowToItem(row, tableConfig)))
    } catch (err) {
      setError(err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isSupabaseBacked, table.id, tableConfig, tenant?.tenant_id, selectedBusinessId])

  useEffect(() => {
    loadBusinesses()
  }, [loadBusinesses])

  useEffect(() => {
    loadRelationData()
  }, [loadRelationData])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!isSupabaseBacked) return
    if (businesses.length === 0) {
      setItems([])
    }
  }, [businesses.length, isSupabaseBacked])

  const handleAdd = async () => {
    setError('')
    setFieldError('')

    const validation = validateTextField(newItemValue, {
      required: true,
      minLength: 2,
      maxLength: 100,
      fieldName: 'Value',
    })

    if (!validation.valid) {
      setFieldError(validation.error)
      return
    }

    const trimmedValue = newItemValue.trim()

    if (items.some((item) => item.value?.toLowerCase?.() === trimmedValue.toLowerCase())) {
      setFieldError('This value already exists in the list')
      return
    }

    try {
      if (!isSupabaseBacked) {
        const newItem = {
          id: Date.now(),
          value: trimmedValue,
          business_id: null,
          is_active: true,
        }
        setItems((prev) => [...prev, newItem])
        setNewItemValue('')
        return
      }

      // For non-global tables, require business selection and tenant
      if (!tableConfig.isGlobal) {
        if (!selectedBusinessId) {
          setFieldError('Select a business before adding new values')
          return
        }

        if (!tenant?.tenant_id) {
          setError('Tenant context unavailable. Please try again later.')
          return
        }
      }

      // For global tables with relations, require relation selection
      if (tableConfig.isGlobal && tableConfig.needsRelation) {
        if (!selectedRelationId) {
          setFieldError(`Please select a ${tableConfig.needsRelation} first`)
          return
        }
      }

      const payload = {
        [tableConfig.valueColumn]: trimmedValue,
      }

      // Only add tenant_id and business_id for non-global tables
      if (!tableConfig.isGlobal) {
        payload.tenant_id = tenant.tenant_id
        payload.business_id = selectedBusinessId
      }

      // Add relation ID for global tables (country_id for states, state_id for cities)
      if (tableConfig.isGlobal && tableConfig.needsRelation) {
        if (tableConfig.needsRelation === 'country') {
          payload.country_id = selectedRelationId
        } else if (tableConfig.needsRelation === 'state') {
          payload.state_id = selectedRelationId
        }
      }

      if (tableConfig.insertDefaults) {
        Object.assign(payload, tableConfig.insertDefaults)
      }

      const { data, error: insertError } = await supabase
        .from(tableConfig.tableName)
        .insert(payload)
        .select('*')
        .maybeSingle()

      if (insertError) {
        throw insertError
      }

      if (!data) {
        throw new Error('Insert succeeded but no data returned')
      }

      setItems((prev) => [...prev, mapRowToItem(data, tableConfig)])
      setNewItemValue('')
      setFieldError('')
    } catch (err) {
      setError('Error adding item: ' + err.message)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setEditValue(item.value || '')
  }

  const handleSaveEdit = async (id) => {
    setError('')

    const validation = validateTextField(editValue, {
      required: true,
      minLength: 2,
      maxLength: 100,
      fieldName: 'Value',
    })

    if (!validation.valid) {
      setError(validation.error)
      return
    }

    const trimmedValue = editValue.trim()

    if (items.some((item) => item.id !== id && item.value?.toLowerCase?.() === trimmedValue.toLowerCase())) {
      setError('This value already exists in the list')
      return
    }

    try {
      if (!isSupabaseBacked) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, value: trimmedValue } : item)))
      } else {
        const item = items.find((row) => row.id === id)
        if (!item) {
          setError('Unable to locate the selected record.')
          return
        }

        const primaryKeyColumn = item.primaryKeyColumn || 'id'

        let updateQuery = supabase
          .from(tableConfig.tableName)
          .update({ [tableConfig.valueColumn]: trimmedValue })
          .eq(primaryKeyColumn, item.id)

        // Only filter by tenant_id for non-global tables
        if (!tableConfig.isGlobal) {
          updateQuery = updateQuery.eq('tenant_id', tenant?.tenant_id)
        }

        const { error: updateError } = await updateQuery

        if (updateError) {
          throw updateError
        }

        setItems((prev) => prev.map((row) => (row.id === id ? { ...row, value: trimmedValue } : row)))
      }

      setEditingId(null)
      setEditValue('')
    } catch (err) {
      setError('Error updating item: ' + err.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleToggleActive = async (id) => {
    if (!canToggleStatus) return

    try {
      const item = items.find((row) => row.id === id)
      if (!item) return

      if (!isSupabaseBacked) {
        setItems((prev) => prev.map((row) => (row.id === id ? { ...row, is_active: !row.is_active } : row)))
        return
      }

      const nextStatus = !item.is_active

      let toggleQuery = supabase
        .from(tableConfig.tableName)
        .update({ [tableConfig.toggleField]: nextStatus })
        .eq(item.primaryKeyColumn || 'id', item.id)

      // Only filter by tenant_id for non-global tables
      if (!tableConfig.isGlobal) {
        toggleQuery = toggleQuery.eq('tenant_id', tenant?.tenant_id)
      }

      const { error: toggleError } = await toggleQuery

      if (toggleError) {
        throw toggleError
      }

      setItems((prev) => prev.map((row) => (row.id === id ? { ...row, is_active: nextStatus } : row)))
    } catch (err) {
      alert('Error toggling status: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      if (!isSupabaseBacked) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        return
      }

      const item = items.find((row) => row.id === id)
      if (!item) {
        setError('Unable to locate the selected record.')
        return
      }

      let deleteQuery = supabase
        .from(tableConfig.tableName)
        .delete()
        .eq(item.primaryKeyColumn || 'id', item.id)

      // Only filter by tenant_id for non-global tables
      if (!tableConfig.isGlobal) {
        deleteQuery = deleteQuery.eq('tenant_id', tenant?.tenant_id)
      }

      const { error: deleteError } = await deleteQuery

      if (deleteError) {
        throw deleteError
      }

      setItems((prev) => prev.filter((row) => row.id !== id))
    } catch (err) {
      alert('Error deleting item: ' + err.message)
    }
  }

  const businessNameLookup = useMemo(() => {
    return businesses.reduce((acc, biz) => {
      acc[biz.id] = biz.name
      return acc
    }, {})
  }, [businesses])

  if (loading) {
    return <div className="loading">Loading {table.label}...</div>
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>{table.icon} {table.label}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: 'column' }}>
          {isSupabaseBacked && !tableConfig.isGlobal && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Business
                <select
                  value={selectedBusinessId}
                  onChange={(event) => setSelectedBusinessId(event.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '220px' }}
                >
                  {businesses.length === 0 && <option value="">No businesses available</option>}
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {tableConfig?.needsRelation && relationData.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tableConfig.needsRelation === 'country' ? 'Country' : 'State'}
                <select
                  value={selectedRelationId}
                  onChange={(event) => setSelectedRelationId(event.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '220px' }}
                >
                  {relationData.map((item) => {
                    const id = tableConfig.needsRelation === 'country' ? item.country_id : item.state_id
                    const label = tableConfig.needsRelation === 'state' && item.countries
                      ? `${item.name} (${item.countries.name})`
                      : `${item.name}${item.code ? ` (${item.code})` : ''}`
                    return (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={newItemValue}
              onChange={(e) => {
                setNewItemValue(e.target.value)
                setFieldError('')
              }}
              className={fieldError ? 'error' : ''}
              placeholder="New item value..."
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '250px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn btn-primary" onClick={handleAdd}>
              + Add New
            </button>
          </div>
          {fieldError && (
            <small className="error-text" style={{ marginTop: '-8px' }}>{fieldError}</small>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {isSupabaseBacked && !tableConfig?.isGlobal && businesses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <h3>No Businesses Found</h3>
          <p>Please create a business before managing {table.label.toLowerCase()}.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Items</h3>
          <p>Add your first {table.label.toLowerCase()} item</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {!tableConfig?.hideIdColumn && <th style={{ width: '60px' }}>ID</th>}
              {isSupabaseBacked && !tableConfig?.isGlobal && <th style={{ width: '180px' }}>Business</th>}
              <th>Value</th>
              {tableConfig?.additionalColumns?.map((col) => (
                <th key={col.key} style={{ width: col.width || 'auto' }}>
                  {col.label}
                </th>
              ))}
              {canToggleStatus && <th style={{ width: '120px' }}>Status</th>}
              <th style={{ width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {!tableConfig?.hideIdColumn && <td>{item.id}</td>}
                {isSupabaseBacked && !tableConfig?.isGlobal && (
                  <td>{item.business_id ? (businessNameLookup[normalizeBusinessId(item.business_id)] || 'Unknown Business') : 'Global'}</td>
                )}
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                      autoFocus
                    />
                  ) : (
                    <span style={{ opacity: item.is_active === false ? 0.5 : 1 }}>
                      {item.value}
                    </span>
                  )}
                </td>
                {tableConfig?.additionalColumns?.map((col) => (
                  <td key={col.key}>
                    {col.accessor ? col.accessor(item) : item.raw?.[col.key]}
                  </td>
                ))}
                {canToggleStatus && (
                  <td>
                    <span className={`status-badge ${item.is_active === false ? '' : 'initial-contact'}`}>
                      {item.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                )}
                <td>
                  <div className="action-buttons">
                    {editingId === item.id ? (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleSaveEdit(item.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        {canToggleStatus && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleToggleActive(item.id)}
                          >
                            {item.is_active === false ? 'Activate' : 'Deactivate'}
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
