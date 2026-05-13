import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../api';
import type { Job, AiCapability, WorkCategory, Work } from '../types';

type TabKey = 'jobs' | 'workCategories' | 'works' | 'aiCapabilities';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'workCategories', label: 'Work Categories' },
  { key: 'works', label: 'Works' },
  { key: 'aiCapabilities', label: 'AI Capabilities' },
];

/* ── Generic editable row ─────────────────────────────── */
function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
        <h2 className="font-bold text-gray-900">Delete item?</h2>
        <p className="text-sm text-gray-500">
          Are you sure you want to delete <strong>{name}</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Jobs Tab ─────────────────────────────────────────── */
function JobsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; item?: Job } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => masterDataApi.jobs.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => masterDataApi.jobs.create({ name, description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jobs'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: () => masterDataApi.jobs.update(modal!.item!.id, { name, description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jobs'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.jobs.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jobs'] }); setDeleteTarget(null); },
  });

  const openAdd = () => { setName(''); setDescription(''); setModal({ type: 'add' }); };
  const openEdit = (j: Job) => { setName(j.name); setDescription(''); setModal({ type: 'edit', item: j }); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{jobs.length} jobs</p>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Add Job
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-gray-400 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{j.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(j)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(j)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-900">{modal.type === 'add' ? 'Add Job' : 'Edit Job'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={!name.trim()}
                onClick={() => modal.type === 'add' ? createMutation.mutate() : updateMutation.mutate()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ── AI Capabilities Tab ──────────────────────────────── */
function AiCapabilitiesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; item?: AiCapability } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiCapability | null>(null);
  const [name, setName] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-ai-caps'],
    queryFn: () => masterDataApi.aiCapabilities.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => masterDataApi.aiCapabilities.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ai-caps'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: () => masterDataApi.aiCapabilities.update(modal!.item!.id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ai-caps'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.aiCapabilities.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ai-caps'] }); setDeleteTarget(null); },
  });

  const openAdd = () => { setName(''); setModal({ type: 'add' }); };
  const openEdit = (a: AiCapability) => { setName(a.name); setModal({ type: 'edit', item: a }); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{items.length} capabilities</p>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Add Capability
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-gray-400 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Default</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                  <td className="px-4 py-3">
                    {a.is_default && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(a)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(a)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-900">{modal.type === 'add' ? 'Add' : 'Edit'} AI Capability</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={!name.trim()}
                onClick={() => modal.type === 'add' ? createMutation.mutate() : updateMutation.mutate()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ── Work Categories Tab ──────────────────────────────── */
function WorkCategoriesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; item?: WorkCategory & { job_id?: string } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkCategory | null>(null);
  const [name, setName] = useState('');
  const [jobId, setJobId] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-work-cats'],
    queryFn: () => masterDataApi.workCategories.list().then((r) => (r.data as WorkCategory[])),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => masterDataApi.jobs.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => masterDataApi.workCategories.create({ job_id: jobId, name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-work-cats'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: () => masterDataApi.workCategories.update(modal!.item!.id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-work-cats'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.workCategories.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-work-cats'] }); setDeleteTarget(null); },
  });

  const openAdd = () => { setName(''); setJobId(''); setModal({ type: 'add' }); };
  const openEdit = (wc: WorkCategory) => { setName(wc.name); setModal({ type: 'edit', item: wc }); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{items.length} categories</p>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Add Category
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-gray-400 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((wc) => (
                <tr key={wc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{wc.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(wc)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(wc)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-900">
              {modal.type === 'add' ? 'Add' : 'Edit'} Work Category
            </h2>
            {modal.type === 'add' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job *</label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select job</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={!name.trim() || (modal.type === 'add' && !jobId)}
                onClick={() => modal.type === 'add' ? createMutation.mutate() : updateMutation.mutate()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ── Works Tab ────────────────────────────────────────── */
function WorksTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; item?: Work } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Work | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [jobId, setJobId] = useState('');
  const [workCatId, setWorkCatId] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-works'],
    queryFn: () => masterDataApi.works.list().then((r) => (r.data as Work[])),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => masterDataApi.jobs.list().then((r) => r.data),
  });

  const { data: workCats = [] } = useQuery({
    queryKey: ['admin-work-cats'],
    queryFn: () => masterDataApi.workCategories.list().then((r) => (r.data as WorkCategory[])),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      masterDataApi.works.create({ job_id: jobId, work_category_id: workCatId, name, code }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-works'] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: () => masterDataApi.works.update(modal!.item!.id, { name, code }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-works'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.works.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-works'] }); setDeleteTarget(null); },
  });

  const openAdd = () => { setName(''); setCode(''); setJobId(''); setWorkCatId(''); setModal({ type: 'add' }); };
  const openEdit = (w: Work) => { setName(w.name); setCode(w.code); setModal({ type: 'edit', item: w }); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{items.length} works</p>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Add Work
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-gray-400 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 bg-blue-50 rounded">{w.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                  <td className="px-4 py-3 text-gray-500">{w.work_category?.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(w)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(w)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-900">{modal.type === 'add' ? 'Add' : 'Edit'} Work</h2>
            {modal.type === 'add' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job *</label>
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select job</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Category *</label>
                  <select
                    value={workCatId}
                    onChange={(e) => setWorkCatId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {workCats.map((wc) => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WRK-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={!name.trim() || !code.trim() || (modal.type === 'add' && (!jobId || !workCatId))}
                onClick={() => modal.type === 'add' ? createMutation.mutate() : updateMutation.mutate()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function MasterDataPage() {
  const [tab, setTab] = useState<TabKey>('jobs');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage reference data for the platform</p>
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jobs' && <JobsTab />}
      {tab === 'workCategories' && <WorkCategoriesTab />}
      {tab === 'works' && <WorksTab />}
      {tab === 'aiCapabilities' && <AiCapabilitiesTab />}
    </div>
  );
}
