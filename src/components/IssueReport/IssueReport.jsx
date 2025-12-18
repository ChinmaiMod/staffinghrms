import { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthProvider';
import { useTenant } from '../../contexts/TenantProvider';
import { 
  validateTextField, 
  validateSelect, 
  validateURL,
  validateFile,
  handleSupabaseError
} from '../../utils/validators';
import './IssueReport.css';

const IssueReport = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    issue_type: 'BUG',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    page_url: window.location.href,
    browser_info: navigator.userAgent
  });
  
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const severityOptions = [
    { value: 'LOW', label: 'Low', description: 'Minor issue', color: 'low' },
    { value: 'MEDIUM', label: 'Medium', description: 'Moderate issue', color: 'medium' },
    { value: 'HIGH', label: 'High', description: 'Major issue', color: 'high' },
    { value: 'CRITICAL', label: 'Critical', description: 'System down', color: 'critical' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  const handleSeveritySelect = (severity) => {
    setFormData(prev => ({
      ...prev,
      severity
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileValidation = validateFile(file, {
        required: false,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      });
      
      if (!fileValidation.valid) {
        setError(fileValidation.error);
        setFieldErrors({ ...fieldErrors, screenshot: fileValidation.error });
        return;
      }
      
      setScreenshot(file);
      setError('');
      setFieldErrors({ ...fieldErrors, screenshot: '' });
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileValidation = validateFile(file, {
        required: false,
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (!fileValidation.valid) {
        setError(fileValidation.error);
        setFieldErrors({ ...fieldErrors, screenshot: fileValidation.error });
        return;
      }
      
      setScreenshot(file);
      setError('');
      setFieldErrors({ ...fieldErrors, screenshot: '' });
    } else if (file) {
      setError('Please upload an image file (JPG, PNG, GIF, or WebP)');
      setFieldErrors({ ...fieldErrors, screenshot: 'Invalid file type' });
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  const uploadScreenshot = async (issueId) => {
    if (!screenshot) return null;

    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${issueId}-${Date.now()}.${fileExt}`;
    const filePath = `issue-screenshots/${tenant.tenant_id}/${fileName}`;

    const { error } = await supabase.storage
      .from('attachments')
      .upload(filePath, screenshot);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setFieldErrors({});

    try {
      // Validate form fields
      const errors = {};
      
      const titleValidation = validateTextField(formData.title, 'Issue title', {
        required: true,
        minLength: 10,
        maxLength: 200
      });
      if (!titleValidation.valid) errors.title = titleValidation.error;
      
      const descValidation = validateTextField(formData.description, 'Description', {
        required: true,
        minLength: 20,
        maxLength: 2000
      });
      if (!descValidation.valid) errors.description = descValidation.error;
      
      const typeValidation = validateSelect(formData.issue_type, 'Issue type', true);
      if (!typeValidation.valid) errors.issue_type = typeValidation.error;
      
      if (formData.page_url) {
        const urlValidation = validateURL(formData.page_url, false);
        if (!urlValidation.valid) errors.page_url = urlValidation.error;
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Please fix the errors below before submitting');
        setLoading(false);
        return;
      }

      // Insert issue report into database
      const { data: issueData, error: dbError } = await supabase
        .from('issue_reports')
        .insert([{
          tenant_id: tenant.tenant_id,
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          severity: formData.severity,
          issue_type: formData.issue_type,
          steps_to_reproduce: formData.steps_to_reproduce.trim(),
          expected_behavior: formData.expected_behavior.trim(),
          actual_behavior: formData.actual_behavior.trim(),
          page_url: formData.page_url.trim(),
          browser_info: formData.browser_info,
          status: 'OPEN'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Upload screenshot if provided
      let screenshotUrl = null;
      if (screenshot) {
        screenshotUrl = await uploadScreenshot(issueData.issue_id);
        
        // Update issue with screenshot URL
        await supabase
          .from('issue_reports')
          .update({ screenshot_url: screenshotUrl })
          .eq('issue_id', issueData.issue_id);
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: 'MEDIUM',
        issue_type: 'BUG',
        steps_to_reproduce: '',
        expected_behavior: '',
        actual_behavior: '',
        page_url: window.location.href,
        browser_info: navigator.userAgent
      });
      setScreenshot(null);

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error submitting issue report:', err);
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'MEDIUM',
      issue_type: 'BUG',
      steps_to_reproduce: '',
      expected_behavior: '',
      actual_behavior: '',
      page_url: window.location.href,
      browser_info: navigator.userAgent
    });
    setScreenshot(null);
    setError('');
    setSuccess(false);
    setFieldErrors({});
  };

  return (
    <div className="issue-report-page">
      <div className="issue-report-header">
        <h1>🐛 Report an Issue</h1>
        <p>Help us improve by reporting bugs and issues you encounter</p>
      </div>

      {success && (
        <div className="success-message">
          ✓ Thank you for reporting this issue! We&apos;ll investigate and get back to you shortly.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="issue-info">
        <h3>📋 What makes a good bug report?</h3>
        <ul>
          <li>Clear, descriptive title</li>
          <li>Step-by-step instructions to reproduce the issue</li>
          <li>What you expected to happen</li>
          <li>What actually happened</li>
          <li>Screenshots or screen recordings (if applicable)</li>
        </ul>
      </div>

      <form className="issue-report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">
            Issue Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={fieldErrors.title ? 'error' : ''}
            placeholder="Brief description of the issue..."
            maxLength={200}
          />
          {fieldErrors.title && (
            <small className="error-text">{fieldErrors.title}</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="issue_type">
              Issue Type <span className="required">*</span>
            </label>
            <select
              id="issue_type"
              name="issue_type"
              value={formData.issue_type}
              onChange={handleChange}
              className={fieldErrors.issue_type ? 'error' : ''}
            >
              <option value="BUG">Bug / Error</option>
              <option value="UI_ISSUE">UI / Display Issue</option>
              <option value="PERFORMANCE">Performance Problem</option>
              <option value="DATA_ERROR">Data / Calculation Error</option>
              <option value="FEATURE_NOT_WORKING">Feature Not Working</option>
              <option value="OTHER">Other</option>
            </select>
            {fieldErrors.issue_type && (
              <small className="error-text">{fieldErrors.issue_type}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="page_url">Page URL</label>
            <input
              type="url"
              id="page_url"
              name="page_url"
              value={formData.page_url}
              onChange={handleChange}
              className={fieldErrors.page_url ? 'error' : ''}
              placeholder="https://..."
            />
            {fieldErrors.page_url && (
              <small className="error-text">{fieldErrors.page_url}</small>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>
            Severity <span className="required">*</span>
          </label>
          <div className="severity-selector">
            {severityOptions.map(option => (
              <div
                key={option.value}
                className={`severity-option ${option.color} ${formData.severity === option.value ? 'selected' : ''}`}
                onClick={() => handleSeveritySelect(option.value)}
              >
                <div className="severity-label">{option.label}</div>
                <div className="severity-description">{option.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={fieldErrors.description ? 'error' : ''}
            placeholder="Provide a detailed description of the issue..."
            maxLength={2000}
          />
          {fieldErrors.description && (
            <small className="error-text">{fieldErrors.description}</small>
          )}
          <div className={`character-count ${formData.description.length > 1800 ? 'warning' : ''}`}>
            {formData.description.length} / 2000 characters
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="steps_to_reproduce">Steps to Reproduce</label>
          <textarea
            id="steps_to_reproduce"
            name="steps_to_reproduce"
            value={formData.steps_to_reproduce}
            onChange={handleChange}
            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
            maxLength={1000}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expected_behavior">Expected Behavior</label>
            <textarea
              id="expected_behavior"
              name="expected_behavior"
              value={formData.expected_behavior}
              onChange={handleChange}
              placeholder="What should happen..."
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="actual_behavior">Actual Behavior</label>
            <textarea
              id="actual_behavior"
              name="actual_behavior"
              value={formData.actual_behavior}
              onChange={handleChange}
              placeholder="What actually happened..."
              maxLength={500}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Screenshot (Optional)</label>
          {!screenshot ? (
            <div
              className="file-upload-area"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('screenshot-input').click()}
            >
              <div className="upload-icon">📸</div>
              <div className="upload-text">Click to upload or drag and drop</div>
              <div className="upload-hint">PNG, JPG up to 5MB</div>
              <input
                type="file"
                id="screenshot-input"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="uploaded-file">
              <img src={URL.createObjectURL(screenshot)} alt="Screenshot preview" />
              <div className="file-info">
                <div className="file-name">{screenshot.name}</div>
                <div className="file-size">{(screenshot.size / 1024).toFixed(2)} KB</div>
              </div>
              <button type="button" className="remove-file" onClick={removeScreenshot}>
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={loading || !formData.title || !formData.description}
          >
            {loading ? 'Submitting...' : '🐛 Submit Issue Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueReport;
