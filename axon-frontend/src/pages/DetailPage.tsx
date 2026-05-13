import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bpApi, feedbackApi, aiInsightApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { BPType } from '../types';

const TYPE_COLORS: Record<BPType, string> = {
  WEB: 'bg-blue-100 text-blue-700',
  TOOL: 'bg-purple-100 text-purple-700',
  EXTENSION: 'bg-green-100 text-green-700',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Tab = 'documentation' | 'files' | 'feedback' | 'ai-insight';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('documentation');
  const [feedbackText, setFeedbackText] = useState('');

  const { data: bp, isLoading } = useQuery({
    queryKey: ['bp', id],
    queryFn: () => bpApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => feedbackApi.list(id!).then((r) => r.data),
    enabled: !!id && tab === 'feedback',
  });

  const { data: aiInsight } = useQuery({
    queryKey: ['ai-insight', id],
    queryFn: () => aiInsightApi.classify(id!).then((r) => r.data),
    enabled: !!id && tab === 'ai-insight',
  });

  const feedbackMutation = useMutation({
    mutationFn: (content: string) => feedbackApi.create(id!, content),
    onSuccess: () => {
      setFeedbackText('');
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: (fid: string) => feedbackApi.delete(id!, fid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback', id] }),
  });

  const likeMutation = useMutation({
    mutationFn: () =>
      bp?.is_liked_by_current_user ? bpApi.unlike(id!) : bpApi.like(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bp', id] }),
  });

  const handleDownload = async (fileId: string, fileName: string) => {
    const res = await bpApi.download(id!, fileId);
    const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin text-2xl">⟳</div>
      </div>
    );
  }

  if (!bp) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Best practice not found.</p>
        <button onClick={() => navigate('/library')} className="mt-4 text-blue-600 underline text-sm">
          Back to Library
        </button>
      </div>
    );
  }

  const isCreator = bp.creators.some((c) => c.id === user?.id);
  const canEdit = isCreator || user?.role === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      {/* Left sidebar */}
      <aside className="lg:w-72 shrink-0 space-y-4">
        <button
          onClick={() => navigate('/library')}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          ← Back to Library
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          {bp.thumbnail_url && (
            <img src={bp.thumbnail_url} alt={bp.name} className="w-full h-40 object-cover rounded-lg" />
          )}

          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[bp.type]}`}>
              {bp.type}
            </span>
            <h1 className="mt-2 font-bold text-gray-900 text-lg leading-tight">{bp.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{bp.description}</p>
          </div>

          <div className="flex gap-4 text-sm text-gray-500">
            <button
              onClick={() => likeMutation.mutate()}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${bp.is_liked_by_current_user ? 'text-red-500' : ''}`}
            >
              ♥ {bp.like_count}
            </button>
            <span className="flex items-center gap-1">👁 {bp.view_count}</span>
            <span className="flex items-center gap-1">⬇ {bp.download_count}</span>
          </div>

          {/* Meta */}
          <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
            {bp.job.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Job</span>
                <p className="text-gray-700">{bp.job.map((j) => j.name).join(', ')}</p>
              </div>
            )}
            {bp.work && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Work</span>
                <p className="text-gray-700">
                  {bp.work.code} — {bp.work.name}
                </p>
              </div>
            )}
            {bp.ai_capability.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">AI Capability</span>
                <p className="text-gray-700">{bp.ai_capability.map((a) => a.name).join(', ')}</p>
              </div>
            )}
            {bp.creators.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Creators</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bp.creators.map((c) => (
                    <span key={c.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {bp.published_at && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Published</span>
                <p className="text-gray-700">{new Date(bp.published_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {canEdit && (
            <button
              onClick={() => navigate(`/register?edit=${id}`)}
              className="w-full py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
          {([
            { key: 'documentation', label: 'Documentation' },
            { key: 'files', label: `Files (${bp.files.length})` },
            { key: 'feedback', label: 'Feedback' },
            { key: 'ai-insight', label: 'AI Insight' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {tab === 'documentation' && (
            <div className="space-y-6">
              {bp.installation_guide && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">Installation Guide</h2>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {bp.installation_guide}
                  </div>
                </div>
              )}
              {bp.web_content && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">Web Content / URL</h2>
                  <a
                    href={bp.web_content}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline break-all text-sm"
                  >
                    {bp.web_content}
                  </a>
                </div>
              )}
              {bp.ai_tools_description && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">AI Tools Description</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{bp.ai_tools_description}</p>
                </div>
              )}
              {bp.key_value && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">Key Value</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{bp.key_value}</p>
                </div>
              )}
              {!bp.installation_guide && !bp.web_content && !bp.ai_tools_description && !bp.key_value && (
                <p className="text-gray-400 text-sm">No documentation available.</p>
              )}
            </div>
          )}

          {tab === 'files' && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900">Attached Files</h2>
              {bp.files.length === 0 ? (
                <p className="text-gray-400 text-sm">No files attached.</p>
              ) : (
                <div className="space-y-2">
                  {bp.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{file.file_name}</p>
                          <p className="text-xs text-gray-400">
                            {formatBytes(file.file_size)} · {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file.id, file.file_name)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'feedback' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Feedback</h2>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    rows={3}
                    placeholder="Add a comment..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    disabled={!feedbackText.trim() || feedbackMutation.isPending}
                    onClick={() => feedbackMutation.mutate(feedbackText.trim())}
                    className="self-end px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>

              <div className="space-y-3 divide-y divide-gray-100">
                {feedback.map((f) => (
                  <div key={f.id} className="flex gap-3 pt-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                      {f.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">{f.user.name}</span>
                        <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{f.content}</p>
                    </div>
                    {(f.user.id === user?.id || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => deleteFeedbackMutation.mutate(f.id)}
                        className="text-gray-300 hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ai-insight' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">AI Classification Insight</h2>
              {!aiInsight ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin">⟳</div>
                  <span className="text-sm">Analyzing...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-700">{aiInsight.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      AI Classified
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{aiInsight.description}</p>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Key Drivers</p>
                    <ul className="space-y-1">
                      {aiInsight.embodiments.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-400 mt-0.5">•</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scope</p>
                    <p className="text-sm text-gray-700">{aiInsight.scope}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
