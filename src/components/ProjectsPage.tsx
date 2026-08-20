import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Film,
  Sparkles,
  Trash2,
  Download,
  Play,
  Clock,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { SavedProjectRecord, AppPage } from '../types';

interface ProjectsPageProps {
  onOpenNewMontage: () => void;
  onOpenNewCaption: () => void;
  onNavigate: (page: AppPage) => void;
}

const STORAGE_KEY = 'nexora_ai_saved_projects';

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onOpenNewMontage,
  onOpenNewCaption,
  onNavigate,
}) => {
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'montage' | 'caption'>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProjects(JSON.parse(saved));
      } else {
        // Initial sample projects so the dashboard is rich and informative
        const initialSample: SavedProjectRecord[] = [
          {
            id: 'sample_1',
            title: 'ريلز: قصص النجاح في الذكاء الاصطناعي',
            createdAt: 'منذ ساعتين',
            updatedAt: 'منذ ساعتين',
            type: 'caption',
            videoType: 'short',
            duration: 38,
            captionsCount: 24,
            status: 'completed',
          },
          {
            id: 'sample_2',
            title: 'مونتاج سينمائي: قصة أصحاب الكهف (12 مشهد)',
            createdAt: 'أمس',
            updatedAt: 'أمس',
            type: 'montage',
            videoType: 'short',
            duration: 52,
            pairsCount: 12,
            status: 'completed',
          },
          {
            id: 'sample_3',
            title: 'فيديو يوتيوب أفقي: مراجعة أفضل نماذج AI 2026',
            createdAt: 'منذ 3 أيام',
            updatedAt: 'منذ 3 أيام',
            type: 'caption',
            videoType: 'landscape',
            duration: 180,
            captionsCount: 110,
            status: 'completed',
          },
        ];
        setProjects(initialSample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSample));
      }
    } catch {
      // fallback
    }
  }, []);

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filterType === 'all' || p.type === filterType;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-950 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-blue-400" />
            <span>مشاريعي</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة كافة فيديوهات المونتاج الآلي وتفريغات الكابشن الذكية التي قمت بإنشائها.
          </p>
        </div>

        {/* Create new actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenNewMontage}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>مشروع مونتاج جديد</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewCaption}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#090D16] hover:bg-slate-900 text-blue-300 hover:text-white border border-blue-950 hover:border-blue-500/40 font-bold text-xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>تفريغ كابشن</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المشاريع..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#090D16] border border-blue-950 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              filterType === 'all'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
            }`}
          >
            جميع المشاريع ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('montage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
              filterType === 'montage'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>المونتاج الآلي</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('caption')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
              filterType === 'caption'
                ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                : 'bg-[#090D16] text-slate-400 hover:text-white border border-blue-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>استوديو الكابشن</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-[#090D16] border border-blue-950/80 hover:border-blue-500/40 transition flex flex-col justify-between gap-4 shadow-lg group"
            >
              <div className="space-y-3">
                {/* Status & Type Bar */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                      p.type === 'montage'
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {p.type === 'montage' ? <Film className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    <span>{p.type === 'montage' ? 'مونتاج آلي' : 'كابشن عربي'}</span>
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{p.duration} ثانية</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition leading-snug line-clamp-2">
                  {p.title}
                </h3>

                {/* Details */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    {p.videoType === 'short' ? '9:16 عمودي' : '16:9 أفقي'}
                  </span>
                  {p.captionsCount && (
                    <span>{p.captionsCount} جملة كابشن</span>
                  )}
                  {p.pairsCount && (
                    <span>{p.pairsCount} مشهد مركب</span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                <span className="text-[11px] text-slate-500">{p.createdAt}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (p.type === 'montage') {
                        onOpenNewMontage();
                      } else {
                        onOpenNewCaption();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>فتح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-1.5 rounded-xl bg-black hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-900/60 text-xs transition cursor-pointer"
                    title="حذف المشروع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-[#090D16] border border-dashed border-blue-950 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">لا توجد مشاريع مطابقة للبحث</h3>
            <p className="text-xs text-slate-400">
              ابدأ بإنشاء أول مشروع مونتاج أو تفريغ كابشن ذكي الآن.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewMontage}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-lg shadow-blue-600/30"
          >
            بدء مشروع جديد الآن
          </button>
        </div>
      )}
    </div>
  );
};
