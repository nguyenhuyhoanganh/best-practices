export function RankingBadge({ score }: { score: number }) {
  if (score < 10) return null;
  
  const getRankColor = () => {
    if (score >= 100) return 'text-amber-500 fill-amber-500';
    if (score >= 50) return 'text-slate-400 fill-slate-400';
    return 'text-orange-800 fill-orange-800';
  };

  return (
    <div className={`flex items-center gap-1 font-bold ${getRankColor()}`}>
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      <span className="text-sm">{score.toFixed(1)}</span>
    </div>
  );
}
