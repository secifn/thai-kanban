import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  LayoutGrid, 
  LogOut, 
  Upload, 
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  FolderOpen,
  Sparkles,
  Users,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { importApi } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { boards, fetchBoards, createBoard, deleteBoard, isLoading } = useBoardStore();
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardIcon, setNewBoardIcon] = useState('📋');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const board = await createBoard({ title: newBoardTitle, icon: newBoardIcon });
      setShowNewBoardModal(false);
      setNewBoardTitle('');
      setNewBoardIcon('📋');
      navigate(`/board/${board.id}`);
    } catch {
      // Error handled in store
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress('กำลังอัพโหลดไฟล์...');

    try {
      const result = await importApi.importArchive(file);
      setImportProgress(`นำเข้าสำเร็จ! ${result.cardsImported} การ์ด, ${result.viewsImported} มุมมอง`);
      await fetchBoards();
      setTimeout(() => {
        setShowImportModal(false);
        setIsImporting(false);
        setImportProgress('');
        navigate(`/board/${result.boardId}`);
      }, 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setImportProgress(err.response?.data?.error || 'เกิดข้อผิดพลาดในการนำเข้า');
      setIsImporting(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบอร์ดนี้?')) {
      await deleteBoard(boardId);
      setMenuOpen(null);
    }
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const icons = ['📋', '🎯', '🚀', '💡', '📊', '🎨', '📝', '⭐', '🔥', '💪', '🌟', '🎉'];

  return (
    <div className="min-h-screen relative">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <LayoutGrid className="w-5 h-5 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Thai Kanban
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-slate-400 hidden sm:flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                <span className="text-slate-300 font-medium">{user?.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            สวัสดี, {user?.name} 👋
          </h2>
          <p className="text-slate-400">จัดการงานและโปรเจคของคุณได้อย่างมีประสิทธิภาพ</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">{boards.length}</p>
            <p className="text-sm text-slate-400">บอร์ดทั้งหมด</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">1</p>
            <p className="text-sm text-slate-400">สมาชิกทีม</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {boards.reduce((acc, b) => acc + (b._count?.cards || 0), 0)}
            </p>
            <p className="text-sm text-slate-400">การ์ดทั้งหมด</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
              <LayoutGrid className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-sm text-slate-400">มุมมอง</p>
          </div>
        </motion.div>

        {/* Actions bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบอร์ด..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 hover:text-white transition-all"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">นำเข้า</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNewBoardModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">สร้างบอร์ดใหม่</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Boards grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
        ) : filteredBoards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {searchQuery ? 'ไม่พบบอร์ดที่ค้นหา' : 'ยังไม่มีบอร์ด'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'สร้างบอร์ดแรกของคุณเพื่อเริ่มต้นใช้งาน'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewBoardModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                สร้างบอร์ดใหม่
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredBoards.map((board, index) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <Link
                    to={`/board/${board.id}`}
                    className="block bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-indigo-500/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">{board.icon || '📋'}</span>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setMenuOpen(menuOpen === board.id ? null : board.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpen === board.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
                            >
                              <Edit2 className="w-4 h-4" />
                              แก้ไข
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteBoard(board.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                      {board.title}
                    </h3>
                    
                    {board.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                        {board.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700/50">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {board._count?.cards || 0} การ์ด
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {board.members?.length || 1} สมาชิก
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* New Board Modal */}
      <AnimatePresence>
        {showNewBoardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewBoardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                สร้างบอร์ดใหม่
              </h2>
              
              <form onSubmit={handleCreateBoard}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    เลือกไอคอน
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewBoardIcon(icon)}
                        className={`w-11 h-11 text-xl flex items-center justify-center rounded-xl transition-all ${
                          newBoardIcon === icon
                            ? 'bg-indigo-500/30 ring-2 ring-indigo-500'
                            : 'bg-slate-700/50 hover:bg-slate-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ชื่อบอร์ด
                  </label>
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="เช่น โปรเจคทีม, งานส่วนตัว"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewBoardModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
                  >
                    สร้างบอร์ด
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isImporting && setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                นำเข้าจาก Focalboard
              </h2>
              <p className="text-slate-400 mb-6">เลือกไฟล์ .boardarchive ที่ Export จาก Focalboard</p>
              
              {isImporting ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                  <p className="text-slate-300">{importProgress}</p>
                </div>
              ) : (
                <>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-500/5 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-slate-300 font-medium mb-1">คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-sm text-slate-500">หรือลากไฟล์มาวางที่นี่</p>
                    </div>
                    <input
                      type="file"
                      accept=".boardarchive"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="w-full mt-4 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
