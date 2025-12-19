import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthProvider';
import { useTenant } from '../../contexts/TenantProvider';
import { handleSupabaseError } from '../../utils/validators';
import './IssueList.css';

const IssueList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, my_issues, open, in_progress, resolved
  const [searchTerm, setSearchTerm] = useState('');

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

      // Apply filters
      if (filter === 'my_issues') {
        query = query.eq('reported_by_user_id', user.id);
      } else if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Apply search filter
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(issue =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setIssues(filteredData);
    } catch (err) {
      console.error('Error fetching issues:', err);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounce search - refetch after user stops typing
    const timeoutId = setTimeout(() => {
      fetchIssues();
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  if (!tenant?.tenant_id) {
    return (
      <div className="issue-list-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="issue-list-page">
        <div className="loading-spinner">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="issue-list-page">
      <div className="issue-list-header">
        <h1>🐛 Report an Issue</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/hrms/issues/new')}
        >
          + Report Bug
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="issue-filters">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'my_issues' ? 'active' : ''}`}
            onClick={() => setFilter('my_issues')}
          >
            My Issues ({issues.filter(i => i.reported_by_user_id === user.id).length})
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

        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search issues..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="issues-container">
        {issues.length === 0 ? (
          <div className="empty-state">
            <p>No issues found. Be the first to report one!</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/hrms/issues/new')}
            >
              Report an Issue
            </button>
          </div>
        ) : (
          issues.map(issue => {
            const severityBadge = getSeverityBadge(issue.severity);
            const statusBadge = getStatusBadge(issue.status);
            
            return (
              <div
                key={issue.issue_id}
                className="issue-card"
                onClick={() => navigate(`/hrms/issues/${issue.issue_id}`)}
              >
                <div className="issue-card-header">
                  <div className="issue-id">#{issue.issue_id.slice(0, 8)}</div>
                  <div className={`severity-badge ${severityBadge.className}`}>
                    {severityBadge.emoji} {severityBadge.label}
                  </div>
                </div>
                
                <h3 className="issue-title">{issue.title}</h3>
                
                <p className="issue-description">
                  {issue.description.length > 150
                    ? `${issue.description.substring(0, 150)}...`
                    : issue.description}
                </p>

                <div className="issue-meta">
                  <div className={`status-badge ${statusBadge.className}`}>
                    {statusBadge.emoji} {statusBadge.label}
                  </div>
                  <div className="issue-date">
                    Reported: {formatDate(issue.created_at)}
                  </div>
                  {issue.resolved_at && (
                    <div className="issue-date">
                      Resolved: {formatDate(issue.resolved_at)}
                    </div>
                  )}
                </div>

                <div className="issue-card-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/hrms/issues/${issue.issue_id}`);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default IssueList;
