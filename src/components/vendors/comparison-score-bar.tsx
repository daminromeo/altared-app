'use client';

interface ScoreBarProps {
  score: number; // 0-100
  isTopPick?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#047857'; // green
  if (score >= 50) return '#C9A96E'; // gold
  if (score >= 25) return '#D97706'; // amber
  return '#DC2626'; // red
}

function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-[#047857]/10';
  if (score >= 50) return 'bg-[#C9A96E]/10';
  if (score >= 25) return 'bg-[#D97706]/10';
  return 'bg-[#DC2626]/10';
}

export function ScoreBar({ score, isTopPick = false }: ScoreBarProps) {
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-[#7A7A7A]">/100</span>
      </div>
      <div className="w-full max-w-[120px] h-2 rounded-full bg-[#E8E4DF] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {isTopPick && (
        <span className="inline-flex items-center rounded-full bg-[#047857]/10 px-2 py-0.5 text-[10px] font-semibold text-[#047857] uppercase tracking-wider">
          Best Match
        </span>
      )}
    </div>
  );
}

export { getScoreColor, getScoreBg };
