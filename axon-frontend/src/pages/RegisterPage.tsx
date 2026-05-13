import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bpApi, lookupApi } from '../api';
import type { BPType, BestPracticeRequest } from '../types';

const STEPS = ['Basic Info', 'Content', 'Installation', 'Review & Submit'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < current
                ? 'bg-blue-600 text-white'
                : i === current
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-16 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

type FormData = Omit<BestPracticeRequest, 'job_ids' | 'ai_capability_ids' | 'creator_ids'> & {
  job_ids: string[];
  ai_capability_ids: string[];
  creator_ids: string[];
  files: File[];
};

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  thumbnail_url: '',
  type: 'WEB',
  web_content: '',
  key_value: '',
  ai_tools_description: '',
  installation_guide: '',
  work_id: '',
  job_ids: [],
  ai_capability_ids: [],
  creator_ids: [],
  files: [],
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => lookupApi.jobs().then(r => r.data) });
  const { data: aiCaps = [] } = useQuery({ queryKey: ['aiCaps'], queryFn: () => lookupApi.aiCapabilities().then(r => r.data) });
  const { data: workCats = [] } = useQuery({ queryKey: ['workCats'], queryFn: () => lookupApi.workCategories().then(r => r.data) });
  const [selectedWorkCat, setSelectedWorkCat] = useState('');
  const { data: works = [] } = useQuery({
    queryKey: ['works', selectedWorkCat],
    queryFn: () => lookupApi.works(selectedWorkCat || undefined).then(r => r.data),
  });

  const { data: existingBp } = useQuery({
    queryKey: ['bp-edit', editId],
    queryFn: () => bpApi.get(editId!).then(r => r.data),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingBp) {
      setForm({
        name: existingBp.name,
        description: existingBp.description,
        thumbnail_url: existingBp.thumbnail_url ?? '',
        type: existingBp.type,
        web_content: existingBp.web_content ?? '',
        key_value: existingBp.key_value ?? '',
        ai_tools_description: existingBp.ai_tools_description ?? '',
        installation_guide: existingBp.installation_guide ?? '',
        work_id: existingBp.work?.id ?? '',
        job_ids: existingBp.job.map(j => j.id),
        ai_capability_ids: existingBp.ai_capability.map(a => a.id),
        creator_ids: existingBp.creators.map(c => c.id),
        files: [],
      });
    }
  }, [existingBp]);

  const createMutation = useMutation({
    mutationFn: async (data: BestPracticeRequest) => {
      const bp = await bpApi.create(data);
      if (form.files.length > 0) {
        const fd = new FormData();
        form.files.forEach(f => fd.append('files', f));
        await bpApi.uploadFile(bp.data.id, fd);
      }
      return bp.data;
    },
    onSuccess: (bp) => navigate(`/library/${bp.id}`),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<BestPracticeRequest>) => {
      const bp = await bpApi.update(editId!, data);
      if (form.files.length > 0) {
        const fd = new FormData();
        form.files.forEach(f => fd.append('files', f));
        await bpApi.uploadFile(bp.data.id, fd);
      }
      return bp.data;
    },
    onSuccess: (bp) => navigate(`/library/${bp.id}`),
  });

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (k: 'job_ids' | 'ai_capability_ids', id: string) => {
    setForm(f => ({
      ...f,
      [k]: f[k].includes(id) ? f[k].filter(x => x !== id) : [...f[k], id],
    }));
  };

  const handleSubmit = () => {
    const payload: BestPracticeRequest = {
      name: form.name,
      description: form.description,
      thumbnail_url: form.thumbnail_url || undefined,
      type: form.type,
      web_content: form.web_content || undefined,
      key_value: form.key_value || undefined,
      ai_tools_description: form.ai_tools_description || undefined,
      installation_guide: form.installation_guide || undefined,
      work_id: form.work_id || undefined,
      job_ids: form.job_ids,
      ai_capability_ids: form.ai_capability_ids,
      creator_ids: form.creator_ids,
    };
    if (editId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit' : 'Register'} Best Practice</h1>
          <p className="text-sm text-gray-500 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
        <StepIndicator current={step} total={STEPS.length} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Best practice name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Briefly describe this best practice"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <div className="flex gap-3">
                {(['WEB', 'TOOL', 'EXTENSION'] as BPType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => set('type', t)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      form.type === t
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={form.thumbnail_url}
                onChange={e => set('thumbnail_url', e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jobs</label>
              <div className="flex flex-wrap gap-2">
                {jobs.map(j => (
                  <button
                    key={j.id}
                    onClick={() => toggleArr('job_ids', j.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      form.job_ids.includes(j.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {j.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Capabilities</label>
              <div className="flex flex-wrap gap-2">
                {aiCaps.map(a => (
                  <button
                    key={a.id}
                    onClick={() => toggleArr('ai_capability_ids', a.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      form.ai_capability_ids.includes(a.id)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Category</label>
                <select
                  value={selectedWorkCat}
                  onChange={e => { setSelectedWorkCat(e.target.value); set('work_id', ''); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {workCats.map(wc => (
                    <option key={wc.id} value={wc.id}>{wc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work</label>
                <select
                  value={form.work_id}
                  onChange={e => set('work_id', e.target.value)}
                  disabled={!selectedWorkCat}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="">Select work</option>
                  {works.map(w => (
                    <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Content */}
        {step === 1 && (
          <>
            {form.type === 'WEB' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Web URL / Content</label>
                <input
                  type="text"
                  value={form.web_content}
                  onChange={e => set('web_content', e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {(form.type === 'TOOL' || form.type === 'EXTENSION') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={e => set('files', Array.from(e.target.files ?? []))}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-3xl mb-2">📁</div>
                    <p className="text-sm text-gray-600">Click to select files</p>
                    <p className="text-xs text-gray-400 mt-1">Up to 50MB per file</p>
                  </label>
                  {form.files.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {form.files.map((f, i) => (
                        <div key={i} className="text-sm text-gray-700 flex items-center gap-2 justify-center">
                          <span>📄</span> {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Tools Description</label>
              <textarea
                rows={4}
                value={form.ai_tools_description}
                onChange={e => set('ai_tools_description', e.target.value)}
                placeholder="Describe the AI tools used..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </>
        )}

        {/* Step 3: Installation */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installation Guide</label>
              <textarea
                rows={8}
                value={form.installation_guide}
                onChange={e => set('installation_guide', e.target.value)}
                placeholder="Step-by-step installation instructions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Value</label>
              <textarea
                rows={4}
                value={form.key_value}
                onChange={e => set('key_value', e.target.value)}
                placeholder="Describe the key value of this best practice..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </>
        )}

        {/* Step 4: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Review your submission</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-800">{form.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jobs</span>
                <span className="font-medium text-gray-800">
                  {form.job_ids.length ? `${form.job_ids.length} selected` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AI Capabilities</span>
                <span className="font-medium text-gray-800">
                  {form.ai_capability_ids.length ? `${form.ai_capability_ids.length} selected` : 'None'}
                </span>
              </div>
              {form.files.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Files</span>
                  <span className="font-medium text-gray-800">{form.files.length} file(s)</span>
                </div>
              )}
            </div>
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
              ⚠ Submitting will send this best practice for review. Make sure all information is correct.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && !form.name.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="text-5xl">📋</div>
            <h2 className="font-bold text-gray-900 text-lg">Confirm Submission</h2>
            <p className="text-sm text-gray-500">
              This best practice will be sent to the review queue. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit(); }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
