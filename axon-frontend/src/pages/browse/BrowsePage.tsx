import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { bpApi } from '../../api/auth';
import { BestPracticeCard } from '../../components/ui/BestPracticeCard';
import type { PagedResponse, BestPracticeListItem } from '../../types';

const ROLES = [
  { value: '', label: 'All Roles', icon: '🌟' },
  { value: 'backend', label: 'Backend', icon: '⚙️' },
  { value: 'frontend', label: 'Frontend', icon: '🎨' },
  { value: 'devops', label: 'DevOps', icon: '🚀' },
  { value: 'ba', label: 'BA', icon: '📊' },
  { value: 'pm', label: 'PM', icon: '👔' },
  { value: 'mobile', label: 'Mobile', icon: '📱' },
];

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '0');

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => bpApi.trending().then(res => res.data as BestPracticeListItem[]),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['best-practices', tag, searchParams.get('search'), sort, page],
    queryFn: () => bpApi.list({ 
      tag: tag || undefined, 
      search: searchParams.get('search') || undefined, 
      sort, 
      page 
    }).then(res => res.data as PagedResponse<BestPracticeListItem>),
  });

  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search, page: '0' });
  };

  return (
    <div className="space-y-10">
      {/* Trending Section */}
      {trending && trending.length > 0 && !searchParams.get('search') && !tag && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.slice(0, 3).map(bp => (
              <BestPracticeCard key={bp.id} bp={bp} />
            ))}
          </div>
        </section>
      )}

      {/* Hero / Search */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 md:p-14 text-white shadow-xl shadow-blue-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="max-w-2xl space-y-6 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Elevate Your <br/>AI Workflows
          </h1>
          <p className="text-blue-50 font-medium text-lg md:text-xl opacity-90">
            Standardize and share the best AI skills, configs, and rules within your team.
          </p>
          <form onSubmit={handleSearch} className="relative max-w-xl pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or tags..."
              className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-60">🔍</span>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-gray-100 pb-6">
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => updateParams({ tag: r.value, page: '0' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  tag === r.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <span>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sort by</span>
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value, page: '0' })}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="trending">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl h-64 animate-pulse"></div>
            ))}
          </div>
        ) : !data?.content.length ? (
          <div className="text-center py-20 space-y-4">
            <span className="text-6xl">🏜️</span>
            <h3 className="text-xl font-bold text-gray-900">No results found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              We couldn't find any best practices matching your criteria. Try adjusting your filters.
            </p>
            <button 
              onClick={() => { setSearch(''); updateParams({ search: null, tag: null, page: '0' }); }}
              className="text-blue-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.content.map(bp => (
                <BestPracticeCard key={bp.id} bp={bp} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8">
                {[...Array(data.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateParams({ page: i.toString() })}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                      page === i
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
