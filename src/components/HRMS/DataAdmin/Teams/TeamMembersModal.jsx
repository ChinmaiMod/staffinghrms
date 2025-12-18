import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthProvider';
import { useTenant } from '../../../../contexts/TenantProvider';
import { supabase } from '../../../../api/supabaseClient';

const TeamMembersModal = ({ team, onClose }) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [members, setMembers] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedRole, setSelectedRole] = useState('RECRUITER');
  const [selectedLead, setSelectedLead] = useState(''); // For linking recruiter to lead
  const [error, setError] = useState('');

  useEffect(() => {
    if (team?.team_id && tenant?.tenant_id) {
      loadMembers();
      loadAvailableStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.team_id, tenant?.tenant_id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          staff:internal_staff(
            staff_id,
            first_name,
            last_name,
            email,
            job_title,
            department
          )
        `)
        .eq('team_id', team.team_id)
        .eq('is_active', true)
        .order('role', { ascending: false })
        .order('assigned_at');

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error loading team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStaff = async () => {
    if (!tenant?.tenant_id) {
      console.log('No tenant_id available');
      setError('No tenant ID found');
      return;
    }
    
    try {
      console.log('Loading staff for tenant:', tenant.tenant_id);
      
      const { data, error } = await supabase
        .from('internal_staff')
        .select('staff_id, first_name, last_name, email, job_title, department')
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'ACTIVE')
        .order('first_name');

      console.log('Staff query result:', { data, error });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.warn('No active staff found for tenant');
        setError('No active staff members found. Please add staff in Data Administration → Internal Staff');
      } else {
        console.log(`Loaded ${data.length} staff members`);
        setAvailableStaff(data || []);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(`Failed to load available staff: ${err.message}`);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedStaff) {
      setError('Please select a staff member');
      return;
    }

    // Validation: Recruiters should have a lead (but not required for flexibility)
    // No validation needed for leads (manager is optional) or managers

    try {
      const payload = {
        team_id: team.team_id,
        staff_id: selectedStaff,
        role: selectedRole,
        assigned_by: user?.id,
        is_active: true
      };

      // Set reports_to_member_id based on role
      if (selectedRole === 'RECRUITER' && selectedLead) {
        // Recruiter reports to a lead
        payload.reports_to_member_id = selectedLead;
      } else if (selectedRole === 'LEAD' && selectedLead) {
        // Lead reports to a manager
        payload.reports_to_member_id = selectedLead;
      }
      // Managers have no reports_to_member_id (remains NULL)

      const { error } = await supabase
        .from('team_members')
        .insert([payload]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('This staff member is already assigned to this team');
        }
        throw error;
      }

      setSelectedStaff('');
      setSelectedRole('RECRUITER');
      setSelectedLead('');
      setShowAddForm(false);
      await loadMembers();
      await loadAvailableStaff();
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(err.message || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (memberId, staffName) => {
    if (!window.confirm(`Remove ${staffName} from this team?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('member_id', memberId);

      if (error) throw error;
      await loadMembers();
      await loadAvailableStaff();
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member');
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('member_id', memberId);

      if (error) throw error;
      await loadMembers();
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role');
    }
  };

  const assignedStaffIds = members.map(m => m.staff_id);
  const filteredAvailableStaff = availableStaff.filter(
    staff => !assignedStaffIds.includes(staff.staff_id)
  );

  const managers = members.filter(m => m.role === 'MANAGER');
  const leads = members.filter(m => m.role === 'LEAD');
  const recruiters = members.filter(m => m.role === 'RECRUITER');

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Team Members
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
              {team.team_name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Add Member Button/Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
              style={{ marginBottom: '24px' }}
            >
              + Add Team Member
            </button>
          ) : (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Add Team Member
              </h3>
              <form onSubmit={handleAddMember}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                      Staff Member <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Staff Member</option>
                      {filteredAvailableStaff.map((staff) => (
                        <option key={staff.staff_id} value={staff.staff_id}>
                          {staff.first_name} {staff.last_name}{staff.job_title ? ` - ${staff.job_title}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                      Role <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={selectedRole}
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                        // Reset selected lead/manager when changing role
                        if (e.target.value === 'MANAGER') {
                          setSelectedLead('');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="RECRUITER">Recruiter</option>
                      <option value="LEAD">Lead</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>

                  {/* Show lead selector when adding a recruiter */}
                  {selectedRole === 'RECRUITER' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                        Reports To (Lead) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        required
                        value={selectedLead}
                        onChange={(e) => setSelectedLead(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Select Team Lead</option>
                        {leads.map((member) => (
                          <option key={member.member_id} value={member.member_id}>
                            {member.staff.first_name} {member.staff.last_name}
                            {member.staff.job_title ? ` - ${member.staff.job_title}` : ''}
                          </option>
                        ))}
                      </select>
                      {leads.length === 0 && (
                        <small style={{ display: 'block', color: '#ef4444', marginTop: '4px' }}>
                          Please add a team lead first before adding recruiters
                        </small>
                      )}
                    </div>
                  )}

                  {/* Show manager selector when adding a lead */}
                  {selectedRole === 'LEAD' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                        Reports To (Manager) <span style={{ color: '#9ca3af' }}>(Optional)</span>
                      </label>
                      <select
                        value={selectedLead}
                        onChange={(e) => setSelectedLead(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">No Manager (Independent Lead)</option>
                        {managers.map((member) => (
                          <option key={member.member_id} value={member.member_id}>
                            {member.staff.first_name} {member.staff.last_name}
                            {member.staff.job_title ? ` - ${member.staff.job_title}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary">
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedStaff('');
                      setSelectedRole('RECRUITER');
                      setSelectedLead('');
                      setError('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #e5e7eb'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                No team members yet. Click &quot;Add Team Member&quot; to get started.
              </p>
            </div>
          ) : (
            <div>
              {/* Managers */}
              {managers.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#7c3aed',
                      borderRadius: '50%',
                      marginRight: '8px'
                    }}></span>
                    Managers ({managers.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {managers.map((member) => (
                      <div
                        key={member.member_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: '#faf5ff',
                          border: '1px solid #e9d5ff',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                            {member.staff?.first_name} {member.staff?.last_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                            {member.staff?.job_title && <span>{member.staff.job_title}</span>}
                            {member.staff?.department && member.staff?.job_title && <span> • </span>}
                            {member.staff?.department && <span>{member.staff.department}</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {member.staff?.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#7c3aed',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Manager
                          </span>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.member_id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '13px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="MANAGER">Manager</option>
                            <option value="LEAD">Lead</option>
                            <option value="RECRUITER">Recruiter</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(
                              member.member_id,
                              `${member.staff?.first_name} ${member.staff?.last_name}`
                            )}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Leads */}
              {leads.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#2563eb',
                      borderRadius: '50%',
                      marginRight: '8px'
                    }}></span>
                    Team Leads ({leads.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {leads.map((member) => (
                      <div
                        key={member.member_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                            {member.staff?.first_name} {member.staff?.last_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                            {member.staff?.job_title && <span>{member.staff.job_title}</span>}
                            {member.staff?.department && member.staff?.job_title && <span> • </span>}
                            {member.staff?.department && <span>{member.staff.department}</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {member.staff?.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Lead
                          </span>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.member_id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '13px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="MANAGER">Manager</option>
                            <option value="LEAD">Lead</option>
                            <option value="RECRUITER">Recruiter</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(
                              member.member_id,
                              `${member.staff?.first_name} ${member.staff?.last_name}`
                            )}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiters */}
              {recruiters.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#059669',
                      borderRadius: '50%',
                      marginRight: '8px'
                    }}></span>
                    Recruiters ({recruiters.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recruiters.map((member) => (
                      <div
                        key={member.member_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                            {member.staff?.first_name} {member.staff?.last_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px' }}>
                            {member.staff?.job_title && <span>{member.staff.job_title}</span>}
                            {member.staff?.department && member.staff?.job_title && <span> • </span>}
                            {member.staff?.department && <span>{member.staff.department}</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {member.staff?.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Recruiter
                          </span>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.member_id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '13px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="MANAGER">Manager</option>
                            <option value="LEAD">Lead</option>
                            <option value="RECRUITER">Recruiter</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(
                              member.member_id,
                              `${member.staff?.first_name} ${member.staff?.last_name}`
                            )}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            <strong>Total Members: {members.length}</strong>
            {members.length > 0 && (
              <span> ({leads.length} {leads.length === 1 ? 'Lead' : 'Leads'}, {recruiters.length} {recruiters.length === 1 ? 'Recruiter' : 'Recruiters'})</span>
            )}
          </div>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMembersModal;

