import { useState, useEffect } from 'react'
import { useAuth } from '../../../../contexts/AuthProvider'
import { supabase as supabaseClient } from '../../../../api/supabaseClient'
import { fetchOpenRouterModels } from '../../../../api/edgeFunctions'
import './AIPromptsPage.css'

export default function AIPromptsPage() {
  const { profile } = useAuth()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [aiModels, setAiModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    prompt_text: '',
    description: '',
    model: 'anthropic/claude-sonnet-4-5',
    is_active: true
  })

  const tenant = profile?.tenant_id

  useEffect(() => {
    if (tenant) {
      loadPrompts()
      loadAiModels()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  const loadAiModels = async () => {
    try {
      setLoadingModels(true)
      const models = await fetchOpenRouterModels()
      setAiModels(models)
    } catch (error) {
      console.error('Error loading AI models:', error)
      // Set default models if API fails
      setAiModels([
        { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Latest Claude model' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
        { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Claude model' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 model' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast GPT-4 model' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and economical' }
      ])
    } finally {
      setLoadingModels(false)
    }
  }

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('ai_prompts')
        .select('*')
        .eq('tenant_id', tenant)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error loading prompts:', error)
      alert('Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        tenant_id: tenant,
        created_by: profile?.id
      }

      if (editingPrompt) {
        const { error } = await supabaseClient
          .from('ai_prompts')
          .update(payload)
          .eq('prompt_id', editingPrompt.prompt_id)

        if (error) throw error
      } else {
        const { error } = await supabaseClient
          .from('ai_prompts')
          .insert(payload)

        if (error) throw error
      }

      setShowForm(false)
      setEditingPrompt(null)
      setFormData({ name: '', prompt_text: '', description: '', model: 'anthropic/claude-3.5-sonnet', is_active: true })
      loadPrompts()
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt: ' + error.message)
    }
  }

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      prompt_text: prompt.prompt_text,
      description: prompt.description || '',
      model: prompt.model || 'anthropic/claude-sonnet-4-5',
      is_active: prompt.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (promptId) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const { error } = await supabaseClient
        .from('ai_prompts')
        .delete()
        .eq('prompt_id', promptId)

      if (error) throw error
      loadPrompts()
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Failed to delete prompt')
    }
  }

  if (loading) {
    return <div className="crm-header"><h1>Loading AI Prompts...</h1></div>
  }

  return (
    <div className="ai-prompts-page">
      <div className="crm-header">
        <h1>AI Prompts for Newsletter</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Manage prompts used for AI-powered newsletter content generation</p>
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '16px' }}
          onClick={() => {
            setShowForm(true)
            setEditingPrompt(null)
            setFormData({ name: '', prompt_text: '', description: '', model: 'anthropic/claude-3.5-sonnet', is_active: true })
          }}
        >
          + Add New Prompt
        </button>
      </div>

      {showForm && (
        <div className="prompt-form-card">
          <h2>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Professional Newsletter Tone"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this prompt"
              />
            </div>

            <div className="form-group">
              <label>AI Model *</label>
              {loadingModels ? (
                <div style={{ padding: '12px', color: '#64748b' }}>Loading models...</div>
              ) : (
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="form-select"
                  required
                >
                  {aiModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.description ? `- ${model.description}` : ''}
                    </option>
                  ))}
                </select>
              )}
              <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                Select the AI model from OpenRouter to use for this prompt
              </small>
            </div>

            <div className="form-group">
              <label>Prompt Text *</label>
              <textarea
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                required
                rows={6}
                placeholder="Enter the prompt that will guide AI content generation. Use {content} placeholder to reference the user's current content."
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
              <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                Tip: Use {"{content}"} placeholder where the user&apos;s current content should be inserted
              </small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                {' '}Active (visible in dropdown)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">
                {editingPrompt ? 'Update' : 'Create'} Prompt
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditingPrompt(null)
                  setFormData({ name: '', prompt_text: '', description: '', model: 'anthropic/claude-3.5-sonnet', is_active: true })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="prompts-grid">
        {prompts.length === 0 ? (
          <div className="empty-state">
            <p>No AI prompts configured yet. Create your first prompt to get started.</p>
          </div>
        ) : (
          prompts.map((prompt) => (
            <div key={prompt.prompt_id} className="prompt-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{prompt.name}</h3>
                  {prompt.description && (
                    <p style={{ color: '#64748b', margin: '8px 0', fontSize: '14px' }}>
                      {prompt.description}
                    </p>
                  )}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${prompt.is_active ? 'active' : 'inactive'}`}>
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {prompt.model && (
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#e0e7ff', 
                        color: '#4338ca', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {aiModels.find(m => m.id === prompt.model)?.name || prompt.model}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(prompt)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(prompt.prompt_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {prompt.prompt_text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

