import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { bpApi } from '../../api/auth';
import type { BestPracticeRequest, BPType, ExternalLink } from '../../types';

export function SubmitPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BestPracticeRequest>({
    title: '',
    description: '',
    types: [],
    usageGuide: '',
    installGuide: '',
    externalLinks: [],
    tags: [],
    agentWorkflowId: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: bp } = await bpApi.create(formData);
      for (const file of files) {
        await bpApi.uploadFile(bp.id, file);
      }
      await bpApi.submit(bp.id);
      return bp;
    },
    onSuccess: () => {
      navigate('/my-submissions');
    },
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleType = (t: BPType) => {
    const newTypes = formData.types.includes(t)
      ? formData.types.filter(x => x !== t)
      : [...formData.types, t];
    setFormData({ ...formData, types: newTypes });
  };

  const addLink = () => {
    setFormData({
      ...formData,
      externalLinks: [...formData.externalLinks, { label: '', url: '' }]
    });
  };

  const updateLink = (idx: number, field: keyof ExternalLink, val: string) => {
    const newLinks = [...formData.externalLinks];
    newLinks[idx] = { ...newLinks[idx], [field]: val };
    setFormData({ ...formData, externalLinks: newLinks });
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Submit Best Practice</h1>
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {s}
              </div>
              <div className={`h-1 flex-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-8 md:p-12 space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900">Step 1: Basic Information</h2>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Title *</label>
              <input 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Claude Code Skills for Frontend Review"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Types * (Select multiple)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['MCP', 'SKILL', 'RULE', 'WORKFLOW', 'HOOKS', 'PROMPT', 'TOOL', 'OTHER'] as BPType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      formData.types.includes(t) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Description *</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="What is this best practice about?"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900">Step 2: Files & Links</h2>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Upload Files</label>
              <input 
                type="file" multiple
                onChange={e => setFiles(Array.from(e.target.files || []))}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:border-blue-300 transition-all cursor-pointer"
              />
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-700">{f.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{(f.size/1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">External Links</label>
                <button onClick={addLink} className="text-xs font-bold text-blue-600 hover:underline">+ Add Link</button>
              </div>
              {formData.externalLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    placeholder="Label" value={link.label}
                    onChange={e => updateLink(idx, 'label', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input 
                    placeholder="URL" value={link.url}
                    onChange={e => updateLink(idx, 'url', e.target.value)}
                    className="flex-2 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900">Step 3: Guides</h2>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Usage Guide</label>
              <textarea 
                rows={6}
                value={formData.usageGuide}
                onChange={e => setFormData({ ...formData, usageGuide: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                placeholder="Markdown supported. Explain how to use it."
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Installation Guide</label>
              <textarea 
                rows={4}
                value={formData.installGuide}
                onChange={e => setFormData({ ...formData, installGuide: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                placeholder="Bash commands, config snippets..."
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">Tags (Role/Domain)</label>
                <div className="flex gap-2">
                  {['backend', 'frontend', 'devops', 'ba', 'pm'].map(role => (
                    <button 
                      key={role}
                      onClick={() => !formData.tags.includes(role) && setFormData({ ...formData, tags: [...formData.tags, role] })}
                      className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-600"
                    >
                      +{role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type and press Enter (e.g. backend, security)"
                />
                <button onClick={addTag} className="bg-gray-100 px-4 rounded-xl font-bold text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(t => (
                  <span key={t} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-2">
                    {t} <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(x => x !== t) })}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-10">
            <span className="text-6xl">🚀</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Ready to Publish?</h2>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                Your best practice will be submitted for admin review. This usually takes less than 48 hours.
              </p>
            </div>
            <div className="pt-6">
              <button 
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:bg-gray-400 transition-all"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit for Review →'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-8 border-t border-gray-50 mt-10">
          {step > 1 && (
            <button onClick={handleBack} className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-gray-700">
              ← Back
            </button>
          )}
          {step < 4 && (
            <button 
              onClick={handleNext}
              disabled={!formData.title}
              className="ml-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
            >
              Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
