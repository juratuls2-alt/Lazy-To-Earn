import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SupportTicket } from '../types';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  PlusCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  User,
  Bot,
} from 'lucide-react';

export const LiveSupport: React.FC = () => {
  const { user, userTickets, createTicket, replyTicket } = useApp();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    userTickets[0]?.id || null
  );
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Payment & Withdrawal');
  const [priority, setPriority] = useState<SupportTicket['priority']>('Medium');
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const selectedTicket = userTickets.find((t) => t.id === selectedTicketId) || userTickets[0];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const t = createTicket(subject, category, message, priority);
    setSelectedTicketId(t.id);
    setSubject('');
    setMessage('');
    setNewTicketModal(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    replyTicket(selectedTicket.id, replyText);
    setReplyText('');
  };

  const faqs = [
    {
      q: 'How long do withdrawals take via bKash, Nagad, and Crypto?',
      a: 'Free Starter accounts are processed within 24 to 48 hours. Bronze and Silver VIPs receive payouts within 6-12 hours, while Gold and Platinum members benefit from instant processing within 1 hour.',
    },
    {
      q: 'Why does my game round require a minimum play time?',
      a: 'To guarantee genuine gameplay and anti-bot verification, eligible rounds must be played actively for at least 5 to 15 seconds depending on game complexity before rewards ($2.00 Win / $1.00 Loss) are certified.',
    },
    {
      q: 'How does the Daily Streak Multiplier work?',
      a: 'Logging in and watching your daily quota of rewarded ads levels up your streak multiplier from 1.0x up to 2.0x on Day 7. All ad earnings, daily bonuses, and mission payouts are multiplied by this active rate!',
    },
    {
      q: 'Can I redeem reward points for cash?',
      a: 'Yes! Navigate to the Wallet page and use the Points to Cash converter. 1,000 reward points = $1.00 withdrawable cash balance.',
    },
    {
      q: 'How do I refer friends to earn the $10.00 bonus?',
      a: 'Share your personal referral link from the Referral Center. When your friend registers and verifies their account, $10.00 is automatically credited to your balance.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>24/7 Member Desk</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Live Assistance</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Support Center &amp; Helpdesk 🎧
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Have questions regarding withdrawals, tournament leaderboards, or account settings? Submit a ticket below to chat directly with our customer support agents.
            </p>
          </div>

          <button
            onClick={() => setNewTicketModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-sky-500/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>OPEN NEW TICKET</span>
          </button>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Tickets List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Your Support Tickets ({userTickets.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {userTickets.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                No tickets opened yet. Click 'OPEN NEW TICKET' above if you need assistance.
              </div>
            ) : (
              userTickets.map((t) => {
                const isSelected = t.id === selectedTicket?.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-sky-400 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 text-[10px]">#{t.id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          t.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : t.status === 'In Progress'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{t.subject}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>{t.category}</span>
                      <span>{t.updatedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Ticket Conversation Thread */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
          {selectedTicket ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">#{selectedTicket.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedTicket.category}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedTicket.subject}</h3>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                    selectedTicket.status === 'Resolved'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}
                >
                  {selectedTicket.status}
                </span>
              </div>

              {/* Message History Thread */}
              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                {selectedTicket.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSystem = msg.sender === 'system';

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl text-xs space-y-1 ${
                        isUser
                          ? 'bg-slate-950 border border-slate-800 ml-8'
                          : isSystem
                          ? 'bg-slate-950/40 border border-slate-800/80 mr-8 text-slate-300'
                          : 'bg-gradient-to-r from-sky-950/40 to-slate-900 border border-sky-500/30 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold flex items-center gap-1.5 text-white">
                          {isUser ? (
                            <User className="w-3.5 h-3.5 text-amber-400" />
                          ) : isSystem ? (
                            <Bot className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          <span>{msg.senderName}</span>
                        </span>
                        <span className="text-slate-400 text-[10px]">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed mt-1 font-sans">{msg.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== 'Closed' && (
                <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message to support staff..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-sky-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-all disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs font-mono">
              Select a ticket on the left to review conversation history.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                <span>Create New Support Ticket</span>
              </h3>
              <button
                onClick={() => setNewTicketModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Ticket Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                >
                  <option value="Payment & Withdrawal">Payment &amp; Withdrawal</option>
                  <option value="Missions & Rewards">Missions &amp; Rewards</option>
                  <option value="Games & Tournaments">Games &amp; Tournaments</option>
                  <option value="Account Security">Account Security</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                >
                  <option value="Low">Low - General Question</option>
                  <option value="Medium">Medium - Standard Request</option>
                  <option value="High">High - Urgent Payment Issue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. bKash Withdrawal Verification Query"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue with transaction IDs, dates, or details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-white text-lg">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
