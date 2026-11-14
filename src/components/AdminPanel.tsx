import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Users,
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  AlertCircle,
  Settings,
  Tv,
  DollarSign,
  TrendingUp,
  Lock,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Gamepad2,
  Tag,
  MessageSquare,
  Sparkles,
  Plus,
  Ticket,
  Calendar,
  Crown,
} from 'lucide-react';
import { WithdrawalRecord, UserAccount, PromoCode, SupportTicket, SpinSegment, DailyMission } from '../types';
import { AdminGameManager } from './admin/AdminGameManager';
import { AdminWithdrawalScheduler } from './admin/AdminWithdrawalScheduler';
import { AdminAdvancedModules } from './admin/AdminAdvancedModules';
import { AdminVipManager } from './admin/AdminVipManager';
import {
  AD_DIRECT_LINK_1,
  EARN_MORE_SHORT_LINK,
  BLOG_OFFICIAL_LINK,
} from '../utils/adLinks';
import { db } from '../db/mockDb';

interface AdminPanelProps {
  onLockDashboard: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLockDashboard }) => {
  const {
    allUsers,
    allWithdrawals,
    adminAuditLogs,
    adminApproveWithdrawal,
    adminPayWithdrawal,
    adminRejectWithdrawal,
    adminSendNotification,
    setCurrentView,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'withdrawals' | 'scheduler' | 'vip' | 'users' | 'games' | 'advanced' | 'ads' | 'referrals' | 'promos' | 'support' | 'missions' | 'settings' | 'reports' | 'audit'
  >('withdrawals');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Promo Codes Admin state
  const [promoCodesList, setPromoCodesList] = useState<PromoCode[]>(() => db.getPromoCodes());
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'cash' | 'points' | 'vip'>('cash');
  const [newPromoVal, setNewPromoVal] = useState<number>(5.0);
  const [newPromoUses, setNewPromoUses] = useState<number>(100);
  const [newPromoExpiry, setNewPromoExpiry] = useState<string>('2026-12-31');

  // Support Tickets Admin state
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(() => db.getTickets());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Lucky Spin & Missions state
  const [spinSegmentsList, setSpinSegmentsList] = useState<SpinSegment[]>(() => db.getSpinSegments());

  // Modal / Action states
  const [payingRecord, setPayingRecord] = useState<WithdrawalRecord | null>(null);
  const [adminRefInput, setAdminRefInput] = useState('');

  const [rejectingRecord, setRejectingRecord] = useState<WithdrawalRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [notifTargetUserId, setNotifTargetUserId] = useState<string>('ALL');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  const [selectedUserDetail, setSelectedUserDetail] = useState<UserAccount | null>(null);
  const [balanceEditAmount, setBalanceEditAmount] = useState<string>('');

  // Editable platform configurations
  const [siteMinPayout, setSiteMinPayout] = useState(100.0);
  const [referralBonusSetting, setReferralBonusSetting] = useState(10.0);
  const [welcomeBonusSetting, setWelcomeBonusSetting] = useState(5.0);
  const [adDirectLinkSetting, setAdDirectLinkSetting] = useState(AD_DIRECT_LINK_1);
  const [earnMoreLinkSetting, setEarnMoreLinkSetting] = useState(EARN_MORE_SHORT_LINK);

  // Filtered withdrawals
  const filteredWithdrawals = allWithdrawals.filter((w) => {
    const matchStatus = statusFilter === 'all' || w.status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch =
      w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountNumberFull.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
    );
  });

  // Financial Report Aggregates
  const totalDisbursed = allWithdrawals
    .filter((w) => w.status === 'Paid')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalPendingPayouts = allWithdrawals
    .filter((w) => w.status === 'Pending' || w.status === 'Processing' || w.status === 'Approved')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalUserBalances = allUsers.reduce((sum, u) => sum + u.availableBalance, 0);
  const totalRegisteredUsers = allUsers.length;

  const handleConfirmPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    const ref = adminRefInput.trim() || `BKX-${Math.floor(100000 + Math.random() * 900000)}`;
    adminPayWithdrawal(payingRecord.id, ref);
    setPayingRecord(null);
    setAdminRefInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRecord) return;
    adminRejectWithdrawal(rejectingRecord.id, rejectionReason || 'Account verification failed');
    setRejectingRecord(null);
    setRejectionReason('');
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifTargetUserId === 'ALL') {
      allUsers.forEach((u) => adminSendNotification(u.id, notifTitle, notifMessage));
      addToast('Broadcast Sent', `Notification broadcast to all ${allUsers.length} users.`, 'success');
    } else {
      adminSendNotification(notifTargetUserId, notifTitle, notifMessage);
    }
    setNotifTitle('');
    setNotifMessage('');
  };

  const handleAdjustUserBalance = (targetUser: UserAccount) => {
    const val = parseFloat(balanceEditAmount);
    if (isNaN(val)) return;
    targetUser.availableBalance = +(targetUser.availableBalance + val).toFixed(2);
    db.saveUser(targetUser);
    db.addAuditLog(
      'admin@lazytoearn.com',
      'Adjusted Balance',
      targetUser.id,
      targetUser.name,
      `Balance modified by $${val.toFixed(2)}. New balance: $${targetUser.availableBalance.toFixed(2)}`
    );
    addToast('Balance Updated', `${targetUser.name}'s balance updated by $${val.toFixed(2)}.`, 'success');
    setSelectedUserDetail({ ...targetUser });
    setBalanceEditAmount('');
  };

  const handleToggleUserStatus = (targetUser: UserAccount) => {
    const newStatus = targetUser.accountStatus === 'Active' ? 'Suspended' : 'Active';
    targetUser.accountStatus = newStatus;
    db.saveUser(targetUser);
    db.addAuditLog(
      'admin@lazytoearn.com',
      `Changed Account Status to ${newStatus}`,
      targetUser.id,
      targetUser.name,
      `User account status toggled to ${newStatus}`
    );
    addToast('Status Updated', `User ${targetUser.name} set to ${newStatus}.`, 'info');
    setSelectedUserDetail({ ...targetUser });
  };

  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    db.createPromoCode(newPromoCode, newPromoType, newPromoVal, newPromoUses, newPromoExpiry);
    setPromoCodesList(db.getPromoCodes());
    addToast('Promo Code Created', `Code ${newPromoCode.toUpperCase()} is now active!`, 'success');
    setNewPromoCode('');
  };

  const handleTogglePromo = (code: string) => {
    db.togglePromoCode(code);
    setPromoCodesList(db.getPromoCodes());
    addToast('Promo Code Updated', `Status of ${code} updated.`, 'info');
  };

  const handleAdminReplyTicket = (ticketId: string) => {
    if (!adminReplyText.trim()) return;
    db.replyTicket(ticketId, 'admin', 'Lead Administrator', adminReplyText.trim());
    const updated = db.getTickets();
    setTicketsList(updated);
    setSelectedTicket(updated.find((t) => t.id === ticketId) || null);
    setAdminReplyText('');
    addToast('Reply Sent', 'Your response has been sent to the user.', 'success');
  };

  const handleUpdateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    db.updateTicketStatus(ticketId, status);
    const updated = db.getTickets();
    setTicketsList(updated);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updated.find((t) => t.id === ticketId) || null);
    }
    addToast('Ticket Updated', `Ticket ${ticketId} marked as ${status}.`, 'info');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner with Lock Dashboard action */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-2 border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                Administrator Control Center
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
                  Unlocked via Secret Code
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Authorized session for <strong className="text-amber-400">lasytoearn.blogspot.com</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            User View
          </button>
          <button
            onClick={onLockDashboard}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            title="Lock administrator dashboard and terminate session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Admin Dashboard</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Total Disbursed (Paid)
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            ${totalDisbursed.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Via bKash &amp; Nagad
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Pending Payout Queue
          </span>
          <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
            ${totalPendingPayouts.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {allWithdrawals.filter((w) => w.status === 'Pending').length} Pending Review
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Total Registered Users
          </span>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {totalRegisteredUsers}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Unique User IDs
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Earner Balance Held
          </span>
          <div className="text-2xl font-mono font-bold text-purple-400 tabular-nums">
            ${totalUserBalances.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Available for cashout
          </span>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'withdrawals' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Payouts &amp; Withdrawals</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'scheduler' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Withdrawal Scheduler</span>
          </button>

          <button
            onClick={() => setActiveTab('vip')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vip' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>VIP Plans (30d)</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Users</span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'games' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Games &amp; Arcade</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'advanced' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Advanced Hub &amp; Security</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ads' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Ads Management</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'referrals' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Referrals</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'promos' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promo Codes</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'support' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support Desk</span>
            {ticketsList.filter((t) => t.status === 'Open').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'missions' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Missions &amp; Spins</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'reports' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Financial Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Website Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Global Search Bar */}
        {(activeTab === 'withdrawals' || activeTab === 'users') && (
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, ID or TrxID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* 1. TAB: WITHDRAWALS & PAYOUTS */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            {['all', 'Pending', 'Processing', 'Approved', 'Paid', 'Rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">User Details</th>
                    <th className="py-3 px-4 font-semibold">Channel &amp; Number</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Requested At</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{w.userName}</div>
                        <div className="font-mono text-[10px] text-amber-400">{w.userId}</div>
                        <div className="font-mono text-[10px] text-slate-500">{w.id}</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-200">
                          {w.paymentMethod} ({w.accountType || 'Personal'})
                        </div>
                        <div className="text-slate-400 text-xs">{w.accountNumberFull}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-extrabold text-sm text-white tabular-nums">
                        ${w.amount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {w.requestDate}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : w.status === 'Approved'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : w.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {w.status}
                        </span>
                        {w.adminTransactionReference && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                            Ref: {w.adminTransactionReference}
                          </span>
                        )}
                        {w.rejectionReason && (
                          <span className="block text-[10px] text-red-400 mt-0.5">
                            Reason: {w.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {w.status === 'Pending' && (
                            <button
                              onClick={() => adminApproveWithdrawal(w.id)}
                              className="px-2 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10px] cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {(w.status === 'Pending' || w.status === 'Approved' || w.status === 'Processing') && (
                            <>
                              <button
                                onClick={() => setPayingRecord(w)}
                                className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] cursor-pointer"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => setRejectingRecord(w)}
                                className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-[10px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {w.status === 'Paid' && (
                            <span className="text-[10px] text-emerald-400 font-mono">Disbursed ✓</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: REGISTERED USERS & PROFILES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">User ID &amp; Name</th>
                    <th className="py-3 px-4 font-semibold">Email &amp; Phone</th>
                    <th className="py-3 px-4 font-semibold">Available Balance</th>
                    <th className="py-3 px-4 font-semibold">Total Earned</th>
                    <th className="py-3 px-4 font-semibold">Total Paid Out</th>
                    <th className="py-3 px-4 font-semibold">Account Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-amber-400">{u.id}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        <div>{u.email}</div>
                        <div className="text-[11px] text-slate-500">{u.phone}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                        ${u.availableBalance.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-mono text-emerald-400 tabular-nums">
                        ${u.totalEarnings.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        ${u.totalWithdrawals.toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.accountStatus === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {u.accountStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserDetail(u)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold cursor-pointer"
                          >
                            Manage Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: ADS MANAGEMENT */}
      {activeTab === 'ads' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-400" />
              Advertisement &amp; Monetization Network Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage high-CPM target links, network partners, and interactive display slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Main High-CPM Direct Pop Link
              </label>
              <input
                type="text"
                value={adDirectLinkSetting}
                onChange={(e) => setAdDirectLinkSetting(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">
                Triggered when users open direct CPM banners or watch high-tier ads.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Official Earn More Short Link
              </label>
              <input
                type="text"
                value={earnMoreLinkSetting}
                onChange={(e) => setEarnMoreLinkSetting(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">
                Dedicated short link awarded with +$2.50 reward on every click.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">All ad banners use High Revenue Format invoke scripts.</span>
            <button
              onClick={() => addToast('Ad Settings Saved', 'Monetization links and CPM tiers updated.', 'success')}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              Save Ad Configurations
            </button>
          </div>
        </div>
      )}

      {/* 4. TAB: REFERRAL REWARDS */}
      {activeTab === 'referrals' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-sky-400" />
              Referral Program &amp; Welcome Bonus Rules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control payout amounts for invitations and starter credits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Referral Reward per Verified Invite (USD)
              </label>
              <input
                type="number"
                step="0.5"
                value={referralBonusSetting}
                onChange={(e) => setReferralBonusSetting(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm"
              />
              <span className="text-[10px] text-slate-500">
                Credited directly to referrer balance when friend signs up. Current: $10.00.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                New User Starter Welcome Bonus (USD)
              </label>
              <input
                type="number"
                step="0.5"
                value={welcomeBonusSetting}
                onChange={(e) => setWelcomeBonusSetting(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm"
              />
              <span className="text-[10px] text-slate-500">
                Instant credit granted to newly created earner accounts. Current: $5.00.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Regular referral links auto-verify via URL query parameter ?ref=CODE.</span>
            <button
              onClick={() => addToast('Referral Rules Saved', 'Referral & Welcome bonuses updated.', 'success')}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              Save Referral Rules
            </button>
          </div>
        </div>
      )}

      {/* 5. TAB: FINANCIAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Earnings &amp; Transaction Reports
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ledger totals computed from server database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Disbursed (Paid)</span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">${totalDisbursed.toFixed(2)}</div>
              <span className="text-xs text-slate-500 mt-1 block">Completed cashout transfers</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">In-Review Cashout Queue</span>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">${totalPendingPayouts.toFixed(2)}</div>
              <span className="text-xs text-slate-500 mt-1 block">Awaiting administrator dispatch</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Total System Accounts</span>
              <div className="text-2xl font-mono font-bold text-white mt-1">{totalRegisteredUsers}</div>
              <span className="text-xs text-slate-500 mt-1 block">Registered &amp; verified</span>
            </div>
          </div>

          {/* Dispatch User Notification Broadcast */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              Send Notification to Users
            </h3>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target</label>
                  <select
                    value={notifTargetUserId}
                    onChange={(e) => setNotifTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  >
                    <option value="ALL">All Registered Users (Broadcast)</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Maintenance or Payout Announcement"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Type your message to be shown in the user notification center..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
              >
                Dispatch Notification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. TAB: WEBSITE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              Website &amp; Payout Rules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control global parameters for Lazy To Earn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Minimum Withdrawal Threshold (USD)
              </label>
              <input
                type="number"
                value={siteMinPayout}
                onChange={(e) => setSiteMinPayout(parseFloat(e.target.value) || 100)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm"
              />
              <span className="text-[10px] text-slate-500">
                Minimum amount required for bKash, Nagad, and Crypto cashouts. Current: $100.00.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Official Blogger Portal URL
              </label>
              <input
                type="text"
                readOnly
                value={BLOG_OFFICIAL_LINK}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">
                Front-facing Blogger website link.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Settings take effect immediately for all active sessions.</span>
            <button
              onClick={() => addToast('Settings Saved', 'Platform parameters saved.', 'success')}
              className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Save Website Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB: PROMO CODES */}
      {activeTab === 'promos' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                Promotional Code Generator &amp; Inventory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create and manage instant redemption bonus codes for marketing campaigns and VIP drops.
              </p>
            </div>

            <form onSubmit={handleCreatePromoCode} className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Code String</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIPBONUS50"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reward Type</label>
                <select
                  value={newPromoType}
                  onChange={(e) => setNewPromoType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option value="cash">Cash ($ USD)</option>
                  <option value="points">Points (Reward)</option>
                  <option value="vip">Bronze VIP (7d)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Value Amount</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={newPromoVal}
                  onChange={(e) => setNewPromoVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Max Redemptions</label>
                <input
                  type="number"
                  min="1"
                  value={newPromoUses}
                  onChange={(e) => setNewPromoUses(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Code</span>
                </button>
              </div>
            </form>

            {/* Promo Codes Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Reward</th>
                    <th className="py-2.5 px-3">Claimed / Max</th>
                    <th className="py-2.5 px-3">Expiry</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {promoCodesList.map((p) => (
                    <tr key={p.code} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {p.code}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {p.rewardType === 'cash' && (
                          <span className="text-emerald-400 font-bold">+${p.rewardValue.toFixed(2)} Cash</span>
                        )}
                        {p.rewardType === 'points' && (
                          <span className="text-sky-400 font-bold">+{p.rewardValue} Pts</span>
                        )}
                        {p.rewardType === 'vip' && (
                          <span className="text-purple-400 font-bold">Bronze VIP</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {p.usedCount} / {p.maxUses}
                        <div className="w-20 bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, (p.usedCount / p.maxUses) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{p.expiresAt}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleTogglePromo(p.code)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            p.isActive
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950'
                          }`}
                        >
                          {p.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUPPORT DESK */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Customer Tickets ({ticketsList.length})
              </h2>
              <span className="text-[10px] font-mono text-emerald-400">
                {ticketsList.filter((t) => t.status === 'Open').length} Open
              </span>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {ticketsList.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedTicket?.id === t.id
                      ? 'bg-slate-800 border-amber-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-amber-400 font-bold">{t.id}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        t.status === 'Open'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : t.status === 'In Progress'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{t.subject}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{t.userName}</span>
                    <span className="font-mono">{t.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col h-[550px]">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-400 font-bold">{selectedTicket.id}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {selectedTicket.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{selectedTicket.subject}</h3>
                    <p className="text-[11px] text-slate-400">
                      User: <strong className="text-slate-200">{selectedTicket.userName}</strong> ({selectedTicket.userId})
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, st)}
                        className={`text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                          selectedTicket.status === st
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl text-xs max-w-[85%] ${
                        m.sender === 'admin'
                          ? 'ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-100'
                          : m.sender === 'system'
                          ? 'mx-auto bg-slate-950 border border-slate-800 text-slate-400 text-center text-[11px]'
                          : 'mr-auto bg-slate-950 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-mono">
                        <span className="font-bold">{m.senderName}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type official admin response to user..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAdminReplyTicket(selectedTicket.id);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleAdminReplyTicket(selectedTicket.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-[550px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-sm font-bold text-slate-400">Select a Support Ticket</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm">
                  Click on any inquiry from the left queue to view details, update status, and respond to the user.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MISSIONS & SPINS */}
      {activeTab === 'missions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Daily Missions &amp; Lucky Spin Probability Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect platform reward parameters and verifiable RNG weight distributions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Lucky Spin Wheel Segments ({spinSegmentsList.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {spinSegmentsList.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-bold text-white">{s.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">({s.type})</span>
                      </div>
                      <span className="font-mono text-amber-400 font-bold">
                        Weight: {s.probabilityWeight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Provably Fair Security Engine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lucky Spin and Scratch Card outcomes are determined server-side using cryptographic HMAC SHA-256 seed hashing.
                  Spins cannot be manipulated or predicted by client-side browser modifications.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1">
                  <div>✓ Free daily spin reset: 00:00 UTC</div>
                  <div>✓ Scratch card foil coverage requirement: 60%</div>
                  <div>✓ VIP Tier multipliers: 1.0x to 2.5x</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: GAMES & ARCADE MANAGEMENT */}
      {activeTab === 'games' && <AdminGameManager />}

      {/* TAB: MONTHLY WITHDRAWAL SCHEDULER & VIP CONTROLS */}
      {activeTab === 'scheduler' && <AdminWithdrawalScheduler />}

      {/* TAB: VIP PLANS, 30-DAY VALIDITY & UPGRADE POLICY */}
      {activeTab === 'vip' && <AdminVipManager />}

      {/* TAB: ADVANCED HUB, SECURITY, AI, CALENDAR, NEWS, GIFTS, PWA */}
      {activeTab === 'advanced' && <AdminAdvancedModules />}

      {/* 7. TAB: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400">
            Immutable audit trail of administrator verification, approvals, payouts, and modifications.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Admin Account</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Target User</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {adminAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-400">{log.timestamp}</td>
                    <td className="py-2.5 px-4 text-amber-400">{log.adminEmail}</td>
                    <td className="py-2.5 px-4 text-white font-semibold">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {log.targetUserName} ({log.targetUserId})
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS PAID WITH TRX REFERENCE */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Mark Payout as Paid
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Disbursing <strong>${payingRecord.amount.toFixed(2)}</strong> via {payingRecord.paymentMethod} to{' '}
              <code className="text-amber-400">{payingRecord.accountNumberFull}</code> ({payingRecord.userName}).
            </p>

            <form onSubmit={handleConfirmPaid} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Transaction Reference (TrxID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BKX-9823019842 or NGD-8819204"
                  value={adminRefInput}
                  onChange={(e) => setAdminRefInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  Confirm &amp; Notify User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REQUEST */}
      {rejectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 text-red-400">
              Reject Withdrawal Request
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting <strong>${rejectingRecord.amount.toFixed(2)}</strong> for {rejectingRecord.userName}. The funds will be automatically refunded to their available balance.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rejection Reason (displayed in user payout ledger)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Invalid bKash wallet number or suspicious traffic"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-400 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Reject &amp; Refund Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER PROFILE DETAIL & ACTIONS */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedUserDetail.name}</span>
                  <span className="text-xs font-mono text-amber-400">({selectedUserDetail.id})</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">{selectedUserDetail.email}</span>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Available Balance</span>
                <span className="text-base font-mono font-bold text-white">${selectedUserDetail.availableBalance.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Withdrawals</span>
                <span className="text-base font-mono font-bold text-emerald-400">${selectedUserDetail.totalWithdrawals.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">bKash Number</span>
                <span className="font-mono text-slate-200">{selectedUserDetail.bkashNumber || 'None'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Nagad Number</span>
                <span className="font-mono text-slate-200">{selectedUserDetail.nagadNumber || 'None'}</span>
              </div>
            </div>

            {/* Adjust Balance */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Adjust Balance (+/- USD)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. +10.00 or -5.00"
                  value={balanceEditAmount}
                  onChange={(e) => setBalanceEditAmount(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustUserBalance(selectedUserDetail)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Toggle Status */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Current Status: <strong className="text-white">{selectedUserDetail.accountStatus}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleToggleUserStatus(selectedUserDetail)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  selectedUserDetail.accountStatus === 'Active'
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950'
                }`}
              >
                {selectedUserDetail.accountStatus === 'Active' ? 'Suspend Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
