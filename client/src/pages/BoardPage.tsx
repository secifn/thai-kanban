import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  LayoutGrid,
  Table,
  Calendar,
  Settings,
  Users,
  Loader2,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import KanbanBoard from '../components/KanbanBoard';
import TableView from '../components/TableView';
import CardEditor from '../components/CardEditor';
import type { Card } from '../types';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const {
    currentBoard,
    views,
    currentView,
    setCurrentView,
    fetchBoard,
    createView,
    isLoading
  } = useBoardStore();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showViewMenu, setShowViewMenu] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  const statusPropertyId = useMemo(() => {
    if (!currentBoard) return null;
    const statusProp = currentBoard.properties.find(p =>
      p.name.includes('สถานะ') ||
      p.name.includes('Status') ||
      p.type === 'select'
    );
    return statusProp?.id || null;
  }, [currentBoard]);

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  const handleCloseEditor = () => {
    setSelectedCard(null);
  };

  const handleCreateView = async (type: 'BOARD' | 'TABLE' | 'CALENDAR') => {
    const titles = {
      BOARD: 'มุมมอง Kanban',
      TABLE: 'มุมมองตาราง',
      CALENDAR: 'มุมมองปฏิทิน',
    };
    try {
      const view = await createView({ title: titles[type], type });
      setCurrentView(view);
      setShowViewMenu(false);
    } catch (error) {
      console.error('Failed to create view:', error);
    }
  };

  const getViewIcon = (type: string) => {
    switch (type) {
      case 'BOARD': return <LayoutGrid className="w-4 h-4" />;
      case 'TABLE': return <Table className="w-4 h-4" />;
      case 'CALENDAR': return <Calendar className="w-4 h-4" />;
      default: return <LayoutGrid className="w-4 h-4" />;
    }
  };

  if (isLoading || !currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left side */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentBoard.icon}</span>
                <h1 className="text-lg font-semibold text-white truncate max-w-xs">
                  {currentBoard.title}
                </h1>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <Users className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 pb-2 -mb-px overflow-x-auto">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${currentView?.id === view.id
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }
                `}
              >
                {getViewIcon(view.type)}
                {view.title}
              </button>
            ))}

            {/* Add view button */}
            <div className="relative">
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {showViewMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-10"
                  >
                    <button
                      onClick={() => handleCreateView('BOARD')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      มุมมอง Kanban
                    </button>
                    <button
                      onClick={() => handleCreateView('TABLE')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      <Table className="w-4 h-4" />
                      มุมมองตาราง
                    </button>
                    <button
                      onClick={() => handleCreateView('CALENDAR')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      <Calendar className="w-4 h-4" />
                      มุมมองปฏิทิน
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 sm:p-6">
        {currentView?.type === 'TABLE' ? (
          <TableView onCardClick={handleCardClick} />
        ) : currentView?.type === 'CALENDAR' ? (
          <div className="text-center py-20 text-slate-400">
            มุมมองปฏิทินกำลังพัฒนา
          </div>
        ) : statusPropertyId ? (
          <KanbanBoard
            statusPropertyId={statusPropertyId}
            onCardClick={handleCardClick}
          />
        ) : (
          <div className="text-center py-20 text-slate-400">
            กรุณาเพิ่ม Property ประเภท "select" เพื่อใช้เป็นสถานะของการ์ด
          </div>
        )}
      </main>

      {/* Card Editor Sidebar */}
      <AnimatePresence>
        {selectedCard && (
          <CardEditor
            card={selectedCard}
            onClose={handleCloseEditor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
