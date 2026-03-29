export function ScoreBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 70 ? 'bg-seafoam-500' : score >= 40 ? 'bg-sand-500' : 'bg-coral-500';
  const h = size === 'sm' ? 'h-2' : 'h-3';
  return (
    <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
      <div
        className={`${h} ${color} rounded-full transition-all duration-1000`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70
    ? 'bg-seafoam-100 text-seafoam-700'
    : score >= 40
      ? 'bg-sand-100 text-sand-700'
      : 'bg-coral-100 text-coral-700';
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold ${color}`}>
      {score}/100
    </span>
  );
}

export function ScoreColor(score: number): string {
  return score >= 70 ? 'seafoam' : score >= 40 ? 'sand' : 'coral';
}
