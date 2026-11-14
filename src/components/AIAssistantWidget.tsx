import React, { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, Trash2, Sparkles, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  language: string;
  message: string;
  created_at: string;
}

export const AIAssistantWidget: React.FC = () => {
  const { user, isAuthenticated, language, t, addToast } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [usage, setUsage] = useState({ usedToday: 0, dailyLimit: 30, isEnabled: true });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/ai/history/${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUsage({
          usedToday: data.usedToday || 0,
          dailyLimit: data.dailyLimit || 30,
          isEnabled: data.isEnabled !== false,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open && user) loadHistory();
  }, [open, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  if (!isAuthenticated || !user) return null;

  const suggestedPrompts =
    language === 'bn'
      ? [
          'আমি কবে টাকা উত্তোলন করতে পারবো?',
          'মাসিক রিওয়ার্ড ক্যালেন্ডার কীভাবে কাজ করে?',
          'ভিআইপি ক্লাবহাউসের সুবিধা কী কী?',
        ]
      : [
          'When can I withdraw my earnings?',
          'How does the Monthly Reward Calendar work?',
          'What perks are included in VIP Clubhouse?',
        ];

  const sendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!content || typing) return;
    if (!textToSend) setInput('');

    const optimisticMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      language,
      message: content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTyping(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: content,
          language,
          userContext: {
            name: user.name,
            vipTier: user.vipTier,
            availableBalance: user.availableBalance,
            points: user.points,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Assistant Limit', data.error || 'Unable to process query.', 'error');
        return;
      }
      if (data.reply) {
        setMessages((prev) => [...prev, data.reply]);
      }
      setUsage((prev) => ({
        ...prev,
        usedToday: data.usedToday ?? prev.usedToday + 1,
        dailyLimit: data.dailyLimit ?? prev.dailyLimit,
      }));
    } catch {
      addToast('Connection Error', 'AI Assistant could not reach server.', 'error');
    } finally {
      setTyping(false);
    }
  };

  const clearHistory = async () => {
    await fetch(`/api/ai/history/${encodeURIComponent(user.id)}`, { method: 'DELETE' });
    setMessages([]);
    addToast('Conversation Cleared', 'Assistant chat history cleared.', 'info');
  };

  return (
    <>
      {/* Floating Assistant Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 xl:bottom-6 right-5 z-50 w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 shadow-2xl shadow-amber-500/25 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
        aria-label="Open AI Personal Assistant"
        title={t('ai.title')}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat Drawer */}
      {open && (
        <div className="fixed bottom-36 xl:bottom-22 right-4 sm:right-5 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[75vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{t('ai.title')}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    EN / বাংলা
                  </span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {usage.usedToday}/{usage.dailyLimit} daily queries
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'হ্যালো! আমি কীভাবে সাহায্য করতে পারি?' : 'Hello! How can I help today?'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {language === 'bn'
                      ? 'আপনি ইংরেজি বা বাংলায় মিশন, ক্যালেন্ডার, ভিআইপি বা উত্তোলন সম্পর্কে প্রশ্ন করতে পারেন।'
                      : 'Ask me in English or Bangla about missions, games, reward calendar, VIP benefits, or withdrawal dates.'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(p)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[11px] animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Security Notice + Input */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Read-only guidance — never alters balances or accesses private user data.</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!usage.isEnabled}
                placeholder={t('ai.placeholder')}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-400 outline-none"
              />
              <button
                type="submit"
                disabled={!usage.isEnabled || typing || !input.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
