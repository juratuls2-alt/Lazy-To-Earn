import React, { useState } from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { Coins, LogIn, UserPlus, Menu, X, ExternalLink, Shield, Globe } from 'lucide-react';
import { BLOG_OFFICIAL_LINK } from '../../utils/adLinks';

export const PublicNavbar: React.FC = () => {
  const { currentView, setCurrentView, isAuthenticated, user, logout, language, setLanguage } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: Array<{ id: AppView; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'how_it_works', label: 'How It Works' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact Us' },
  ];

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <Coins className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
              Lazy To Earn
            </span>
            <span className="block text-[10px] font-mono text-amber-400/90 -mt-0.5">
              https://lasytoearn.blogspot.com
            </span>
          </div>
        </button>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentView === item.id
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
          <a
            href={BLOG_OFFICIAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
          >
            <span>Blog</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => void setLanguage(language === 'en' ? 'bn' : 'en')}
            title="Switch Language (English / বাংলা)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/80"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'EN' : 'বাংলা'}</span>
          </button>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView(user.role === 'admin' ? 'admin' : 'dashboard')}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Coins className="w-3.5 h-3.5" />}
                <span>{user.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}</span>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                <span>Login</span>
              </button>
              <button
                onClick={() => setCurrentView('signup')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-3 space-y-2 text-xs">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-amber-400"
            >
              {item.label}
            </button>
          ))}
          <a
            href={BLOG_OFFICIAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2 px-3 rounded-lg text-amber-400 hover:bg-slate-900"
          >
            <span>Official Blogger Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </header>
  );
};
