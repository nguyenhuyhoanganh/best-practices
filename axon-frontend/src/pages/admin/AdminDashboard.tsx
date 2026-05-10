import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/auth';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TypeBadge } from '../../components/ui/TypeBadge';
import type { BestPracticeListItem } from '../../types';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: queue, isLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: () => adminApi.queue().then(res => res.data as BestPracticeListItem[]),
  });

  const takeMutation = useMutation({
    mutationFn: (id: string) => adminApi.take(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => adminApi.reject(id, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  const handleReject = (id: string) => {
    const comment = window.prompt('Please enter rejection reason:');
    if (comment) rejectMutation.mutate({ id, comment });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 font-medium">Review and manage community submissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Review</p>
          <p className="text-4xl font-black text-amber-500">{queue?.filter(x => x.status === 'PENDING_REVIEW').length || 0}</p>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Under Review</p>
          <p className="text-4xl font-black text-blue-500">{queue?.filter(x => x.status === 'UNDER_REVIEW').length || 0}</p>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Submissions</p>
          <p className="text-4xl font-black text-gray-900">{queue?.length || 0}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Review Queue</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-white border border-gray-50 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : !queue?.length ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl py-20 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-gray-400 font-bold mt-4">Queue is empty! Good job.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(bp => (
                  <tr key={bp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">{bp.title}</p>
                        <div className="flex items-center gap-2">
                          <TypeBadge type={bp.type} />
                          <span className="text-[10px] font-bold text-gray-300">by {bp.author.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={bp.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bp.status === 'PENDING_REVIEW' && (
                          <button 
                            onClick={() => takeMutation.mutate(bp.id)}
                            className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100"
                          >
                            Take
                          </button>
                        )}
                        {bp.status === 'UNDER_REVIEW' && (
                          <>
                            <button 
                              onClick={() => approveMutation.mutate(bp.id)}
                              className="bg-green-50 text-green-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(bp.id)}
                              className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <a 
                          href={`/best-practices/${bp.id}`} target="_blank"
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          👁
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
