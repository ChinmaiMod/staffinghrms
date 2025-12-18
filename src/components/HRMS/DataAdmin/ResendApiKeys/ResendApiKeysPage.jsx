import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthProvider';
import { useTenant } from '../../../../contexts/TenantProvider';
import { supabase } from '../../../../api/supabaseClient';

export default function ResendApiKeysPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [apiConfigs, setApiConfigs] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    business_id: '',
    resend_api_key: '',
    from_email: '',
    from_name: '',
    is_active: true
  });

  useEffect(() => {
    if (tenant?.tenant_id) {
      loadBusinesses();
      loadApiConfigs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.tenant_id]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('business_id, business_name')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .order('business_name');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError('Failed to load businesses');
    }
  };

  const loadApiConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_resend_api_keys')
        .select(`
          *,
          business:businesses(business_name)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiConfigs(data || []);
    } catch (err) {
      console.error('Error loading API configs:', err);
      setError('Failed to load API configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.business_id || !formData.resend_api_key || !formData.from_email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('business_resend_api_keys')
        .insert([{
          tenant_id: tenant.tenant_id,
          business_id: formData.business_id,
          resend_api_key: formData.resend_api_key,
          from_email: formData.from_email,
          from_name: formData.from_name || null,
          is_active: formData.is_active,
          created_by: user?.id,
          updated_by: user?.id
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('API configuration already exists for this business');
        }
        throw insertError;
      }

      setSuccess('Resend API configuration added successfully');
      setFormData({
        business_id: '',
        resend_api_key: '',
        from_email: '',
        from_name: '',
        is_active: true
      });
      setShowAddForm(false);
      await loadApiConfigs();
    } catch (err) {
      console.error('Error adding API config:', err);
      setError(err.message || 'Failed to add API configuration');
    }
  };

  const handleUpdate = async (configId) => {
    setError('');
    setSuccess('');

    const config = apiConfigs.find(c => c.config_id === configId);
    if (!config) return;

    try {
      const { error: updateError } = await supabase
        .from('business_resend_api_keys')
        .update({
          resend_api_key: config.resend_api_key,
          from_email: config.from_email,
          from_name: config.from_name || null,
          is_active: config.is_active,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('config_id', configId);

      if (updateError) throw updateError;

      setSuccess('API configuration updated successfully');
      setEditingId(null);
      await loadApiConfigs();
    } catch (err) {
      console.error('Error updating API config:', err);
      setError(err.message || 'Failed to update API configuration');
    }
  };

  const handleDelete = async (configId, businessName) => {
    if (!window.confirm(`Are you sure you want to delete the API configuration for ${businessName}? Emails will fall back to the system default.`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('business_resend_api_keys')
        .delete()
        .eq('config_id', configId);

      if (deleteError) throw deleteError;

      setSuccess('API configuration deleted successfully');
      await loadApiConfigs();
    } catch (err) {
      console.error('Error deleting API config:', err);
      setError('Failed to delete API configuration');
    }
  };

  const handleEdit = (config) => {
    setEditingId(config.config_id);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    loadApiConfigs(); // Reload to reset any changes
  };

  const handleFieldChange = (configId, field, value) => {
    setApiConfigs(prev => prev.map(config =>
      config.config_id === configId
        ? { ...config, [field]: value }
        : config
    ));
  };

  const getAvailableBusinesses = () => {
    const configuredBusinessIds = apiConfigs.map(c => c.business_id);
    return businesses.filter(b => !configuredBusinessIds.includes(b.business_id));
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#111827' }}>
            Configure Resend API Keys
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            Configure custom Resend API keys per business to send emails from your own domain
          </p>
        </div>
        {!showAddForm && getAvailableBusinesses().length > 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            + Add API Configuration
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '16px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#d1fae5',
          border: '1px solid #a7f3d0',
          borderRadius: '6px',
          marginBottom: '16px',
          color: '#065f46',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
            Add New API Configuration
          </h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Business <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={formData.business_id}
                  onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Business</option>
                  {getAvailableBusinesses().map(business => (
                    <option key={business.business_id} value={business.business_id}>
                      {business.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Resend API Key <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.resend_api_key}
                  onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
                  placeholder="re_..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  From Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  placeholder="noreply@yourbusiness.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  Must be verified in your Resend account
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  From Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  placeholder="Your Business Name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Active (Use this configuration for sending emails)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">
                Add Configuration
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    business_id: '',
                    resend_api_key: '',
                    from_email: '',
                    from_name: '',
                    is_active: true
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Configurations List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading configurations...
        </div>
      ) : apiConfigs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            No API Configurations Yet
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto' }}>
            Configure Resend API keys for your businesses to send emails from your own domain. 
            Each business can have its own email configuration.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Business
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  API Key
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  From Email
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  From Name
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {apiConfigs.map((config) => (
                <tr key={config.config_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      {config.business?.business_name || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === config.config_id ? (
                      <input
                        type="text"
                        value={config.resend_api_key}
                        onChange={(e) => handleFieldChange(config.config_id, 'resend_api_key', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    ) : (
                      <code style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {config.resend_api_key.substring(0, 8)}...{config.resend_api_key.substring(config.resend_api_key.length - 4)}
                      </code>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === config.config_id ? (
                      <input
                        type="email"
                        value={config.from_email}
                        onChange={(e) => handleFieldChange(config.config_id, 'from_email', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {config.from_email}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === config.config_id ? (
                      <input
                        type="text"
                        value={config.from_name || ''}
                        onChange={(e) => handleFieldChange(config.config_id, 'from_name', e.target.value)}
                        placeholder="Optional"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {config.from_name || '-'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {editingId === config.config_id ? (
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={config.is_active}
                          onChange={(e) => handleFieldChange(config.config_id, 'is_active', e.target.checked)}
                          style={{ marginRight: '6px' }}
                        />
                        Active
                      </label>
                    ) : (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: config.is_active ? '#d1fae5' : '#fee2e2',
                        color: config.is_active ? '#065f46' : '#991b1b',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '12px'
                      }}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {editingId === config.config_id ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleUpdate(config.config_id)}
                          className="btn btn-sm btn-primary"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn btn-sm btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(config)}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(config.config_id, config.business?.business_name)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', margin: '0 0 8px 0' }}>
          📧 How It Works
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
          <li>Configure a Resend API key for each business to send emails from your own domain</li>
          <li>The &quot;From Email&quot; must be verified in your Resend account</li>
          <li>System will use business-specific API keys for all business-related emails</li>
          <li>Registration and password reset emails will use the system default API key</li>
          <li>If no business API key is configured, the system will fall back to the default</li>
        </ul>
      </div>
    </div>
  );
}

