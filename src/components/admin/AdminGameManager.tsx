import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GameDefinition, GameCategory } from '../../types';
import { GAME_AD_URL } from '../../utils/adLinks';
import {
  Gamepad2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Save,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Search,
} from 'lucide-react';

export const AdminGameManager: React.FC = () => {
  const {
    games,
    gameSettings,
    allGameHistory,
    adminUpdateGame,
    adminAddGame,
    adminDeleteGame,
    adminToggleGame,
    adminUpdateGameSettings,
    addToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingGame, setEditingGame] = useState<GameDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Global settings state
  const [winRewardInput, setWinRewardInput] = useState(gameSettings.defaultWinReward.toString());
  const [lossRewardInput, setLossRewardInput] = useState(gameSettings.defaultLossReward.toString());
  const [dailyLimitInput, setDailyLimitInput] = useState(gameSettings.dailyGameLimit.toString());
  const [miniDailyLimitInput, setMiniDailyLimitInput] = useState(
    (gameSettings.miniGameDailyLimit || 30).toString()
  );
  const [adLinkInput, setAdLinkInput] = useState(GAME_AD_URL);

  // New game form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<GameCategory>('arcade');
  const [formDesc, setFormDesc] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formIcon, setFormIcon] = useState('🎮');
  const [formThumb, setFormThumb] = useState('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80');
  const [formWinReward, setFormWinReward] = useState('2.00');
  const [formLossReward, setFormLossReward] = useState('1.00');
  const [formWinCondition, setFormWinCondition] = useState('Score 10+ points');
  const [formMinSeconds, setFormMinSeconds] = useState('8');

  // Filter games
  const filtered = games.filter((g) => {
    const matchCat = categoryFilter === 'all' || g.category === categoryFilter;
    const matchSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Suspicious rounds (rounds completed in < 6 seconds)
  const suspiciousRounds = allGameHistory.filter((h) => h.durationSeconds < 6);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(winRewardInput);
    const l = parseFloat(lossRewardInput);
    const limit = parseInt(dailyLimitInput, 10);
    const miniLimit = parseInt(miniDailyLimitInput, 10);

    if (isNaN(w) || isNaN(l) || isNaN(limit)) {
      addToast('Invalid Input', 'Please enter valid numerical values.', 'error');
      return;
    }

    adminUpdateGameSettings({
      defaultWinReward: w,
      defaultLossReward: l,
      dailyGameLimit: limit,
      miniGameDailyLimit: isNaN(miniLimit) ? 30 : miniLimit,
    });
  };

  const handleOpenEdit = (game: GameDefinition) => {
    setEditingGame(game);
    setFormName(game.name);
    setFormCategory(game.category);
    setFormDesc(game.description);
    setFormInstructions(game.instructions);
    setFormIcon(game.icon);
    setFormThumb(game.thumbnailUrl);
    setFormWinReward(game.winReward.toString());
    setFormLossReward(game.lossReward.toString());
    setFormWinCondition(game.winCondition);
    setFormMinSeconds(game.minPlaySeconds.toString());
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingGame(null);
    setFormName('');
    setFormCategory('arcade');
    setFormDesc('');
    setFormInstructions('');
    setFormIcon('🎮');
    setFormThumb('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80');
    setFormWinReward('2.00');
    setFormLossReward('1.00');
    setFormWinCondition('Score 10+ points');
    setFormMinSeconds('8');
    setIsCreating(true);
  };

  const handleSubmitGameForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Error', 'Game name is required.', 'error');
      return;
    }

    const newGame: GameDefinition = {
      id: editingGame ? editingGame.id : formName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: formName.trim(),
      category: formCategory,
      description: formDesc.trim() || 'Exciting interactive arcade challenge.',
      instructions: formInstructions.trim() || 'Follow on-screen controls to score points.',
      thumbnailUrl: formThumb.trim(),
      icon: formIcon.trim() || '🎮',
      winReward: parseFloat(formWinReward) || 2.0,
      lossReward: parseFloat(formLossReward) || 1.0,
      playCount: editingGame ? editingGame.playCount : 0,
      rating: editingGame ? editingGame.rating : 4.8,
      enabled: true,
      minPlaySeconds: parseInt(formMinSeconds, 10) || 8,
      winCondition: formWinCondition.trim() || 'Achieve objective before timer expires',
    };

    if (editingGame) {
      adminUpdateGame(newGame);
    } else {
      adminAddGame(newGame);
    }

    setEditingGame(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Game Zone &amp; Arcade Management
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage {games.length} online games, reward rates ($2.00 Win / $1.00 Loss), daily limits, and anti-cheat policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {/* Global Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Reward Rates Settings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Sliders className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Payout &amp; Limit Rules
            </h4>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Winning Reward ($)</label>
              <input
                type="number"
                step="0.5"
                value={winRewardInput}
                onChange={(e) => setWinRewardInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Losing / Consolation Reward ($)</label>
              <input
                type="number"
                step="0.5"
                value={lossRewardInput}
                onChange={(e) => setLossRewardInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Arcade Daily Limit</label>
              <input
                type="number"
                value={dailyLimitInput}
                onChange={(e) => setDailyLimitInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Mini Games Daily Limit</label>
              <input
                type="number"
                value={miniDailyLimitInput}
                onChange={(e) => setMiniDailyLimitInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Arcade Settings</span>
            </button>
          </form>
        </div>

        {/* Game Zone Sponsor URL Configuration */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <ExternalLink className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Game Zone Sponsor Link
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Active Sponsor Advertising URL</label>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-400 break-all">
                {adLinkInput}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Integrated across all 5 mandatory Game Zone placements: Homepage, Pre-Game Lobby, Between Sections, Game Result Screen, and Footer.
            </p>

            <a
              href={adLinkInput}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-bold"
            >
              <span>Test Sponsor Link in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Anti-Cheat & Suspicious Play Monitor */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Anti-Cheat Monitor
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Rounds Recorded:</span>
              <span className="text-white font-bold">{allGameHistory.length}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Rapid Exits (&lt;6s):</span>
              <span className={`font-bold ${suspiciousRounds.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {suspiciousRounds.length} flagged
              </span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Verification Gate:</span>
              <span className="text-emerald-400 font-bold">Active (min 5s required)</span>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
              Prevents users from repeatedly claiming instant loss bonuses by enforcing minimum play duration and server-side validation.
            </p>
          </div>
        </div>
      </div>

      {/* Edit / Create Game Form Modal */}
      {(isCreating || editingGame) && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-base font-bold text-white">
              {editingGame ? `Edit Game: ${editingGame.name}` : 'Add New Game to Arcade'}
            </h4>
            <button
              onClick={() => {
                setEditingGame(null);
                setIsCreating(false);
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitGameForm} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Game Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as GameCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="racing">Racing</option>
                <option value="cards">Cards</option>
                <option value="arcade">Arcade</option>
                <option value="puzzle">Puzzle &amp; Brain</option>
                <option value="sports">Sports &amp; Action</option>
                <option value="quick_arcade">Mini: Quick Arcade</option>
                <option value="brain_memory">Mini: Brain &amp; Memory</option>
                <option value="fun_casual">Mini: Fun &amp; Casual</option>
                <option value="skill_timing">Mini: Skill &amp; Timing</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Win Reward ($)</label>
              <input
                type="number"
                step="0.5"
                value={formWinReward}
                onChange={(e) => setFormWinReward(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Loss Reward ($)</label>
              <input
                type="number"
                step="0.5"
                value={formLossReward}
                onChange={(e) => setFormLossReward(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingGame(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {editingGame ? 'Save Changes' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Games Table & Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search games by name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
            >
              <option value="all">All Games ({games.length})</option>
              <option value="racing">Racing</option>
              <option value="cards">Cards</option>
              <option value="arcade">Arcade</option>
              <option value="puzzle">Puzzle</option>
              <option value="sports">Sports</option>
              <option value="quick_arcade">Mini: Quick Arcade</option>
              <option value="brain_memory">Mini: Brain &amp; Memory</option>
              <option value="fun_casual">Mini: Fun &amp; Casual</option>
              <option value="skill_timing">Mini: Skill &amp; Timing</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Game Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Win Reward</th>
                  <th className="px-4 py-3">Loss Reward</th>
                  <th className="px-4 py-3">Plays</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2 font-sans">
                      <span className="text-base">{g.icon}</span>
                      <span>{g.name}</span>
                    </td>
                    <td className="px-4 py-3 uppercase text-slate-400">
                      {g.category}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      ${g.winReward.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-400">
                      ${g.lossReward.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {g.playCount}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => adminToggleGame(g.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer border ${
                          g.enabled
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {g.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Edit Game"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => adminDeleteGame(g.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Game"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
