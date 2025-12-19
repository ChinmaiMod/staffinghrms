import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthProvider';
import { useTenant } from '../../contexts/TenantProvider';
import { handleSupabaseError } from '../../utils/validators';
import './IssueManagement.css';

const IssueManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    resolution: '',
    internal_notes: ''
  });

  useEffect(() => {
    if (tenant?.tenant_id) {
      fetchIssues();
    }
  }, [filter, tenant?.tenant_id]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('hrms_issue_reports')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setIssues(data || []);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    try {
      setError('');

      const updateData = {
        status: updateForm.status || selectedIssue.status,
        updated_at: new Date().toISOString()
      };

      if (updateForm.resolution) {
        updateData.resolution = updateForm.resolution;
        if (updateForm.status === 'resolved' || updateForm.status === 'closed') {
          updateData.resolved_by = user.id;
          updateData.resolved_at = new Date().toISOString();
        }
      }

      const { error: updateError } = await supabase
        .from('hrms_issue_reports')
        .update(updateData)
        .eq('issue_id', selectedIssue.issue_id);

      if (updateError) throw updateError;

      setShowUpdateModal(false);
      setSelectedIssue(null);
      setUpdateForm({ status: '', resolution: '', internal_notes: '' });
      fetchIssues();
    } catch (err) {
      console.error('Error updating issue:', err);
      setError(handleSupabaseError(err));
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      low: { emoji: '🟢', label: 'Low', className: 'severity-low' },
      medium: { emoji: '🟡', label: 'Medium', className: 'severity-medium' },
      high: { emoji: '🟠', label: 'High', className: 'severity-high' },
      critical: { emoji: '🔴', label: 'Critical', className: 'severity-critical' }
    };
    return badges[severity?.toLowerCase()] || badges.medium;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { emoji: '📝', label: 'Open', className: 'status-open' },
      in_progress: { emoji: '🔧', label: 'In Progress', className: 'status-in-progress' },
      resolved: { emoji: '✅', label: 'Resolved', className: 'status-resolved' },
      closed: { emoji: '🔒', label: 'Closed', className: 'status-closed' },
      wont_fix: { emoji: '🚫', label: "Won't Fix", className: 'status-wont-fix' },
      duplicate: { emoji: '📋', label: 'Duplicate', className: 'status-duplicate' }
    };
    return badges[status] || badges.open;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStats = () => {
    return {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      critical: issues.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length
    };
  };

  const stats = getStats();
  const criticalIssues = issues.filter(i => 
    (i.severity === 'critical' || i.severity === 'high') && 
    i.status !== 'resolved' && 
    i.status !== 'closed'
  );

  if (!tenant?.tenant_id) {
    return (
      <div className="issue-management-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="issue-management-page">
        <div className="loading-spinner">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="issue-management-page">
      <div className="management-header">
        <h1>Issue Management</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-value">{stats.critical}</div>
          <div className="stat-label">Critical Open</div>
        </div>
      </div>

      {criticalIssues.length > 0 && (
        <div className="critical-section">
          <h2>🔴 Critical & High Priority Issues</h2>
          <div className="issues-list">
            {criticalIssues.map(issue => {
              const severityBadge = getSeverityBadge(issue.severity);
              const statusBadge = getStatusBadge(issue.status);
              
              return (
                <div key={issue.issue_id} className="issue-row">
                  <div className="issue-row-content">
                    <div className="issue-row-title">#{issue.issue_id.slice(0, 8)} {issue.title}</div>
                    <div className="issue-row-meta">
                      <span className={`severity-badge ${severityBadge.className}`}>
                        {severityBadge.emoji} {severityBadge.label}
                      </span>
                      <span className={`status-badge ${statusBadge.className}`}>
                        {statusBadge.emoji} {statusBadge.label}
                      </span>
                      <span className="issue-date">{formatDate(issue.created_at)}</span>
                    </div>
                  </div>
                  <div className="issue-row-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/hrms/issues/${issue.issue_id}`)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setSelectedIssue(issue);
                        setUpdateForm({
                          status: issue.status,
                          resolution: issue.resolution || ''
                        });
                        setShowUpdateModal(true);
                      }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Issues
          </button>
          <button
            className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button
            className={`filter-tab ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </button>
          <button
            className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="issues-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  No issues found
                </td>
              </tr>
            ) : (
              issues.map(issue => {
                const severityBadge = getSeverityBadge(issue.severity);
                const statusBadge = getStatusBadge(issue.status);
                
                return (
                  <tr key={issue.issue_id}>
                    <td className="issue-id-cell">#{issue.issue_id.slice(0, 8)}</td>
                    <td className="issue-title-cell">{issue.title}</td>
                    <td>
                      <span className={`severity-badge ${severityBadge.className}`}>
                        {severityBadge.emoji} {severityBadge.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusBadge.className}`}>
                        {statusBadge.emoji} {statusBadge.label}
                      </span>
                    </td>
                    <td>{formatDate(issue.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/hrms/issues/${issue.issue_id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setUpdateForm({
                              status: issue.status,
                              resolution: issue.resolution || '',
                              internal_notes: ''
                            });
                            setShowUpdateModal(true);
                          }}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showUpdateModal && selectedIssue && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Issue #{selectedIssue.issue_id.slice(0, 8)}</h2>
            
            <div className="form-group">
              <label>Status *</label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="wont_fix">Won't Fix</option>
                <option value="duplicate">Duplicate</option>
              </select>
            </div>

            <div className="form-group">
              <label>Response / Resolution *</label>
              <textarea
                value={updateForm.resolution}
                onChange={(e) => setUpdateForm({ ...updateForm, resolution: e.target.value })}
                placeholder="Provide a response or resolution details..."
                rows={5}
                required
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedIssue(null);
                  setUpdateForm({ status: '', resolution: '' });
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateIssue}
                disabled={!updateForm.status || !updateForm.resolution}
              >
                Save & Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueManagement;
