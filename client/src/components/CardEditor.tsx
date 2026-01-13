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
          <div className="flex flex-wrap gap-1">
            {property.options.map(option => {
              const colors = colorMap[option.color] || colorMap.propColorGray;
              const isSelected = value === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handlePropertyChange(property.id, isSelected ? '' : option.id)}
                  className={`
                    px-2.5 py-1 rounded-md text-sm font-medium transition-all
                    ${isSelected 
                      ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current` 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(property.id, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
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
        className="fixed inset-0 bg-black/30 z-40"
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 w-full max-w-lg h-full bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{card.icon || '📝'}</span>
            <span className="text-sm text-slate-500">แก้ไขการ์ด</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="ลบการ์ด"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Title */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-xl font-semibold text-slate-800 border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none pb-2 transition-colors"
              placeholder="ชื่อการ์ด"
            />
          </div>

          {/* Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              คุณสมบัติ
            </h3>
            
            {currentBoard?.properties.map(property => (
              <div key={property.id} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {getPropertyIcon(property.type)}
                  {property.name}
                </label>
                {renderPropertyInput(property)}
              </div>
            ))}
          </div>

          {/* Content/Notes section */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              หมายเหตุ
            </h3>
            <textarea
              className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="เพิ่มหมายเหตุ..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
