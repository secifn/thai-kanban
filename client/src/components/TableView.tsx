import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import type { Card } from '../types';

interface TableViewProps {
  onCardClick: (card: Card) => void;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  propColorRed: { bg: 'bg-red-100', text: 'text-red-700' },
  propColorOrange: { bg: 'bg-orange-100', text: 'text-orange-700' },
  propColorYellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  propColorGreen: { bg: 'bg-green-100', text: 'text-green-700' },
  propColorBlue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  propColorPurple: { bg: 'bg-purple-100', text: 'text-purple-700' },
  propColorPink: { bg: 'bg-pink-100', text: 'text-pink-700' },
  propColorBrown: { bg: 'bg-amber-100', text: 'text-amber-700' },
  propColorGray: { bg: 'bg-slate-100', text: 'text-slate-700' },
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
    if (!value) return '-';

    switch (property.type) {
      case 'select': {
        const option = property.options.find(o => o.id === value);
        if (!option) return '-';
        const colors = colorMap[option.color] || colorMap.propColorGray;
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
            {option.value}
          </span>
        );
      }

      case 'date': {
        const date = new Date(parseInt(value));
        return date.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }

      case 'url':
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {new URL(value).hostname}
          </a>
        );

      default:
        return value;
    }
  };

  if (!currentBoard) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[200px]">
                ชื่อ
              </th>
              {visibleProperties.map(property => (
                <th 
                  key={property.id}
                  className="text-left px-4 py-3 text-sm font-semibold text-slate-600 min-w-[150px]"
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
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span>{card.icon || '📝'}</span>
                    <span className="font-medium text-slate-800">{card.title}</span>
                  </div>
                </td>
                {visibleProperties.map(property => (
                  <td key={property.id} className="px-4 py-3 text-sm text-slate-600">
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
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
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
