import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: ReactNode;
}

const colorMap: Record<string, { dot: string; glow: string }> = {
  propColorRed: { dot: 'bg-red-500', glow: 'shadow-red-500/20' },
  propColorOrange: { dot: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  propColorYellow: { dot: 'bg-yellow-500', glow: 'shadow-yellow-500/20' },
  propColorGreen: { dot: 'bg-green-500', glow: 'shadow-green-500/20' },
  propColorBlue: { dot: 'bg-blue-500', glow: 'shadow-blue-500/20' },
  propColorPurple: { dot: 'bg-purple-500', glow: 'shadow-purple-500/20' },
  propColorPink: { dot: 'bg-pink-500', glow: 'shadow-pink-500/20' },
  propColorBrown: { dot: 'bg-amber-700', glow: 'shadow-amber-700/20' },
  propColorGray: { dot: 'bg-slate-400', glow: 'shadow-slate-400/20' },
};

export default function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const colors = colorMap[color] || { dot: 'bg-slate-400', glow: 'shadow-slate-400/20' };

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-slate-800/40 backdrop-blur-sm rounded-2xl p-4 border transition-all duration-200
        ${isOver
          ? 'border-purple-500/50 bg-purple-500/10 ring-2 ring-purple-500/20'
          : 'border-slate-700/50'
        }
      `}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <div className={`w-3 h-3 rounded-full ${colors.dot} shadow-lg ${colors.glow}`} />
        <h3 className="font-medium text-slate-200 flex-1 truncate">
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2.5 py-1 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards container */}
      <div className="space-y-3 min-h-[120px]">
        {children}
      </div>
    </div>
  );
}

