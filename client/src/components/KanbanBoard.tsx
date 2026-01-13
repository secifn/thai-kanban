import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import type { Card } from '../types';

interface KanbanBoardProps {
  statusPropertyId: string;
  onCardClick: (card: Card) => void;
}

export default function KanbanBoard({ statusPropertyId, onCardClick }: KanbanBoardProps) {
  const { currentBoard, cards, createCard, reorderCards } = useBoardStore();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const statusProperty = useMemo(() => {
    return currentBoard?.properties.find(p => p.id === statusPropertyId);
  }, [currentBoard, statusPropertyId]);

  const columns = useMemo(() => {
    if (!statusProperty) return [];

    return [
      ...statusProperty.options.map(opt => ({
        id: opt.id,
        title: opt.value,
        color: opt.color,
      })),
      { id: '_none', title: 'ไม่ระบุสถานะ', color: 'propColorGray' },
    ];
  }, [statusProperty]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, Card[]>();

    columns.forEach(col => {
      map.set(col.id, []);
    });

    cards.forEach(card => {
      const status = card.properties[statusPropertyId] || '_none';
      const columnCards = map.get(status) || map.get('_none')!;
      columnCards.push(card);
    });

    // Sort each column by order
    map.forEach(columnCards => {
      columnCards.sort((a, b) => a.order - b.order);
    });

    return map;
  }, [cards, columns, statusPropertyId]);

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) return;

    // Get the column ID from the over element
    let overColumnId: string | null = null;

    // Check if we're over a card or a column
    const overCard = cards.find(c => c.id === over.id);
    if (overCard) {
      overColumnId = overCard.properties[statusPropertyId] || '_none';
    } else {
      // We're over a column directly
      overColumnId = over.id as string;
    }

    const activeColumnId = activeCard.properties[statusPropertyId] || '_none';

    // If moving to a different column, update the card's status
    if (overColumnId && activeColumnId !== overColumnId) {
      const newProperties = { ...activeCard.properties };
      if (overColumnId === '_none') {
        delete newProperties[statusPropertyId];
      } else {
        newProperties[statusPropertyId] = overColumnId;
      }

      // Optimistic update
      useBoardStore.setState(state => ({
        cards: state.cards.map(c =>
          c.id === activeCard.id
            ? { ...c, properties: newProperties }
            : c
        ),
      }));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) return;

    // Calculate new order
    let overColumnId: string;
    const overCard = cards.find(c => c.id === over.id);

    if (overCard) {
      overColumnId = overCard.properties[statusPropertyId] || '_none';
    } else {
      overColumnId = over.id as string;
    }

    const columnCards = cardsByColumn.get(overColumnId) || [];

    let newOrder: number;
    if (overCard) {
      const overIndex = columnCards.findIndex(c => c.id === over.id);
      newOrder = overIndex;
    } else {
      newOrder = columnCards.length;
    }

    // Prepare update data
    const newProperties = { ...activeCard.properties };
    if (overColumnId === '_none') {
      delete newProperties[statusPropertyId];
    } else {
      newProperties[statusPropertyId] = overColumnId;
    }

    // Update all affected cards
    const updatedCards: Array<{ id: string; order: number; properties?: Record<string, string> }> = [];

    // Add the moved card
    updatedCards.push({
      id: activeCard.id,
      order: newOrder,
      properties: newProperties,
    });

    // Update orders of other cards in the column
    columnCards.forEach((card, index) => {
      if (card.id !== activeCard.id) {
        const adjustedOrder = index >= newOrder ? index + 1 : index;
        if (card.order !== adjustedOrder) {
          updatedCards.push({ id: card.id, order: adjustedOrder });
        }
      }
    });

    try {
      await reorderCards(updatedCards);
    } catch (error) {
      console.error('Failed to reorder cards:', error);
    }
  };

  const handleAddCard = async (columnId: string) => {
    const properties: Record<string, string> = {};
    if (columnId !== '_none') {
      properties[statusPropertyId] = columnId;
    }

    try {
      const card = await createCard({
        title: 'การ์ดใหม่',
        properties,
      });
      onCardClick(card);
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  const getCardColor = (card: Card): string => {
    const priorityProp = currentBoard?.properties.find(p =>
      p.name.includes('ความเร่งด่วน') || p.name.includes('Priority')
    );
    if (!priorityProp) return '';

    const priorityValue = card.properties[priorityProp.id];
    const option = priorityProp.options.find(o => o.id === priorityValue);
    return option?.color || '';
  };

  if (!statusProperty) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        ไม่พบ Property สถานะ
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
        {columns.map(column => {
          const columnCards = cardsByColumn.get(column.id) || [];

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 w-72"
            >
              <KanbanColumn
                id={column.id}
                title={column.title}
                color={column.color}
                count={columnCards.length}
              >
                <SortableContext
                  items={columnCards.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {columnCards.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        color={getCardColor(card)}
                        onClick={() => onCardClick(card)}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>

                <button
                  onClick={() => handleAddCard(column.id)}
                  className="w-full mt-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm border border-transparent hover:border-slate-600/50"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มการ์ด
                </button>
              </KanbanColumn>
            </motion.div>
          );
        })}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-3 opacity-90">
            <KanbanCard
              card={activeCard}
              color={getCardColor(activeCard)}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
