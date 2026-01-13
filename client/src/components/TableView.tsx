import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import type { Card } from '../types';

interface TableViewProps {
  onCardClick: (card: Card) => void;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  propColorRed: { bg: 'bg-red-500/20', text: 'text-red-300' },
  propColorOrange: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
  propColorYellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
  propColorGreen: { bg: 'bg-green-500/20', text: 'text-green-300' },
  propColorBlue: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  propColorPurple: { bg: 'bg-purple-500/20', text: 'text-purple-300' },
  propColorPink: { bg: 'bg-pink-500/20', text: 'text-pink-300' },
  propColorBrown: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  propColorGray: { bg: 'bg-slate-500/20', text: 'text-slate-300' },
};

export default function TableView({ onCardClick }: TableViewProps) {
  const { currentBoard, cards, createCard } = useBoardStore();

  const visibleProperties = useMemo(() => {
    if (!currentBoard) return [];
    // Show first 5 properties
    return currentBoard.properties.slice(0, 5);
  }, [currentBoard]);

  const handleAddCard = async () => {
    try {
      const card = await createCard({ title: 'การ์ดใหม่' });
      onCardClick(card);
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  const renderPropertyValue = (card: Card, propertyId: string) => {
    const property = currentBoard?.properties.find(p => p.id === propertyId);
    if (!property) return '-';

    const value = card.properties[propertyId];
    if (!value) return <span className="text-slate-500">-</span>;

    switch (property.type) {
      case 'select': {
        const option = property.options.find(o => o.id === value);
        if (!option) return '-';
        const colors = colorMap[option.color] || colorMap.propColorGray;
        return (
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
            {option.value}
          </span>
        );
      }

      case 'date': {
        const date = new Date(parseInt(value));
        return (
          <span className="text-slate-300">
            {date.toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        );
      }

      case 'url':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {new URL(value).hostname}
          </a>
        );

      default:
        return <span className="text-slate-300">{value}</span>;
    }
  };

  if (!currentBoard) return null;

  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700/50">
              <th className="text-left px-5 py-4 text-sm font-semibold text-slate-300 sticky left-0 bg-slate-800/80 backdrop-blur-sm min-w-[200px]">
                ชื่อ
              </th>
              {visibleProperties.map(property => (
                <th
                  key={property.id}
                  className="text-left px-5 py-4 text-sm font-semibold text-slate-300 min-w-[150px]"
                >
                  {property.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <motion.tr
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onCardClick(card)}
                className="border-b border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-colors group"
              >
                <td className="px-5 py-4 sticky left-0 bg-slate-800/50 backdrop-blur-sm group-hover:bg-slate-700/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{card.icon || '📝'}</span>
                    <span className="font-medium text-slate-200">{card.title}</span>
                  </div>
                </td>
                {visibleProperties.map(property => (
                  <td key={property.id} className="px-5 py-4 text-sm">
                    {renderPropertyValue(card, property.id)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add card row */}
      <button
        onClick={handleAddCard}
        className="w-full flex items-center gap-2 px-5 py-4 text-sm text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
      >
        <Plus className="w-4 h-4" />
        เพิ่มการ์ดใหม่
      </button>

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          ยังไม่มีการ์ด คลิก "เพิ่มการ์ดใหม่" เพื่อเริ่มต้น
        </div>
      )}
    </div>
  );
}

