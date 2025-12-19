import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import ClientContactModal from './ClientContactModal'
import './ClientDetail.css'

/**
 * ClientDetail - Client detail page
 * URL: /hrms/clients/:clientId
 * Based on UI_DESIGN_DOCS/06_CLIENT_MANAGEMENT.md
 */
function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [client, setClient] = useState(null)
  const [contacts, setContacts] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    if (clientId && tenant?.tenant_id) {
      fetchClient()
      fetchContacts()
    }
  }, [clientId, tenant?.tenant_id])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError
      setClient(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching client:', err)
      setError(err.message || 'Failed to load client')
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId)
        .eq('tenant_id', tenant.tenant_id)
        .eq('contact_type', 'Client Empanelment')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setContacts(data || [])
    } catch (err) {
      console.error('Error fetching contacts:', err)
    }
  }

  const handleContactAdded = () => {
    fetchContacts()
    setShowContactModal(false)
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading client..." />
  }

  if (error || !client) {
    return (
      <div className="client-detail-container">
        <div className="error-banner">
          <p>{error || 'Client not found'}</p>
          <Link to="/hrms/clients" className="btn btn-secondary">
            Back to Clients
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="client-detail-container">
      <div className="detail-header">
        <Link to="/hrms/clients" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Clients
        </Link>
        <div className="header-content">
          <div className="client-title-section">
            <div className="client-title-row">
              <BuildingOfficeIcon className="client-icon-large" />
              <div>
                <h1 className="client-name">{client.client_name}</h1>
                <div className="client-meta">
                  {client.industry && <span className="meta-badge">{client.industry}</span>}
                  <span
                    className={`status-badge ${
                      client.status === 'ACTIVE' ? 'status-active' : 'status-inactive'
                    }`}
                  >
                    {client.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to={`/hrms/clients/${clientId}/edit`} className="btn btn-primary">
              <PencilIcon className="icon-sm" />
              Edit Client
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Contacts ({contacts.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="detail-grid">
            {/* Summary Card */}
            <div className="detail-card">
              <h2 className="card-title">Summary</h2>
              <div className="detail-list">
                {client.website && (
                  <div className="detail-item">
                    <span className="detail-label">Website:</span>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="detail-value-link">
                      {client.website}
                    </a>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(client.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Card */}
            {(client.address || client.city) && (
              <div className="detail-card">
                <h2 className="card-title">Address</h2>
                <div className="address-content">
                  {client.address && <div>{client.address}</div>}
                  {(client.city || client.state) && (
                    <div>
                      {client.city}
                      {client.city && client.state && ', '}
                      {client.state}
                    </div>
                  )}
                  {client.postal_code && <div>{client.postal_code}</div>}
                  {client.country && <div>{client.country}</div>}
                </div>
              </div>
            )}

            {/* Primary Contact Card */}
            {(client.primary_contact_email || client.primary_contact_phone) && (
              <div className="detail-card">
                <h2 className="card-title">Primary Contact</h2>
                <div className="contact-content">
                  {client.primary_contact_email && (
                    <div className="contact-item">
                      <EnvelopeIcon className="icon-sm" />
                      <a href={`mailto:${client.primary_contact_email}`}>{client.primary_contact_email}</a>
                    </div>
                  )}
                  {client.primary_contact_phone && (
                    <div className="contact-item">
                      <PhoneIcon className="icon-sm" />
                      <a href={`tel:${client.primary_contact_phone}`}>{client.primary_contact_phone}</a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="detail-card">
              <h2 className="card-title">Notes</h2>
              <p className="notes-content">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="tab-content">
          <div className="contacts-header">
            <h2 className="section-title">Client Contacts</h2>
            <button className="btn btn-primary" onClick={() => setShowContactModal(true)}>
              <PlusIcon className="icon-sm" />
              Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="empty-state">
              <p>No contacts found</p>
              <button className="btn btn-primary" onClick={() => setShowContactModal(true)}>
                Add First Contact
              </button>
            </div>
          ) : (
            <div className="contacts-list">
              {contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  <div className="contact-info">
                    <div className="contact-name">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.email && (
                      <div className="contact-email">
                        <EnvelopeIcon className="icon-sm" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="contact-phone">
                        <PhoneIcon className="icon-sm" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showContactModal && (
        <ClientContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onSuccess={handleContactAdded}
          clientId={clientId}
        />
      )}
    </div>
  )
}

export default ClientDetail
