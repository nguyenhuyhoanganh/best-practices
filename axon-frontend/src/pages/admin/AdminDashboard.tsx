import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/auth';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TypeBadge, TypeBadgeList } from '../../components/ui/TypeBadge';
import type { BestPracticeListItem, BPType } from '../../types';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(res => res.data),
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => adminApi.reject(id, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  const handleReject = (id: string) => {
    const comment = window.prompt('Please enter rejection reason:');
    if (comment) rejectMutation.mutate({ id, comment });
  };

  const getPercentage = (val: number, total: number) => {
    if (!total) return '0%';
    return Math.round((val / total) * 100) + '%';
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900">Admin Analytics</h1>
        <p className="text-gray-500 font-medium">Monitoring AXon ecosystem performance and health.</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Platform Users', val: stats?.totalUsers || 0, icon: '👥', color: 'blue' },
          { label: 'Published Items', val: stats?.publishedItems || 0, icon: '✅', color: 'green' },
          { label: 'Total Views', val: stats?.totalViews || 0, icon: '👁️', color: 'indigo' },
          { label: 'File Downloads', val: stats?.totalDownloads || 0, icon: '📥', color: 'violet' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div className={`w-10 h-10 rounded-2xl bg-${s.color}-50 flex items-center justify-center text-xl`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-gray-900">{s.val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review Queue (Large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Active Review Queue
            </h2>
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black">
              {queue?.length || 0} PENDING
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-10 text-center animate-pulse text-gray-400 font-bold">Loading queue...</div>
            ) : !queue?.length ? (
              <div className="py-20 text-center space-y-4">
                <span className="text-4xl">🏝️</span>
                <p className="text-gray-400 font-bold">The queue is clear!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Title & Classification</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(bp => (
                    <tr key={bp.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <p className="font-bold text-gray-900">{bp.title}</p>
                          <div className="flex items-center gap-2">
                            <TypeBadgeList types={bp.types as BPType[]} />
                            <span className="text-[10px] font-bold text-gray-300">• by {bp.author.name}</span>
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
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-black hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
                            >
                              Claim
                            </button>
                          )}
                          {bp.status === 'UNDER_REVIEW' && (
                            <>
                              <button 
                                onClick={() => approveMutation.mutate(bp.id)}
                                className="bg-green-500 text-white px-4 py-1.5 rounded-xl text-xs font-black hover:bg-green-600 shadow-md shadow-green-100 transition-all"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(bp.id)}
                                className="bg-white border border-red-200 text-red-500 px-4 py-1.5 rounded-xl text-xs font-black hover:bg-red-50 transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <a 
                            href={`/best-practices/${bp.id}`} target="_blank"
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                          >
                            👁
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Data Distribution (Sidebar) */}
        <div className="space-y-8">
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📊</span> Distribution by Role
            </h3>
            <div className="space-y-5">
              {stats?.distributionByRole && Object.entries(stats.distributionByRole).length > 0 ? (
                Object.entries(stats.distributionByRole).map(([role, count]) => (
                  <div key={role} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>{role}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: getPercentage(Number(count), stats.totalBestPractices) }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No data yet</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🛠️</span> Distribution by Type
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats?.distributionByType && Object.entries(stats.distributionByType).length > 0 ? (
                Object.entries(stats.distributionByType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-400">{type}</span>
                    <span className="bg-white px-2 py-0.5 rounded-lg text-xs font-black text-gray-700 shadow-sm">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
