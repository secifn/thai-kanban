import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Trash2,
  Save,
  Calendar,
  Link as LinkIcon,
  User,
  Hash,
  AlignLeft
} from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import type { Card, CardProperty } from '../types';

interface CardEditorProps {
  card: Card;
  onClose: () => void;
}

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  propColorRed: { bg: 'bg-red-500/20', text: 'text-red-300', ring: 'ring-red-500/50' },
  propColorOrange: { bg: 'bg-orange-500/20', text: 'text-orange-300', ring: 'ring-orange-500/50' },
  propColorYellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', ring: 'ring-yellow-500/50' },
  propColorGreen: { bg: 'bg-green-500/20', text: 'text-green-300', ring: 'ring-green-500/50' },
  propColorBlue: { bg: 'bg-blue-500/20', text: 'text-blue-300', ring: 'ring-blue-500/50' },
  propColorPurple: { bg: 'bg-purple-500/20', text: 'text-purple-300', ring: 'ring-purple-500/50' },
  propColorPink: { bg: 'bg-pink-500/20', text: 'text-pink-300', ring: 'ring-pink-500/50' },
  propColorBrown: { bg: 'bg-amber-500/20', text: 'text-amber-300', ring: 'ring-amber-500/50' },
  propColorGray: { bg: 'bg-slate-500/20', text: 'text-slate-300', ring: 'ring-slate-500/50' },
};

export default function CardEditor({ card, onClose }: CardEditorProps) {
  const { currentBoard, updateCard, deleteCard, cards } = useBoardStore();
  const [title, setTitle] = useState(card.title);
  const [properties, setProperties] = useState<Record<string, string>>(card.properties);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with store when card changes
  useEffect(() => {
    const updatedCard = cards.find(c => c.id === card.id);
    if (updatedCard) {
      setTitle(updatedCard.title);
      setProperties(updatedCard.properties);
    }
  }, [cards, card.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCard(card.id, { title, properties });
    } catch (error) {
      console.error('Failed to save card:', error);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการ์ดนี้?')) {
      try {
        await deleteCard(card.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
    }
  };

  const handlePropertyChange = async (propertyId: string, value: string) => {
    const newProperties = { ...properties, [propertyId]: value };
    setProperties(newProperties);

    // Auto-save property changes
    try {
      await updateCard(card.id, { properties: newProperties });
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };

  const renderPropertyInput = (property: CardProperty) => {
    const value = properties[property.id] || '';

    switch (property.type) {
      case 'select':
        return (
          <div className="flex flex-wrap gap-2">
            {property.options.map(option => {
              const colors = colorMap[option.color] || colorMap.propColorGray;
              const isSelected = value === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handlePropertyChange(property.id, isSelected ? '' : option.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    }
                  `}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value ? new Date(parseInt(value)).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value).getTime().toString() : '';
              handlePropertyChange(property.id, date);
            }}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        );
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'url': return <LinkIcon className="w-4 h-4" />;
      case 'multiPerson':
      case 'createdBy': return <User className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      default: return <AlignLeft className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 w-full max-w-lg h-full glass shadow-2xl z-50 flex flex-col border-l border-slate-700/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{card.icon || '📝'}</span>
            <span className="text-sm text-slate-400">แก้ไขการ์ด</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              title="ลบการ์ด"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Title */}
          <div className="mb-8">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-xl font-semibold text-white bg-transparent border-0 border-b-2 border-transparent hover:border-slate-600 focus:border-purple-500 focus:outline-none pb-3 transition-colors placeholder-slate-500"
              placeholder="ชื่อการ์ด"
            />
          </div>

          {/* Properties */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              คุณสมบัติ
            </h3>

            {currentBoard?.properties.map(property => (
              <div key={property.id} className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  {getPropertyIcon(property.type)}
                  {property.name}
                </label>
                {renderPropertyInput(property)}
              </div>
            ))}
          </div>

          {/* Content/Notes section */}
          <div className="mt-10">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
              หมายเหตุ
            </h3>
            <textarea
              className="w-full h-36 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
              placeholder="เพิ่มหมายเหตุ..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700/50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

