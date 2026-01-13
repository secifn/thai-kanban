import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Card } from '../types';

interface KanbanCardProps {
  card: Card;
  color?: string;
  isDragging?: boolean;
  onClick?: () => void;
}

const colorMap: Record<string, string> = {
  propColorRed: 'border-l-red-500',
  propColorOrange: 'border-l-orange-500',
  propColorYellow: 'border-l-yellow-500',
  propColorGreen: 'border-l-green-500',
  propColorBlue: 'border-l-blue-500',
  propColorPurple: 'border-l-purple-500',
  propColorPink: 'border-l-pink-500',
  propColorBrown: 'border-l-amber-700',
  propColorGray: 'border-l-slate-400',
};

export default function KanbanCard({ card, color, isDragging, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const borderColor = color ? colorMap[color] : '';

  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-20 bg-slate-200 rounded-lg border-2 border-dashed border-slate-300"
      />
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-slate-200 p-3 cursor-pointer
        hover:shadow-md hover:border-slate-300 transition-all
        ${borderColor ? `border-l-4 ${borderColor}` : ''}
        ${isDragging ? 'shadow-xl ring-2 ring-indigo-400' : ''}
      `}
    >
      {/* Card icon and title */}
      <div className="flex items-start gap-2">
        {card.icon && (
          <span className="text-lg flex-shrink-0">{card.icon}</span>
        )}
        <h4 className="text-sm font-medium text-slate-800 line-clamp-2 flex-1">
          {card.title}
        </h4>
      </div>

      {/* Card metadata - could be expanded */}
      {card.createdBy && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-xs text-indigo-600 font-medium">
              {card.createdBy.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
