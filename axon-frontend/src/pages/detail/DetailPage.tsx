import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bpApi } from '../../api/auth';
import { TypeBadgeList } from '../../components/ui/TypeBadge';
import { RankingBadge } from '../../components/ui/RankingBadge';
import { FileList } from '../../components/detail/FileList';
import type { BestPractice } from '../../types';

export function DetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: bp, isLoading } = useQuery({
    queryKey: ['best-practice', id],
    queryFn: () => bpApi.detail(id!).then(res => res.data as BestPractice),
    enabled: !!id,
  });

  if (isLoading) return <div className="py-20 text-center animate-pulse font-bold text-gray-400">Loading details...</div>;
  if (!bp) return <div className="py-20 text-center font-bold text-red-500">Best practice not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors">
        ← Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-4">
                <TypeBadgeList types={bp.types} />
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                  {bp.title}
                </h1>
              </div>
              <RankingBadge score={bp.usageScore} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {bp.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-blue max-w-none bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                {bp.description}
              </p>
            </div>
          </section>

          {bp.usageGuide && (
            <section className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📖</span> Usage Guide
              </h2>
              <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 font-medium leading-loose">
                  {bp.usageGuide}
                </div>
              </div>
            </section>
          )}

          {bp.installGuide && (
            <section className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔧</span> Installation
              </h2>
              <div className="bg-gray-50 text-gray-700 p-8 rounded-2xl border border-gray-100 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner">
                <pre className="whitespace-pre-wrap">
                  {bp.installGuide}
                </pre>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-lg shadow-gray-100 space-y-6">
            <div className="flex items-center gap-4">
              {bp.author.avatarUrl ? (
                <img src={bp.author.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white ring-2 ring-blue-50" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-100">
                  {bp.author.name[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Contributor</p>
                <p className="font-bold text-gray-900">{bp.author.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Views</p>
                <p className="text-lg font-black text-gray-900">{bp.viewCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Downloads</p>
                <p className="text-lg font-black text-gray-900">{bp.downloadCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Published On</p>
              <p className="text-sm font-bold text-gray-700">
                {bp.publishedAt ? new Date(bp.publishedAt).toLocaleDateString('vi-VN', { 
                  day: 'numeric', month: 'long', year: 'numeric' 
                }) : 'Not published yet'}
              </p>
            </div>
          </section>

          <FileList files={bp.files} bpId={bp.id} />

          {bp.externalLinks && bp.externalLinks.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">External Links</h3>
              <div className="space-y-2">
                {bp.externalLinks.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all group"
                  >
                    <span className="text-sm font-bold truncate pr-2">{link.label}</span>
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors">↗</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {bp.type === 'AGENT_WORKFLOW' && bp.agentWorkflowId && (
            <section className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-violet-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-black">AI Workflow</h3>
              </div>
              <p className="text-violet-100 text-sm font-medium leading-relaxed">
                This best practice includes an executable AI workflow you can run directly.
              </p>
              <button className="w-full bg-white text-violet-700 font-black py-3 rounded-xl shadow-lg hover:bg-violet-50 transition-colors">
                Open in Agent Builder
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
