import { Link } from 'react-router-dom';
import type { BestPracticeListItem } from '../types';
import { TypeBadgeList } from './TypeBadge';
import { RankingBadge } from './RankingBadge';

export function BestPracticeCard({ bp }: { bp: BestPracticeListItem }) {
  return (
    <Link 
      to={`/best-practices/${bp.id}`}
      className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <TypeBadgeList types={bp.types} />
        <RankingBadge score={bp.usageScore} />
      </div>

      <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
        {bp.title}
      </h3>
      
      <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
        {bp.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {bp.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {tag}
          </span>
        ))}
        {bp.tags.length > 3 && (
          <span className="text-[10px] font-bold text-gray-400 px-1 py-0.5">+{bp.tags.length - 3}</span>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-auto">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {bp.author.avatarUrl ? (
            <img src={bp.author.avatarUrl} className="w-6 h-6 rounded-full border border-gray-100" alt="" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold">
              {bp.author.name[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-gray-600 truncate">{bp.author.name}</span>
        </div>
        
        <div className="flex items-center gap-3 text-gray-400 font-medium">
          <div className="flex items-center gap-1">
            <span className="text-[10px]">👁</span>
            <span className="text-[10px]">{bp.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">⬇</span>
            <span className="text-[10px]">{bp.downloadCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
