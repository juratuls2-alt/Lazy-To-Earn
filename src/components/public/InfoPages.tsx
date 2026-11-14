import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HelpCircle,
  FileText,
  Shield,
  Send,
  Mail,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BLOG_OFFICIAL_LINK } from '../../utils/adLinks';
import { AdBanner } from '../AdBanner';

export const AboutUsPage: React.FC = () => {
  const { setCurrentView } = useApp();
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">About Lazy To Earn</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Lazy To Earn is the official external user authentication and financial rewards platform powering <a href={BLOG_OFFICIAL_LINK} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">https://lasytoearn.blogspot.com</a>.
        </p>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Because standard Blogger setups cannot securely process encrypted passwords, private user balances, and direct mobile financial service payouts, this dedicated backend provides enterprise-grade data isolation, automated multiplier streaks, and real-time bKash &amp; Nagad withdrawal processing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white text-xs">Our Mission</h4>
            <p className="text-xs text-slate-400 mt-1">
              Provide sustainable daily ad-revenue sharing to global micro-earners.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white text-xs">Zero Compromise</h4>
            <p className="text-xs text-slate-400 mt-1">
              Guaranteed individual data isolation: user A never sees user B's records.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-white text-xs">Direct Payouts</h4>
            <p className="text-xs text-slate-400 mt-1">
              Zero fee withdrawals via bKash, Nagad, and USDT TRC20 once you hit $100.
            </p>
          </div>
        </div>
      </div>
      <AdBanner slot="leaderboard_728x90" label="Sponsor Banner" showBonusAction />
    </div>
  );
};

export const HowItWorksPage: React.FC = () => {
  const { setCurrentView } = useApp();
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How It Works</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Understanding the Lazy To Earn monetization model from signup to payout.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0">1</span>
            <div>
              <h3 className="font-bold text-white text-sm">Register with Your Unique User ID</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each registrant gets an individual User ID (e.g. LTE-782910) and personal dashboard. All your earnings, referrals, and payouts belong strictly to you.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">2</span>
            <div>
              <h3 className="font-bold text-white text-sm">Watch Sponsored Ads &amp; Maintain Streaks</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                View 10–15s CPM partner ads or click our verified Earn More short links. Every consecutive day increases your multiplier up to 2.0x!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold shrink-0">3</span>
            <div>
              <h3 className="font-bold text-white text-sm">Earn $10.00 Per Valid Referral</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Share your personal referral link. When friends sign up and verify their account, you earn $10.00 cash directly into your available balance.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0">4</span>
            <div>
              <h3 className="font-bold text-white text-sm">Cash Out with $100.00 Minimum Payout</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit your withdrawal to bKash or Nagad. Our administrator verifies your traffic and disburses funds within 1 to 3 hours with a tracking reference ID.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('signup')}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
        >
          Get Started Now
        </button>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum payout threshold is strictly $100.00. This ensures all transaction fees are fully absorbed by our advertising partners, meaning you receive 100% of your earnings with 0% fee.',
    },
    {
      q: 'Which payment methods are supported?',
      a: 'We support Bangladeshi Mobile Financial Services (bKash Personal/Agent, Nagad Personal/Agent) and international Crypto wallets (USDT TRC20, Binance Pay ID).',
    },
    {
      q: 'How does the referral system work?',
      a: 'For every friend who registers using your regular referral link, you receive a $10.00 cash bonus directly into your balance. Your invited friend also receives a $5.00 starter bonus.',
    },
    {
      q: 'Is my account and payout history private?',
      a: 'Yes, 100%. User A only sees User A’s payout history; User B only sees User B’s records. No other user can ever view your payment numbers, balances, or transaction receipts.',
    },
    {
      q: 'How does the Daily Streak bonus work?',
      a: 'Watching ads consecutively increases your earnings multiplier from 1.0x on Day 1 up to 2.0x on Day 7, doubling your earnings on every ad task.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Everything you need to know about Lazy To Earn.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 transition-colors">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isOpen && <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ContactUsPage: React.FC = () => {
  const { addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast('Message Sent', 'Our support team will reply within 24 hours.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Contact Support</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Questions about your account or withdrawals? We are here to help.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Thank You for Contacting Us</h3>
            <p className="text-xs text-slate-300">
              Your inquiry has been received. You will hear back at {email} within 24 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
        <h1 className="text-2xl font-extrabold text-white">Terms and Conditions</h1>
        <p>Last updated: November 2026</p>
        <h3 className="font-bold text-white text-sm pt-2">1. User Accounts</h3>
        <p>Each user is permitted one account only. Automated click bots, VPN farming, and duplicate registrations are strictly prohibited.</p>
        <h3 className="font-bold text-white text-sm pt-2">2. Withdrawals</h3>
        <p>The minimum withdrawal threshold is $100.00. Requests are subject to manual administrator review before disbursement to bKash or Nagad.</p>
        <h3 className="font-bold text-white text-sm pt-2">3. Referral Rewards</h3>
        <p>Referral bonuses of $10.00 require genuine verified user signups. Fake or self-referral attempts result in permanent suspension.</p>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
        <h1 className="text-2xl font-extrabold text-white">Privacy Policy</h1>
        <p>Last updated: November 2026</p>
        <h3 className="font-bold text-white text-sm pt-2">1. Personal Information Protection</h3>
        <p>Lazy To Earn encrypts user records and never sells or discloses your phone numbers, wallet addresses, or payout history to third parties.</p>
        <h3 className="font-bold text-white text-sm pt-2">2. Strict User Isolation</h3>
        <p>Under our zero-leak policy, all payout ledgers and account balances are visible solely to the authenticated account owner and authorized administrators.</p>
      </div>
    </div>
  );
};
