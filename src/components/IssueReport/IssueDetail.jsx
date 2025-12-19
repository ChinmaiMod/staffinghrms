import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthProvider';
import { useTenant } from '../../contexts/TenantProvider';
import { handleSupabaseError } from '../../utils/validators';
import './IssueDetail.css';

const IssueDetail = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (issueId && tenant?.tenant_id) {
      fetchIssue();
    }
  }, [issueId, tenant?.tenant_id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('hrms_issue_reports')
        .select('*')
        .eq('issue_id', issueId)
        .eq('tenant_id', tenant.tenant_id)
        .single();

      if (fetchError) throw fetchError;

      setIssue(data);
    } catch (err) {
      console.error('Error fetching issue:', err);
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueTypeLabel = (type) => {
    const types = {
      bug: 'Bug / Error',
      error: 'Error',
      ui_ux: 'UI / Display Issue',
      performance: 'Performance Problem',
      data_issue: 'Data / Calculation Error',
      access_issue: 'Access Issue',
      other: 'Other'
    };
    return types[type] || type;
  };

  if (!tenant?.tenant_id) {
    return (
      <div className="issue-detail-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="issue-detail-page">
        <div className="loading-spinner">Loading issue details...</div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="issue-detail-page">
        <div className="error-message">
          {error || 'Issue not found'}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/hrms/issues')}>
          Back to Issues
        </button>
      </div>
    );
  }

  const severityBadge = getSeverityBadge(issue.severity);
  const statusBadge = getStatusBadge(issue.status);
  const isReporter = issue.reported_by_user_id === user.id;

  return (
    <div className="issue-detail-page">
      <div className="issue-detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/hrms/issues')}>
          ← Back to Issues
        </button>
        <div className="issue-actions">
          {isReporter && issue.status === 'open' && (
            <button className="btn btn-secondary">
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="issue-detail-card">
        <div className="issue-detail-title-section">
          <div className="issue-id">#{issue.issue_id.slice(0, 8)}</div>
          <h1>{issue.title}</h1>
          <div className="issue-badges">
            <div className={`severity-badge ${severityBadge.className}`}>
              {severityBadge.emoji} {severityBadge.label}
            </div>
            <div className={`status-badge ${statusBadge.className}`}>
              {statusBadge.emoji} {statusBadge.label}
            </div>
          </div>
        </div>

        <div className="issue-meta-info">
          <div className="meta-item">
            <strong>Type:</strong> {getIssueTypeLabel(issue.issue_type)}
          </div>
          <div className="meta-item">
            <strong>Reported:</strong> {formatDate(issue.created_at)}
          </div>
          {issue.resolved_at && (
            <div className="meta-item">
              <strong>Resolved:</strong> {formatDate(issue.resolved_at)}
            </div>
          )}
          {issue.resolved_by && (
            <div className="meta-item">
              <strong>Resolved by:</strong> Support Team
            </div>
          )}
        </div>

        <div className="issue-section">
          <h2>Description</h2>
          <p className="issue-text">{issue.description}</p>
        </div>

        {issue.steps_to_reproduce && (
          <div className="issue-section">
            <h2>Steps to Reproduce</h2>
            <div className="issue-text">
              {issue.steps_to_reproduce.split('\n').map((step, index) => (
                <div key={index} className="step-item">
                  {index + 1}. {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {issue.expected_behavior && (
          <div className="issue-section">
            <h2>Expected Behavior</h2>
            <p className="issue-text">{issue.expected_behavior}</p>
          </div>
        )}

        {issue.actual_behavior && (
          <div className="issue-section">
            <h2>Actual Behavior</h2>
            <p className="issue-text">{issue.actual_behavior}</p>
          </div>
        )}

        {issue.screenshot_paths && issue.screenshot_paths.length > 0 && (
          <div className="issue-section">
            <h2>Screenshots</h2>
            <div className="screenshots-grid">
              {issue.screenshot_paths.map((path, index) => (
                <div key={index} className="screenshot-item">
                  <img src={path} alt={`Screenshot ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="issue-section">
          <h2>System Information</h2>
          <div className="system-info">
            <div className="info-item">
              <strong>Browser:</strong> {issue.browser || 'N/A'}
            </div>
            <div className="info-item">
              <strong>OS:</strong> {issue.os || 'N/A'}
            </div>
            <div className="info-item">
              <strong>Screen Resolution:</strong> {issue.screen_resolution || 'N/A'}
            </div>
            {issue.page_url && (
              <div className="info-item">
                <strong>Page URL:</strong>{' '}
                <a href={issue.page_url} target="_blank" rel="noopener noreferrer">
                  {issue.page_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {issue.resolution && (
          <div className="issue-section resolution-section">
            <h2>💬 Support Response</h2>
            <div className="resolution-text">{issue.resolution}</div>
            {issue.resolved_at && (
              <div className="resolution-date">
                - Support Team, {formatDate(issue.resolved_at)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetail;
