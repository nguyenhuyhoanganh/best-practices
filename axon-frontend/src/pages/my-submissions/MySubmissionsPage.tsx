import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bpApi } from '../../api/auth';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { BestPracticeListItem } from '../../types';

export function MySubmissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => bpApi.mySubmissions().then(res => res.data as BestPracticeListItem[]),
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900">My Submissions</h1>
        <Link to="/submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
          + New Best Practice
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 h-24 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : !data?.length ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-4">
          <span className="text-5xl">📝</span>
          <h3 className="text-xl font-bold text-gray-900">No submissions yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Share your first AI best practice with the community today!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map(bp => (
            <div key={bp.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between group hover:shadow-lg hover:border-blue-100 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                  {bp.type === 'SKILL_SET' ? '🔧' : bp.type === 'MCP_CONFIG' ? '🔌' : bp.type === 'RULE_SET' ? '📋' : '⚡'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{bp.title}</h3>
                    <StatusBadge status={bp.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                    <TypeBadge type={bp.type} />
                    <span>•</span>
                    <span>👁 {bp.viewCount} views</span>
                    <span>•</span>
                    <span>⬇ {bp.downloadCount} downloads</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  to={`/best-practices/${bp.id}`}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View
                </Link>
                {(bp.status === 'DRAFT' || bp.status === 'REJECTED') && (
                  <Link 
                    to={`/submit?id=${bp.id}`}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
