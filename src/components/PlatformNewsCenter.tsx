import React, { useEffect, useState } from 'react';
import { Newspaper, Pin, Search, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PlatformNewsCenter: React.FC = () => {
  const { language, t } = useApp();
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [readingArticle, setReadingArticle] = useState<any | null>(null);

  const loadNews = async () => {
    const params = new URLSearchParams({ category: selectedCat, search });
    const res = await fetch(`/api/news/articles?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories || []);
      setArticles(data.articles || []);
    }
  };

  useEffect(() => {
    loadNews();
  }, [selectedCat, search]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/25 border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
            <Newspaper className="w-4 h-4" />
            <span>Official Bilingual Announcements</span>
          </div>
          <h1 className="text-2xl font-black text-white">{t('news.title')}</h1>
          <p className="text-xs text-slate-400">{t('news.subtitle')}</p>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
            selectedCat === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300'
          }`}
        >
          {language === 'bn' ? 'সকল বিভাগ' : 'All Categories'}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              selectedCat === c.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            {language === 'bn' ? c.name_bn : c.name_en}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((art) => (
          <div
            key={art.id}
            className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${
              art.is_pinned
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold">
                  {language === 'bn' ? art.category_name_bn : art.category_name_en}
                </span>
                <div className="flex items-center gap-1.5">
                  {art.is_pinned === 1 && (
                    <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {art.is_featured === 1 && (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
              </div>
              <h3 className="text-base font-black text-white leading-snug">
                {language === 'bn' && art.title_bn ? art.title_bn : art.title_en}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {language === 'bn' && art.summary_bn ? art.summary_bn : art.summary_en}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-[10px] font-mono text-slate-500">{art.published_at.slice(0, 10)}</span>
              <button
                onClick={() => setReadingArticle(art)}
                className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
              >
                {language === 'bn' ? 'বিস্তারিত পড়ুন →' : 'Read Article →'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  {language === 'bn' ? readingArticle.category_name_bn : readingArticle.category_name_en} ·{' '}
                  {readingArticle.published_at.slice(0, 10)}
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  {language === 'bn' && readingArticle.title_bn ? readingArticle.title_bn : readingArticle.title_en}
                </h2>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {language === 'bn' && readingArticle.content_bn ? readingArticle.content_bn : readingArticle.content_en}
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800">
              Published by {readingArticle.author} · Audience: {readingArticle.target_tier}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
