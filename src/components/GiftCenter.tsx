import React, { useEffect, useState } from 'react';
import { Gift, Send, Sparkles, ShieldCheck, Crown, Package } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

export const GiftCenter: React.FC = () => {
  const { user, language, t, deductGiftPoints, addToast } = useApp();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const loadGifts = async () => {
    if (!user) return;
    const res = await fetch(`/api/gifts/catalog?userId=${encodeURIComponent(user.id)}`);
    if (res.ok) {
      const data = await res.json();
      setCatalog(data.catalog || []);
      setReceived(data.received || []);
      setSent(data.sent || []);
      const others = (data.recipients || []).filter((r: any) => r.user_id !== user.id);
      setRecipients(others);
      if (others.length > 0 && !recipientId) setRecipientId(others[0].user_id);
    }
  };

  useEffect(() => {
    loadGifts();
  }, [user?.id]);

  if (!user) return null;

  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGift || !recipientId) return;
    if ((user.points || 0) < selectedGift.points_cost) {
      addToast('Not Enough Points', `Requires ${selectedGift.points_cost} non-cash points.`, 'error');
      return;
    }

    const target = recipients.find((r) => r.user_id === recipientId);
    setSending(true);
    try {
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: selectedGift.id,
          senderUserId: user.id,
          senderName: user.name,
          senderVipTier: user.vipTier || 'Free',
          recipientUserId: recipientId,
          recipientName: target?.display_name || 'Member',
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('Gift Transfer Blocked', data.error || 'Could not send gift.', 'error');
        return;
      }

      deductGiftPoints(selectedGift.points_cost, selectedGift.name);
      confetti({ particleCount: 55, spread: 60 });
      addToast(
        'Collectible Gift Delivered!',
        `Sent ${selectedGift.name} to ${target?.display_name || recipientId}.`,
        'bonus'
      );
      setSelectedGift(null);
      setNote('');
      await loadGifts();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase">
            <Gift className="w-4 h-4" />
            <span>Non-Cash Digital Collectibles</span>
          </div>
          <h1 className="text-2xl font-black text-white">{t('gifts.title')}</h1>
          <p className="text-xs text-slate-400">{t('gifts.subtitle')}</p>
        </div>
        <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Your Gift Points</span>
          <span className="text-lg font-black font-mono text-amber-400">{user.points || 0} pts</span>
        </div>
      </div>

      {/* Compliance Guard Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs text-slate-300 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Compliance Policy:</strong> Gift Center items are strictly non-cash digital collectibles (frames, badges, avatars, themes). Withdrawable cash balances cannot be transferred between users, and collectibles cannot be converted to cash.
        </span>
      </div>

      {/* Gift Store Catalog */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((g) => (
          <div
            key={g.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <img src={g.image_url} alt={g.name} className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 p-1" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-black text-white">{language === 'bn' && g.name_bn ? g.name_bn : g.name}</h3>
                  {g.vip_only === 1 && <Crown className="w-3.5 h-3.5 text-purple-400" />}
                  {g.is_seasonal === 1 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      SEASONAL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{language === 'bn' && g.description_bn ? g.description_bn : g.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="font-mono font-black text-amber-400 text-xs">{g.points_cost} pts</span>
              <button
                onClick={() => setSelectedGift(g)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Send Collectible</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Received & Sent Collectibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>My Received Gift Collection ({received.length})</span>
          </h3>
          {received.length === 0 ? (
            <p className="text-xs text-slate-400">No digital gifts received yet.</p>
          ) : (
            <div className="space-y-2">
              {received.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs">
                  <img src={item.image_url} alt={item.gift_name} className="w-10 h-10 rounded-xl" />
                  <div className="flex-1">
                    <div className="font-bold text-white">{language === 'bn' && item.gift_name_bn ? item.gift_name_bn : item.gift_name}</div>
                    <div className="text-[10px] text-slate-400">
                      From <strong className="text-amber-300">{item.sender_name}</strong> {item.note ? `— "${item.note}"` : ''}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{item.sent_at.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Sent Gift History ({sent.length})</span>
          </h3>
          {sent.length === 0 ? (
            <p className="text-xs text-slate-400">You haven&apos;t sent any collectibles yet.</p>
          ) : (
            <div className="space-y-2">
              {sent.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs">
                  <img src={item.image_url} alt={item.gift_name} className="w-10 h-10 rounded-xl" />
                  <div className="flex-1">
                    <div className="font-bold text-white">{item.gift_name}</div>
                    <div className="text-[10px] text-slate-400">To {item.recipient_name}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{item.sent_at.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Gift Modal */}
      {selectedGift && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleSendGift}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4"
          >
            <h3 className="text-base font-black text-white">Send {selectedGift.name}</h3>
            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-bold block">Select Recipient Member</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                {recipients.map((r) => (
                  <option key={r.user_id} value={r.user_id}>
                    {r.display_name} (@{r.username}) — {r.vip_tier}
                  </option>
                ))}
              </select>

              <label className="text-slate-400 font-bold block pt-2">Optional Note</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Congratulations on the tournament!"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGift(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                {sending ? 'Sending...' : `Confirm (${selectedGift.points_cost} pts)`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
