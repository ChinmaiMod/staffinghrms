import { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthProvider';
import { useTenant } from '../../contexts/TenantProvider';
import { validateTextField, validateSelect, handleSupabaseError, handleError } from '../../utils/validators';
import './Feedback.css';

const Feedback = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'FEATURE_REQUEST'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate category
    const categoryValidation = validateSelect(formData.category, { required: true });
    if (!categoryValidation.valid) {
      errors.category = categoryValidation.error;
    }

    // Validate subject (10-200 characters)
    const subjectValidation = validateTextField(formData.subject, {
      required: true,
      minLength: 10,
      maxLength: 200,
      fieldName: 'Subject'
    });
    if (!subjectValidation.valid) {
      errors.subject = subjectValidation.error;
    }

    // Validate message (20-2000 characters)
    const messageValidation = validateTextField(formData.message, {
      required: true,
      minLength: 20,
      maxLength: 2000,
      fieldName: 'Message'
    });
    if (!messageValidation.valid) {
      errors.message = messageValidation.error;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    try {
      // Insert feedback into database
      const { data: feedbackData, error: dbError } = await supabase
        .from('user_feedback')
        .insert([{
          tenant_id: tenant.tenant_id,
          user_id: user.id,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          category: formData.category,
          status: 'NEW'
        }])
        .select()
        .single();

      if (dbError) {
        const dbErrorMessage = handleSupabaseError(dbError);
        throw new Error(dbErrorMessage);
      }

      // Send email via edge function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('sendFeedbackEmail', {
        body: {
          feedback_id: feedbackData.feedback_id,
          user_email: user.email,
          tenant_name: tenant.company_name,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          category: formData.category
        }
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        // Check if there's an error message in the response body
        if (emailData && emailData.error) {
          console.error('Email error details:', emailData.error);
        }
        // Don't throw - feedback is saved, email is nice-to-have
      }

      setSuccess(true);
      setFormData({
        subject: '',
        message: '',
        category: 'FEATURE_REQUEST'
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(handleError(err, 'feedback submission'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      subject: '',
      message: '',
      category: 'FEATURE_REQUEST'
    });
    setError('');
    setSuccess(false);
  };

  const messageLength = formData.message.length;
  const maxLength = 2000;

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <h1>💡 Suggestions & Ideas</h1>
        <p>We&apos;d love to hear your feedback! Share your ideas, report bugs, or suggest improvements.</p>
      </div>

      {success && (
        <div className="success-message">
          ✓ Thank you for your feedback! We&apos;ve received your message and will review it shortly.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="feedback-info">
        <h3>What can you share?</h3>
        <ul>
          <li>Feature requests and new ideas</li>
          <li>Bug reports and issues</li>
          <li>Improvements to existing features</li>
          <li>Questions about functionality</li>
          <li>General feedback and suggestions</li>
        </ul>
      </div>

      <form className="feedback-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={fieldErrors.category ? 'error' : ''}
            required
          >
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="BUG">Bug Report</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="QUESTION">Question</option>
            <option value="OTHER">Other</option>
          </select>
          {fieldErrors.category && (
            <small className="error-text">{fieldErrors.category}</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={fieldErrors.subject ? 'error' : ''}
            placeholder="Brief summary of your suggestion (10-200 characters)..."
            maxLength={200}
            required
          />
          {fieldErrors.subject && (
            <small className="error-text">{fieldErrors.subject}</small>
          )}
          <small style={{ color: '#64748b', fontSize: '12px' }}>
            {formData.subject.length} / 200 characters
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={fieldErrors.message ? 'error' : ''}
            placeholder="Please provide details about your suggestion, idea, or feedback (20-2000 characters)..."
            maxLength={maxLength}
            required
          />
          {fieldErrors.message && (
            <small className="error-text">{fieldErrors.message}</small>
          )}
          <div className={`character-count ${messageLength > maxLength * 0.9 ? 'warning' : ''} ${messageLength >= maxLength ? 'error' : ''}`}>
            {messageLength} / {maxLength} characters
          </div>
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
            className="btn btn-primary"
            disabled={loading || !formData.subject || !formData.message}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Feedback;
