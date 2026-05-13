import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { managementApi } from '../api';
import type { BPStatus, BestPracticeListItem, ReviewAction } from '../types';

const STATUS_STYLES: Record<BPStatus, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<BPStatus, string> = {
  REQUESTED: 'Pending',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

interface ReviewModal {
  bp: BestPracticeListItem;
  action: ReviewAction;
}

export default function ManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<BPStatus | ''>('REQUESTED');
  const [modal, setModal] = useState<ReviewModal | null>(null);
  const [comment, setComment] = useState('');
  const [closeReason, setCloseReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['mgmt-queue', page, statusFilter],
    queryFn: () =>
      managementApi
        .queue({ page, size: 10, status: statusFilter || undefined })
        .then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ bpId, action, comment }: { bpId: string; action: ReviewAction; comment?: string }) =>
      managementApi.review(bpId, { action, comment }),
    onSuccess: () => {
      setModal(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['mgmt-queue'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ bpId, reason }: { bpId: string; reason: string }) =>
      managementApi.close(bpId, reason),
    onSuccess: () => {
      setModal(null);
      setCloseReason('');
      queryClient.invalidateQueries({ queryKey: ['mgmt-queue'] });
    },
  });

  const handleSubmitReview = () => {
    if (!modal) return;
    if (modal.action === 'CLOSED') {
      closeMutation.mutate({ bpId: modal.bp.id, reason: closeReason });
    } else {
      reviewMutation.mutate({ bpId: modal.bp.id, action: modal.action, comment: comment || undefined });
    }
  };

  const isPending = reviewMutation.isPending || closeMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Management Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve submitted best practices</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {([
          { label: 'Pending', value: 'REQUESTED' },
          { label: 'Published', value: 'PUBLISHED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'All', value: '' },
        ] as { label: string; value: BPStatus | '' }[]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin text-2xl mb-2">⟳</div>
          </div>
        ) : data?.content.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">✅</div>
            <p>No items in queue</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Best Practice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Creators</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.content.map((bp) => (
                  <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/library/${bp.id}`)}
                        className="font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {bp.name}
                      </button>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{bp.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {bp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[bp.status]}`}>
                        {STATUS_LABELS[bp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {bp.creators.map((c) => c.name).join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {bp.status === 'REQUESTED' && (
                          <>
                            <button
                              onClick={() => { setModal({ bp, action: 'APPROVED' }); setComment(''); }}
                              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setModal({ bp, action: 'REJECTED' }); setComment(''); }}
                              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => { setModal({ bp, action: 'CLOSED' }); setCloseReason(''); }}
                              className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Close
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/library/${bp.id}`)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">{data.totalElements} total</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    {page + 1} / {data.totalPages}
                  </span>
                  <button
                    disabled={page >= data.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                modal.action === 'APPROVED' ? 'bg-green-100' :
                modal.action === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {modal.action === 'APPROVED' ? '✓' : modal.action === 'REJECTED' ? '✕' : '⊘'}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  {modal.action === 'APPROVED' ? 'Approve' :
                   modal.action === 'REJECTED' ? 'Reject' : 'Close'} Best Practice
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{modal.bp.name}</p>
              </div>
            </div>

            {modal.action === 'CLOSED' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for closing *</label>
                <textarea
                  rows={3}
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="Explain why this is being closed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment {modal.action === 'REJECTED' ? '*' : '(optional)'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={modal.action === 'REJECTED' ? 'Explain reason for rejection...' : 'Add a note (optional)...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={
                  isPending ||
                  (modal.action === 'REJECTED' && !comment.trim()) ||
                  (modal.action === 'CLOSED' && !closeReason.trim())
                }
                className={`flex-1 py-2.5 text-white rounded-lg text-sm disabled:opacity-50 transition-colors ${
                  modal.action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' :
                  modal.action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-700 hover:bg-gray-800'
                }`}
              >
                {isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
