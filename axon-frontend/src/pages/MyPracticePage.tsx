import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bpApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { BPStatus, BestPracticeListItem } from '../types';

const STATUS_STYLES: Record<BPStatus, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<BPStatus, string> = {
  REQUESTED: 'Pending Review',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

export default function MyPracticePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BestPracticeListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bps', page],
    queryFn: () =>
      bpApi.list({ creator_id: user?.id, page, size: 10 }).then(r => r.data),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bpApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['my-bps'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Best Practices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your submitted best practices</p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Register New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin text-2xl mb-2">⟳</div>
            <p className="text-sm">Loading...</p>
          </div>
        ) : data?.content.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">No best practices yet</p>
            <p className="text-sm mt-1">Register your first best practice to get started</p>
            <button
              onClick={() => navigate('/register')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Register Now
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Likes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.content.map((bp) => (
                  <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/library/${bp.id}`)}
                        className="font-medium text-gray-900 hover:text-blue-600 text-left line-clamp-1 max-w-xs"
                      >
                        {bp.name}
                      </button>
                      <p className="text-xs text-gray-400 line-clamp-1">{bp.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {bp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[bp.status]}`}>
                        {STATUS_LABELS[bp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{bp.view_count}</td>
                    <td className="px-4 py-3 text-gray-500">{bp.like_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/register?edit=${bp.id}`)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        {bp.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => setDeleteTarget(bp)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {data.totalElements} total
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    {page + 1} / {data.totalPages}
                  </span>
                  <button
                    disabled={page >= data.totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
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

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-900">Delete Best Practice?</h2>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
