import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../api/supabaseClient';
import { useTenant } from '../../../../contexts/TenantProvider';
import { useAuth } from '../../../../contexts/AuthProvider';
import TeamMembersModal from './TeamMembersModal';

export default function TeamsPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { user } = useAuth();
  
  const [teams, setTeams] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    team_name: '',
    business_id: '',
    description: '',
    is_active: true
  });
  const [newTeamData, setNewTeamData] = useState({
    team_name: '',
    business_id: '',
    description: '',
    is_active: true
  });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [businessFilter, setBusinessFilter] = useState('ALL');

  useEffect(() => {
    if (tenant?.tenant_id) {
      loadBusinesses();
      loadTeams();
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

  const loadTeams = async () => {
    if (!tenant?.tenant_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          business:businesses(business_name),
          member_count:team_members(count)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('team_name');

      if (error) throw error;
      
      const teamsWithCount = (data || []).map(team => ({
        ...team,
        member_count: team.member_count?.[0]?.count || 0,
        business_name: team.business?.business_name || 'All Businesses'
      }));
      
      setTeams(teamsWithCount);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTeamData.team_name.trim()) {
      setError('Team name is required');
      return;
    }

    setError('');

    const payload = {
      team_name: newTeamData.team_name.trim(),
      business_id: newTeamData.business_id || null,
      description: newTeamData.description.trim() || null,
      is_active: newTeamData.is_active,
      tenant_id: tenant.tenant_id,
      created_at: new Date().toISOString(),
      created_by: user?.id,
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    };

    try {
      const { error: insertError } = await supabase
        .from('teams')
        .insert([payload]);

      if (insertError) throw insertError;

      setNewTeamData({
        team_name: '',
        business_id: '',
        description: '',
        is_active: true
      });
      
      await loadTeams();
    } catch (insertError) {
      console.error('Failed to add team:', insertError);
      setError(insertError.message || 'Unable to add team');
    }
  };

  const handleEdit = (team) => {
    setEditingId(team.team_id);
    setEditData({
      team_name: team.team_name || '',
      business_id: team.business_id || '',
      description: team.description || '',
      is_active: team.is_active ?? true
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.team_name.trim()) {
      setError('Team name is required');
      return;
    }

    setError('');

    const payload = {
      team_name: editData.team_name.trim(),
      business_id: editData.business_id || null,
      description: editData.description.trim() || null,
      is_active: editData.is_active,
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    };

    try {
      const { error: updateError } = await supabase
        .from('teams')
        .update(payload)
        .eq('team_id', editingId);

      if (updateError) throw updateError;

      setEditingId(null);
      setEditData({
        team_name: '',
        business_id: '',
        description: '',
        is_active: true
      });
      
      await loadTeams();
    } catch (updateError) {
      console.error('Failed to update team:', updateError);
      setError(updateError.message || 'Unable to update team');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({
      team_name: '',
      business_id: '',
      description: '',
      is_active: true
    });
    setError('');
  };

  const handleDelete = async (teamId, teamName) => {
    const confirmMessage = `Delete team "${teamName}"? This will remove all team members. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);

      if (deleteError) throw deleteError;
      await loadTeams();
    } catch (deleteError) {
      console.error('Failed to delete team:', deleteError);
      setError(deleteError.message || 'Unable to delete team');
    }
  };

  const handleToggleActive = async (teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    if (!team) return;

    try {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          is_active: !team.is_active,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('team_id', teamId);

      if (updateError) throw updateError;
      await loadTeams();
    } catch (updateError) {
      console.error('Failed to toggle status:', updateError);
      setError(updateError.message || 'Unable to update status');
    }
  };

  const handleManageMembers = (team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
  };

  const filteredTeams = useMemo(() => {
    let results = teams;

    if (statusFilter !== 'ALL') {
      const activeStatus = statusFilter === 'ACTIVE';
      results = results.filter((team) => team.is_active === activeStatus);
    }

    if (businessFilter !== 'ALL') {
      results = results.filter((team) => team.business_id === businessFilter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      results = results.filter(
        (team) =>
          team.team_name?.toLowerCase().includes(search) ||
          team.description?.toLowerCase().includes(search) ||
          team.business_name?.toLowerCase().includes(search)
      );
    }

    return results;
  }, [teams, statusFilter, businessFilter, searchTerm]);

  return (
    <div className="data-table-container">
      <div style={{ marginBottom: '16px' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/crm/data-admin')}
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
      
      <div className="table-header">
        <h2>🤝 Teams</h2>
      </div>

      {/* Inline Add Form - matches ReferenceTableEditor pattern */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'flex-end', 
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ fontSize: '14px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Team Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={newTeamData.team_name}
              onChange={(e) => setNewTeamData({ ...newTeamData, team_name: e.target.value })}
              placeholder="Enter team name"
              style={{ 
                width: '100%',
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>

          <div style={{ flex: '0 1 220px', minWidth: '220px' }}>
            <label style={{ fontSize: '14px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Business (Optional)
            </label>
            <select
              value={newTeamData.business_id}
              onChange={(e) => setNewTeamData({ ...newTeamData, business_id: e.target.value })}
              style={{ 
                width: '100%',
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">All Businesses</option>
              {businesses.map((biz) => (
                <option key={biz.business_id} value={biz.business_id}>
                  {biz.business_name}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleAdd}
            style={{ height: '42px' }}
          >
            + Add Team
          </button>
        </div>

        {/* Optional description field - shown below */}
        <div style={{ marginTop: '12px' }}>
          <input
            type="text"
            value={newTeamData.description}
            onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
            placeholder="Description (optional)"
            style={{ 
              width: '100%',
              padding: '10px 14px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0'
            }}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center', 
        marginBottom: '16px',
        padding: '0 4px',
        flexWrap: 'wrap'
      }}>
        <div className="search-box" style={{ flex: '1 1 300px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '180px' }}
        >
          <option value="ALL">All Businesses</option>
          {businesses.map((biz) => (
            <option key={biz.business_id} value={biz.business_id}>
              {biz.business_name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '150px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div className="loading">Loading teams...</div>
        </div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <h3>No Teams</h3>
          <p>Add your first team using the form above.</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No Matching Teams</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th style={{ width: '180px' }}>Business</th>
              <th style={{ width: '100px' }}>Members</th>
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '240px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => (
              <tr key={team.team_id}>
                <td>
                  {editingId === team.team_id ? (
                    <input
                      type="text"
                      value={editData.team_name}
                      onChange={(e) => setEditData({ ...editData, team_name: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div style={{ fontWeight: 500 }}>{team.team_name}</div>
                      {team.description && (
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', lineHeight: '1.3' }}>
                          {team.description}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td>
                  {editingId === team.team_id ? (
                    <select
                      value={editData.business_id}
                      onChange={(e) => setEditData({ ...editData, business_id: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    >
                      <option value="">All Businesses</option>
                      {businesses.map((biz) => (
                        <option key={biz.business_id} value={biz.business_id}>
                          {biz.business_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                      {team.business_name}
                    </span>
                  )}
                </td>
                <td>
                  <span className="status-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                    {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge ${team.is_active ? 'initial-contact' : ''}`}
                    style={team.is_active ? { background: '#d1fae5', color: '#065f46' } : { background: '#fee2e2', color: '#991b1b' }}
                  >
                    {team.is_active ? '● Active' : '● Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {editingId === team.team_id ? (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={handleSaveEdit}
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
                          onClick={() => handleManageMembers(team)}
                        >
                          👥 Members
                        </button>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => handleEdit(team)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleActive(team.team_id)}
                        >
                          {team.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(team.team_id, team.team_name)}
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

      {showMembersModal && selectedTeam && (
        <TeamMembersModal
          team={selectedTeam}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedTeam(null);
            loadTeams(); // Refresh to update member counts
          }}
        />
      )}
    </div>
  );
}

