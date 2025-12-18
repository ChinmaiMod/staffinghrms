import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../api/supabaseClient';
import { useAuth } from '../../../contexts/AuthProvider';
import './UserRolesManagement.css';

// HRMS Tier 2 Application Code - filters roles specific to HRMS application
const APPLICATION_CODE = 'HRMS';

/**
 * User Roles Management Component
 * Only accessible by CEO/Super Admin (role_level = 5)
 * Allows creation and management of user roles with granular permissions
 */
function UserRolesManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [roles, setRoles] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    role_name: '',
    role_code: '',
    role_level: 2,
    description: '',
    can_create_records: false,
    can_edit_own_records: false,
    can_edit_subordinate_records: false,
    can_edit_peer_records: false,
    can_edit_all_records: false,
    can_delete_own_records: false,
    can_delete_subordinate_records: false,
    can_delete_peer_records: false,
    can_delete_all_records: false,
    can_view_own_records: true,
    can_view_subordinate_records: false,
    can_view_peer_records: false,
    can_view_all_records: false,
    can_assign_roles: false,
    can_manage_users: false,
    can_manage_businesses: false,
    can_manage_roles: false,
  });
  
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('application_code', APPLICATION_CODE)  // Filter by HRMS application
        .order('role_level', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Failed to load roles: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMenuItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .eq('application_code', APPLICATION_CODE)  // Filter by HRMS application
        .order('display_order');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      console.error('Error loading menu items:', err);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadMenuItems();
  }, [loadRoles, loadMenuItems]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMenuItemToggle = (menuItemId) => {
    setSelectedMenuItems(prev => {
      if (prev.includes(menuItemId)) {
        return prev.filter(id => id !== menuItemId);
      } else {
        return [...prev, menuItemId];
      }
    });
  };

  const handleSelectAllMenus = () => {
    setSelectedMenuItems(menuItems.map(item => item.menu_item_id));
  };

  const handleDeselectAllMenus = () => {
    setSelectedMenuItems([]);
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      role_name: '',
      role_code: '',
      role_level: 2,
      description: '',
      can_create_records: false,
      can_edit_own_records: false,
      can_edit_subordinate_records: false,
      can_edit_peer_records: false,
      can_edit_all_records: false,
      can_delete_own_records: false,
      can_delete_subordinate_records: false,
      can_delete_peer_records: false,
      can_delete_all_records: false,
      can_view_own_records: true,
      can_view_subordinate_records: false,
      can_view_peer_records: false,
      can_view_all_records: false,
      can_assign_roles: false,
      can_manage_users: false,
      can_manage_businesses: false,
      can_manage_roles: false,
    });
    setSelectedMenuItems([]);
    setShowModal(true);
  };

  const openEditModal = async (role) => {
    setEditingRole(role);
    setFormData({
      role_name: role.role_name,
      role_code: role.role_code,
      role_level: role.role_level,
      description: role.description || '',
      can_create_records: role.can_create_records,
      can_edit_own_records: role.can_edit_own_records,
      can_edit_subordinate_records: role.can_edit_subordinate_records,
      can_edit_peer_records: role.can_edit_peer_records || false,
      can_edit_all_records: role.can_edit_all_records,
      can_delete_own_records: role.can_delete_own_records,
      can_delete_subordinate_records: role.can_delete_subordinate_records,
      can_delete_peer_records: role.can_delete_peer_records || false,
      can_delete_all_records: role.can_delete_all_records,
      can_view_own_records: role.can_view_own_records,
      can_view_subordinate_records: role.can_view_subordinate_records,
      can_view_peer_records: role.can_view_peer_records || false,
      can_view_all_records: role.can_view_all_records,
      can_assign_roles: role.can_assign_roles,
      can_manage_users: role.can_manage_users,
      can_manage_businesses: role.can_manage_businesses,
      can_manage_roles: role.can_manage_roles,
    });
    
    // Load existing menu permissions
    const { data, error } = await supabase
      .from('role_menu_permissions')
      .select('menu_item_id')
      .eq('role_id', role.role_id)
      .eq('can_access', true);
    
    if (!error && data) {
      setSelectedMenuItems(data.map(p => p.menu_item_id));
    }
    
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let roleId;

      if (editingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({
            ...formData,
            application_code: APPLICATION_CODE,  // Ensure HRMS application scope
            updated_by: profile.id,
          })
          .eq('role_id', editingRole.role_id);

        if (updateError) throw updateError;
        roleId = editingRole.role_id;

        // Delete existing menu permissions
        await supabase
          .from('role_menu_permissions')
          .delete()
          .eq('role_id', roleId);
      } else {
        // Create new role
        const { data: newRole, error: insertError} = await supabase
          .from('user_roles')
          .insert([{
            ...formData,
            application_code: APPLICATION_CODE,  // Set HRMS application scope
            created_by: profile.id,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        roleId = newRole.role_id;
      }

      // Insert menu permissions
      if (selectedMenuItems.length > 0) {
        const menuPermissions = selectedMenuItems.map(menuItemId => ({
          role_id: roleId,
          menu_item_id: menuItemId,
          can_access: true,
        }));

        const { error: permError } = await supabase
          .from('role_menu_permissions')
          .insert(menuPermissions);

        if (permError) throw permError;
      }

      setShowModal(false);
      loadRoles();
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system_role) {
      alert('System roles cannot be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${role.role_name}"? This will unassign all users from this role.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('role_id', role.role_id);

      if (error) throw error;
      loadRoles();
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Failed to delete role: ' + err.message);
    }
  };

  const getRoleLevelName = (level) => {
    const levels = {
      1: 'Level 1 - Read Only',
      2: 'Level 2 - Recruiter',
      3: 'Level 3 - Lead',
      4: 'Level 4 - Manager',
      5: 'Level 5 - CEO/Super Admin',
    };
    return levels[level] || `Level ${level}`;
  };

  const handlePresetRole = (level) => {
    const presets = {
      1: { // Read Only
        can_create_records: false,
        can_edit_own_records: false,
        can_edit_subordinate_records: false,
        can_edit_peer_records: false,
        can_edit_all_records: false,
        can_delete_own_records: false,
        can_delete_subordinate_records: false,
        can_delete_peer_records: false,
        can_delete_all_records: false,
        can_view_own_records: true,
        can_view_subordinate_records: false,
        can_view_peer_records: false,
        can_view_all_records: false,
        can_assign_roles: false,
        can_manage_users: false,
        can_manage_businesses: false,
        can_manage_roles: false,
      },
      2: { // Recruiter
        can_create_records: true,
        can_edit_own_records: true,
        can_edit_subordinate_records: false,
        can_edit_peer_records: true,
        can_edit_all_records: false,
        can_delete_own_records: true,
        can_delete_subordinate_records: false,
        can_delete_peer_records: false,
        can_delete_all_records: false,
        can_view_own_records: true,
        can_view_subordinate_records: false,
        can_view_peer_records: true,
        can_view_all_records: false,
        can_assign_roles: false,
        can_manage_users: false,
        can_manage_businesses: false,
        can_manage_roles: false,
      },
      3: { // Lead
        can_create_records: true,
        can_edit_own_records: true,
        can_edit_subordinate_records: true,
        can_edit_peer_records: true,
        can_edit_all_records: false,
        can_delete_own_records: true,
        can_delete_subordinate_records: true,
        can_delete_peer_records: false,
        can_delete_all_records: false,
        can_view_own_records: true,
        can_view_subordinate_records: true,
        can_view_peer_records: true,
        can_view_all_records: false,
        can_assign_roles: true,
        can_manage_users: false,
        can_manage_businesses: false,
        can_manage_roles: false,
      },
      4: { // Manager
        can_create_records: true,
        can_edit_own_records: true,
        can_edit_subordinate_records: true,
        can_edit_peer_records: true,
        can_edit_all_records: false,
        can_delete_own_records: true,
        can_delete_subordinate_records: true,
        can_delete_peer_records: true,
        can_delete_all_records: false,
        can_view_own_records: true,
        can_view_subordinate_records: true,
        can_view_peer_records: true,
        can_view_all_records: false,
        can_assign_roles: true,
        can_manage_users: true,
        can_manage_businesses: false,
        can_manage_roles: false,
      },
      5: { // CEO
        can_create_records: true,
        can_edit_own_records: true,
        can_edit_subordinate_records: true,
        can_edit_peer_records: true,
        can_edit_all_records: true,
        can_delete_own_records: true,
        can_delete_subordinate_records: true,
        can_delete_peer_records: true,
        can_delete_all_records: true,
        can_view_own_records: true,
        can_view_subordinate_records: true,
        can_view_peer_records: true,
        can_view_all_records: true,
        can_assign_roles: true,
        can_manage_users: true,
        can_manage_businesses: true,
        can_manage_roles: true,
      },
    };

    if (presets[level]) {
      setFormData(prev => ({ ...prev, ...presets[level] }));
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading roles...</div>;
  }

  return (
    <div className="user-roles-management">
      <div style={{ marginBottom: '16px' }}>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/hrms/data-admin')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '14px',
            padding: '8px 16px'
          }}
        >
          ← Back to All Tables
        </button>
      </div>
      
      <div className="page-header">
        <div>
          <h1>🔐 User Roles Management</h1>
          <p className="page-description">
            Create and manage user roles with customizable permissions and page access
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          ➕ Create New Role
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role.role_id} className="role-card">
            <div className="role-card-header">
              <div>
                <h3>{role.role_name}</h3>
                <span className={`role-level role-level-${role.role_level}`}>
                  {getRoleLevelName(role.role_level)}
                </span>
                {role.is_system_role && (
                  <span className="system-role-badge">System Role</span>
                )}
              </div>
              <div className="role-actions">
                <button 
                  className="btn-icon" 
                  onClick={() => openEditModal(role)}
                  title="Edit Role"
                >
                  ✏️
                </button>
                {!role.is_system_role && (
                  <button 
                    className="btn-icon btn-danger" 
                    onClick={() => handleDeleteRole(role)}
                    title="Delete Role"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            
            {role.description && (
              <p className="role-description">{role.description}</p>
            )}

            <div className="role-permissions-summary">
              <h4>Permissions:</h4>
              <div className="permission-tags">
                {role.can_create_records && <span className="tag tag-success">Create</span>}
                {role.can_edit_own_records && <span className="tag tag-info">Edit Own</span>}
                {role.can_edit_peer_records && <span className="tag tag-info">Edit Peers</span>}
                {role.can_edit_subordinate_records && <span className="tag tag-info">Edit Subordinates</span>}
                {role.can_edit_all_records && <span className="tag tag-warning">Edit All</span>}
                {role.can_delete_own_records && <span className="tag tag-danger">Delete Own</span>}
                {role.can_delete_peer_records && <span className="tag tag-danger">Delete Peers</span>}
                {role.can_delete_subordinate_records && <span className="tag tag-danger">Delete Subordinates</span>}
                {role.can_delete_all_records && <span className="tag tag-danger">Delete All</span>}
                {role.can_view_peer_records && <span className="tag tag-primary">View Peers</span>}
                {role.can_view_all_records && <span className="tag tag-primary">View All</span>}
                {role.can_assign_roles && <span className="tag tag-special">Assign Roles</span>}
                {role.can_manage_users && <span className="tag tag-special">Manage Users</span>}
                {role.can_manage_businesses && <span className="tag tag-special">Manage Businesses</span>}
                {role.can_manage_roles && <span className="tag tag-special">Manage Roles</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Role Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? '✏️ Edit Role' : '➕ Create New Role'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Basic Information */}
                <section className="form-section">
                  <h3>Basic Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="role_name">Role Name *</label>
                    <input
                      type="text"
                      id="role_name"
                      name="role_name"
                      value={formData.role_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Senior Recruiter"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="role_code">Role Code *</label>
                    <input
                      type="text"
                      id="role_code"
                      name="role_code"
                      value={formData.role_code}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., SENIOR_RECRUITER (uppercase, underscores)"
                      disabled={editingRole?.is_system_role}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="role_level">Role Level *</label>
                    <select
                      id="role_level"
                      name="role_level"
                      value={formData.role_level}
                      onChange={(e) => {
                        handleInputChange(e);
                        handlePresetRole(parseInt(e.target.value));
                      }}
                      required
                      disabled={editingRole?.is_system_role}
                    >
                      <option value={1}>Level 1 - Read Only</option>
                      <option value={2}>Level 2 - Recruiter</option>
                      <option value={3}>Level 3 - Lead</option>
                      <option value={4}>Level 4 - Manager</option>
                      <option value={5}>Level 5 - CEO/Super Admin</option>
                    </select>
                    <small>Selecting a level applies default permissions. You can customize them below.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe the responsibilities and scope of this role"
                    />
                  </div>
                </section>

                {/* Data Permissions */}
                <section className="form-section">
                  <h3>Data Permissions</h3>
                  
                  <div className="permission-grid">
                    <div className="permission-category">
                      <h4>📝 Create</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_create_records"
                          checked={formData.can_create_records}
                          onChange={handleInputChange}
                        />
                        <span>Can create new records</span>
                      </label>
                    </div>

                    <div className="permission-category">
                      <h4>👁️ View</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_view_own_records"
                          checked={formData.can_view_own_records}
                          onChange={handleInputChange}
                        />
                        <span>Can view own records</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_view_peer_records"
                          checked={formData.can_view_peer_records}
                          onChange={handleInputChange}
                        />
                        <span>Can view peers&rsquo; records (same role level)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_view_subordinate_records"
                          checked={formData.can_view_subordinate_records}
                          onChange={handleInputChange}
                        />
                        <span>Can view subordinates&rsquo; records</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_view_all_records"
                          checked={formData.can_view_all_records}
                          onChange={handleInputChange}
                        />
                        <span>Can view all records</span>
                      </label>
                    </div>

                    <div className="permission-category">
                      <h4>✏️ Edit</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_edit_own_records"
                          checked={formData.can_edit_own_records}
                          onChange={handleInputChange}
                        />
                        <span>Can edit own records</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_edit_peer_records"
                          checked={formData.can_edit_peer_records}
                          onChange={handleInputChange}
                        />
                        <span>Can edit peers&rsquo; records (same role level)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_edit_subordinate_records"
                          checked={formData.can_edit_subordinate_records}
                          onChange={handleInputChange}
                        />
                        <span>Can edit subordinates&rsquo; records</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_edit_all_records"
                          checked={formData.can_edit_all_records}
                          onChange={handleInputChange}
                        />
                        <span>Can edit all records</span>
                      </label>
                    </div>

                    <div className="permission-category">
                      <h4>🗑️ Delete</h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_delete_own_records"
                          checked={formData.can_delete_own_records}
                          onChange={handleInputChange}
                        />
                        <span>Can delete own records</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_delete_peer_records"
                          checked={formData.can_delete_peer_records}
                          onChange={handleInputChange}
                        />
                        <span>Can delete peers&rsquo; records (same role level)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_delete_subordinate_records"
                          checked={formData.can_delete_subordinate_records}
                          onChange={handleInputChange}
                        />
                        <span>Can delete subordinates&rsquo; records</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="can_delete_all_records"
                          checked={formData.can_delete_all_records}
                          onChange={handleInputChange}
                        />
                        <span>Can delete all records</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Management Permissions */}
                <section className="form-section">
                  <h3>Management Permissions</h3>
                  
                  <div className="permission-list">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="can_assign_roles"
                        checked={formData.can_assign_roles}
                        onChange={handleInputChange}
                      />
                      <span>Can assign roles to users (lower level roles only)</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="can_manage_users"
                        checked={formData.can_manage_users}
                        onChange={handleInputChange}
                      />
                      <span>Can manage user accounts</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="can_manage_businesses"
                        checked={formData.can_manage_businesses}
                        onChange={handleInputChange}
                      />
                      <span>Can manage businesses</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="can_manage_roles"
                        checked={formData.can_manage_roles}
                        onChange={handleInputChange}
                      />
                      <span>Can manage roles (CEO only)</span>
                    </label>
                  </div>
                </section>

                {/* Page Access */}
                <section className="form-section">
                  <h3>Page Access</h3>
                  <p>Select which pages this role can access:</p>
                  
                  <div className="menu-actions">
                    <button type="button" className="btn-secondary" onClick={handleSelectAllMenus}>
                      Select All
                    </button>
                    <button type="button" className="btn-secondary" onClick={handleDeselectAllMenus}>
                      Deselect All
                    </button>
                  </div>

                  <div className="menu-items-list">
                    {menuItems.map(item => (
                      <label key={item.menu_item_id} className="checkbox-label menu-item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedMenuItems.includes(item.menu_item_id)}
                          onChange={() => handleMenuItemToggle(item.menu_item_id)}
                        />
                        <span>
                          {item.icon && <span className="menu-icon">{item.icon}</span>}
                          {item.item_name}
                          {item.item_path && <code className="menu-path">{item.item_path}</code>}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserRolesManagement;
