import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../api/supabaseClient';
import './AssignUserRoles.css';

// HRMS Tier 2 Application Code - filters roles specific to HRMS application
const APPLICATION_CODE = 'HRMS';

const AssignUserRoles = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [contactTypes, setContactTypes] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    role_id: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null,
    business_ids: [],
    contact_type_ids: [],
    pipeline_ids: []
  });

  const loadUsers = useCallback(async (tenantId) => {
    const { data, error} = await supabase
      .from('profiles')
      .select(`
        *,
        user_role_assignments!user_role_assignments_user_id_fkey(
          assignment_id,
          valid_from,
          valid_until,
          user_roles(
            role_id,
            role_name,
            role_level
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('email');

    if (error) throw error;
    setUsers(data || []);
  }, []);

  const loadRoles = useCallback(async (currentUserLevel) => {
    // Only load roles that the current user can assign
    // CEO (level 5) can assign all roles
    // Manager (level 4) can assign levels 1-3
    // Lead (level 3) can assign levels 1-2
    const maxLevel = currentUserLevel === 5 ? 5 : currentUserLevel - 1;

    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('application_code', APPLICATION_CODE)  // Filter by HRMS application
      .lte('role_level', maxLevel)
      .order('role_level');

    if (error) throw error;
    setRoles(data || []);
  }, []);

  const loadBusinesses = useCallback(async (tenantId) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('business_name');

    if (error) throw error;
    setBusinesses(data || []);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get current user's profile and role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            user_role_assignments!user_role_assignments_user_id_fkey!inner(
              user_roles(*)
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setCurrentUser(profileData);
        const userRole = profileData.user_role_assignments[0]?.user_roles;
        setCurrentUserRole(userRole);

        // Check if user can manage roles
        if (!userRole?.can_manage_roles) {
          setError('You do not have permission to manage user roles.');
          setLoading(false);
          return;
        }

        // Load all users with their current roles
        await loadUsers(profileData.tenant_id);

        // Load available roles (based on current user's level)
        await loadRoles(userRole.role_level);

        // Load businesses for the tenant
        await loadBusinesses(profileData.tenant_id);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadUsers, loadRoles, loadBusinesses]);

  const loadContactTypes = async (tenantId, businessIds) => {
    if (!businessIds || businessIds.length === 0) {
      setContactTypes([]);
      return;
    }

    const { data, error } = await supabase
      .from('contact_types')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('business_id', businessIds)
      .order('type_name');

    if (error) throw error;
    setContactTypes(data || []);
  };

  const loadPipelines = async (tenantId, businessIds) => {
    if (!businessIds || businessIds.length === 0) {
      setPipelines([]);
      return;
    }

    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('business_id', businessIds)
      .order('name');

    if (error) throw error;
    setPipelines(data || []);
  };

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
    setAssignmentForm({
      role_id: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: null,
      business_ids: [],
      contact_type_ids: [],
      pipeline_ids: []
    });
    setContactTypes([]);
    setPipelines([]);
  };

  const handleRoleChange = async (e) => {
    const roleId = e.target.value;
    setAssignmentForm(prev => ({ ...prev, role_id: roleId }));

    // Find the selected role (convert to int for comparison)
    const selectedRole = roles.find(r => r.role_id === parseInt(roleId, 10));
    
    // Reset business/contact type/pipeline scoping if role doesn't need it
    if (selectedRole && selectedRole.role_level < 3) {
      setAssignmentForm(prev => ({
        ...prev,
        business_ids: [],
        contact_type_ids: [],
        pipeline_ids: []
      }));
      setContactTypes([]);
      setPipelines([]);
    }
  };

  const handleBusinessChange = async (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setAssignmentForm(prev => ({
      ...prev,
      business_ids: options,
      contact_type_ids: [], // Reset when businesses change
      pipeline_ids: []
    }));

    // Load contact types and pipelines for selected businesses
    if (options.length > 0) {
      await loadContactTypes(currentUser.tenant_id, options);
      await loadPipelines(currentUser.tenant_id, options);
    } else {
      setContactTypes([]);
      setPipelines([]);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);

      // Validate form
      if (!assignmentForm.role_id) {
        setError('Please select a role');
        return;
      }

      // Convert to int for comparison since form value is string
      const roleIdInt = parseInt(assignmentForm.role_id, 10);
      const selectedRole = roles.find(r => r.role_id === roleIdInt);

      if (!selectedRole) {
        setError('Invalid role selected');
        return;
      }

      // For Lead and Manager roles, require business selection
      if (selectedRole.role_level >= 3 && selectedRole.role_level <= 4) {
        if (assignmentForm.business_ids.length === 0) {
          setError('Please select at least one business for this role level');
          return;
        }
      }

      // Check if user can assign this role
      const { data: canAssign, error: checkError } = await supabase
        .rpc('can_assign_role', {
          p_assigner_id: currentUser.id,
          p_target_role_level: selectedRole.role_level
        });

      if (checkError) throw checkError;
      if (!canAssign) {
        setError('You do not have permission to assign this role');
        return;
      }

      // Start transaction: Remove existing role assignment if any
      const existingAssignment = selectedUser.user_role_assignments[0];
      if (existingAssignment) {
        // Delete existing business/contact type/pipeline access
        await supabase
          .from('role_business_access')
          .delete()
          .eq('assignment_id', existingAssignment.assignment_id);

        await supabase
          .from('role_contact_type_access')
          .delete()
          .eq('assignment_id', existingAssignment.assignment_id);

        await supabase
          .from('role_pipeline_access')
          .delete()
          .eq('assignment_id', existingAssignment.assignment_id);

        // Delete the role assignment
        await supabase
          .from('user_role_assignments')
          .delete()
          .eq('assignment_id', existingAssignment.assignment_id);
      }

      // Create new role assignment
      const { data: newAssignment, error: assignError } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: selectedUser.id,
          role_id: roleIdInt,
          assigned_by: currentUser.id,
          valid_from: assignmentForm.valid_from,
          valid_until: assignmentForm.valid_until || null
        })
        .select()
        .single();

      if (assignError) throw assignError;

      // Insert business access if applicable
      if (assignmentForm.business_ids.length > 0) {
        const businessAccess = assignmentForm.business_ids.map(bid => ({
          assignment_id: newAssignment.assignment_id,
          business_id: bid
        }));

        const { error: businessError } = await supabase
          .from('role_business_access')
          .insert(businessAccess);

        if (businessError) throw businessError;
      }

      // Insert contact type access if applicable
      if (assignmentForm.contact_type_ids.length > 0) {
        const contactTypeAccess = assignmentForm.contact_type_ids.map(ctid => ({
          assignment_id: newAssignment.assignment_id,
          contact_type_id: ctid
        }));

        const { error: contactTypeError } = await supabase
          .from('role_contact_type_access')
          .insert(contactTypeAccess);

        if (contactTypeError) throw contactTypeError;
      }

      // Insert pipeline access if applicable
      if (assignmentForm.pipeline_ids.length > 0) {
        const pipelineAccess = assignmentForm.pipeline_ids.map(pid => ({
          assignment_id: newAssignment.assignment_id,
          pipeline_id: pid
        }));

        const { error: pipelineError } = await supabase
          .from('role_pipeline_access')
          .insert(pipelineAccess);

        if (pipelineError) throw pipelineError;
      }

      // Reload users
      await loadUsers(currentUser.tenant_id);

      // Close modal
      setShowAssignModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error assigning role:', err);
      setError(err.message);
    }
  };

  const handleRemoveRole = async (user) => {
    if (!confirm(`Are you sure you want to remove the role assignment for ${user.email}?`)) {
      return;
    }

    try {
      setError(null);

      const assignment = user.user_role_assignments[0];
      if (!assignment) return;

      // Delete business/contact type/pipeline access
      await supabase
        .from('role_business_access')
        .delete()
        .eq('assignment_id', assignment.assignment_id);

      await supabase
        .from('role_contact_type_access')
        .delete()
        .eq('assignment_id', assignment.assignment_id);

      await supabase
        .from('role_pipeline_access')
        .delete()
        .eq('assignment_id', assignment.assignment_id);

      // Delete role assignment
      const { error: deleteError } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('assignment_id', assignment.assignment_id);

      if (deleteError) throw deleteError;

      // Reload users
      await loadUsers(currentUser.tenant_id);
    } catch (err) {
      console.error('Error removing role:', err);
      setError(err.message);
    }
  };

  const getRoleLevelClass = (level) => {
    const classes = {
      1: 'role-level-1',
      2: 'role-level-2',
      3: 'role-level-3',
      4: 'role-level-4',
      5: 'role-level-5'
    };
    return classes[level] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error && !currentUserRole?.can_manage_roles) {
    return (
      <div className="assign-user-roles">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.role_id === assignmentForm.role_id);
  const requiresBusinessScope = selectedRole && selectedRole.role_level >= 3 && selectedRole.role_level <= 4;

  return (
    <div className="assign-user-roles">
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
          <h1>Assign User Roles</h1>
          <p className="page-description">
            Assign roles to users and configure their access permissions
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Level</th>
              <th>Valid From</th>
              <th>Valid Until</th>
              <th>Business Scope</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const assignment = user.user_role_assignments[0];
              const role = assignment?.user_roles;
              const businesses = assignment?.role_business_access?.map(ba => ba.businesses.business_name) || [];

              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <strong>{user.full_name || 'No Name'}</strong>
                      {user.id === currentUser.id && (
                        <span className="current-user-badge">You</span>
                      )}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {role ? (
                      <span className={`role-badge ${getRoleLevelClass(role.role_level)}`}>
                        {role.role_name}
                      </span>
                    ) : (
                      <span className="no-role">No Role Assigned</span>
                    )}
                  </td>
                  <td>{role ? `Level ${role.role_level}` : '-'}</td>
                  <td>{assignment ? formatDate(assignment.valid_from) : '-'}</td>
                  <td>{assignment ? formatDate(assignment.valid_until) : '-'}</td>
                  <td>
                    {businesses.length > 0 ? (
                      <div className="business-tags">
                        {businesses.slice(0, 2).map((b, i) => (
                          <span key={i} className="tag tag-info">{b}</span>
                        ))}
                        {businesses.length > 2 && (
                          <span className="tag tag-secondary">+{businesses.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="all-scope">All Businesses</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleAssignRole(user)}
                        title={assignment ? "Change Role" : "Assign Role"}
                      >
                        {assignment ? '✏️' : '➕'}
                      </button>
                      {assignment && user.id !== currentUser.id && (
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleRemoveRole(user)}
                          title="Remove Role"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser.user_role_assignments[0] ? 'Change' : 'Assign'} Role for {selectedUser.email}</h2>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment}>
              <div className="modal-body">
                <div className="form-section">
                  <h3>Role Selection</h3>
                  
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={assignmentForm.role_id}
                      onChange={handleRoleChange}
                      required
                    >
                      <option value="">Select a role...</option>
                      {roles.map(role => (
                        <option key={role.role_id} value={role.role_id}>
                          Level {role.role_level} - {role.role_name}
                        </option>
                      ))}
                    </select>
                    <small>You can only assign roles at or below your level</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valid From *</label>
                      <input
                        type="date"
                        value={assignmentForm.valid_from}
                        onChange={(e) => setAssignmentForm(prev => ({
                          ...prev,
                          valid_from: e.target.value
                        }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Valid Until (Optional)</label>
                      <input
                        type="date"
                        value={assignmentForm.valid_until || ''}
                        onChange={(e) => setAssignmentForm(prev => ({
                          ...prev,
                          valid_until: e.target.value || null
                        }))}
                        min={assignmentForm.valid_from}
                      />
                      <small>Leave empty for no expiration</small>
                    </div>
                  </div>
                </div>

                {requiresBusinessScope && (
                  <>
                    <div className="form-section">
                      <h3>Business Scope (Required for Level 3-4)</h3>
                      
                      <div className="form-group">
                        <label>Accessible Businesses *</label>
                        <select
                          multiple
                          value={assignmentForm.business_ids}
                          onChange={handleBusinessChange}
                          className="multi-select"
                          size={Math.min(businesses.length, 5)}
                          required
                        >
                          {businesses.map(business => (
                            <option key={business.id} value={business.id}>
                              {business.business_name}
                            </option>
                          ))}
                        </select>
                        <small>Hold Ctrl/Cmd to select multiple businesses</small>
                      </div>
                    </div>

                    {assignmentForm.business_ids.length > 0 && (
                      <div className="form-section">
                        <h3>Contact Type & Pipeline Scope (Optional)</h3>
                        
                        <div className="form-group">
                          <label>Accessible Contact Types</label>
                          <select
                            multiple
                            value={assignmentForm.contact_type_ids}
                            onChange={(e) => setAssignmentForm(prev => ({
                              ...prev,
                              contact_type_ids: Array.from(e.target.selectedOptions, opt => opt.value)
                            }))}
                            className="multi-select"
                            size={Math.min(contactTypes.length || 3, 5)}
                          >
                            {contactTypes.map(ct => (
                              <option key={ct.id} value={ct.id}>
                                {ct.type_name}
                              </option>
                            ))}
                          </select>
                          <small>Leave empty to allow all contact types within selected businesses</small>
                        </div>

                        <div className="form-group">
                          <label>Accessible Pipelines</label>
                          <select
                            multiple
                            value={assignmentForm.pipeline_ids}
                            onChange={(e) => setAssignmentForm(prev => ({
                              ...prev,
                              pipeline_ids: Array.from(e.target.selectedOptions, opt => opt.value)
                            }))}
                            className="multi-select"
                            size={Math.min(pipelines.length || 3, 5)}
                          >
                            {pipelines.map(pipeline => (
                              <option key={pipeline.id} value={pipeline.id}>
                                {pipeline.name}
                              </option>
                            ))}
                          </select>
                          <small>Leave empty to allow all pipelines within selected businesses</small>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedUser.user_role_assignments[0] ? 'Update Assignment' : 'Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignUserRoles;
