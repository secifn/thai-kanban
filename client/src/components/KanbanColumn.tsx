import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: ReactNode;
}

const colorMap: Record<string, string> = {
  propColorRed: 'bg-red-500',
  propColorOrange: 'bg-orange-500',
  propColorYellow: 'bg-yellow-500',
  propColorGreen: 'bg-green-500',
  propColorBlue: 'bg-blue-500',
  propColorPurple: 'bg-purple-500',
  propColorPink: 'bg-pink-500',
  propColorBrown: 'bg-amber-700',
  propColorGray: 'bg-slate-400',
};

export default function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  const dotColor = colorMap[color] || 'bg-slate-400';

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100/80 rounded-xl p-3 transition-colors ${
        isOver ? 'bg-indigo-100/80 ring-2 ring-indigo-300' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-3 h-3 rounded-full ${dotColor}`} />
        <h3 className="font-semibold text-slate-700 flex-1 truncate">
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards container */}
      <div className="space-y-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
