import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bpApi } from '../api';
import type { BPType, BestPracticeListItem } from '../types';

const TYPE_TABS: { label: string; value: BPType | '' }[] = [
  { label: 'All Types', value: '' },
  { label: 'WEB', value: 'WEB' },
  { label: 'TOOL', value: 'TOOL' },
  { label: 'EXTENSION', value: 'EXTENSION' },
];

const TYPE_COLORS: Record<BPType, string> = {
  WEB: 'bg-blue-100 text-blue-700',
  TOOL: 'bg-purple-100 text-purple-700',
  EXTENSION: 'bg-green-100 text-green-700',
};

function BpCard({ bp, onLike }: { bp: BestPracticeListItem; onLike: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/library/${bp.id}`)}
      className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      {bp.thumbnail_url && (
        <img src={bp.thumbnail_url} alt={bp.name} className="w-full h-36 object-cover rounded-lg" />
      )}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[bp.type]}`}>
          {bp.type}
        </span>
        {bp.work && (
          <span className="text-xs text-gray-400 font-mono">{bp.work.code}</span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{bp.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bp.description}</p>
      </div>
      {bp.creators.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            {bp.creators.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                title={c.name}
              >
                {c.name.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {bp.creators.map((c) => c.name).join(', ')}
          </span>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${bp.is_liked_by_current_user ? 'text-red-500' : ''}`}
        >
          ♥ {bp.like_count}
        </button>
        <span className="flex items-center gap-1">👁 {bp.view_count}</span>
        <span className="flex items-center gap-1">⬇ {bp.download_count}</span>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<BPType | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['bps', { search, type, page }],
    queryFn: () =>
      bpApi
        .list({ search: search || undefined, type: type || undefined, page, size: 12 })
        .then((r) => r.data),
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? bpApi.unlike(id) : bpApi.like(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bps'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Best Practice Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">Discover and share best practices</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search best practices..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setType(tab.value); setPage(0); }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                type === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : data?.content.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No best practices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.content.map((bp) => (
            <BpCard
              key={bp.id}
              bp={bp}
              onLike={() =>
                likeMutation.mutate({ id: bp.id, liked: bp.is_liked_by_current_user })
              }
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
