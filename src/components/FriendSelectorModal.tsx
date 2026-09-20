import React, { useState } from 'react';
import { PRESET_FRIENDS } from '../game/snowGameDefinition.ts';
import { soundManager } from '../game/soundManager.ts';
import { X, Check, Wallet, Shield, Sparkles } from 'lucide-react';

interface FriendSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFriendId: bigint;
  onSelectFriendId: (id: bigint) => void;
  connectedAccount: string | null;
  onConnectWallet: () => void;
}

export const FriendSelectorModal: React.FC<FriendSelectorModalProps> = ({
  isOpen,
  onClose,
  currentFriendId,
  onSelectFriendId,
  connectedAccount,
  onConnectWallet
}) => {
  const [customIdInput, setCustomIdInput] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (id: bigint) => {
    soundManager.play('select');
    onSelectFriendId(id);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customIdInput.trim(), 10);
    if (!isNaN(val) && val > 0) {
      soundManager.play('select');
      onSelectFriendId(BigInt(val));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-lg font-bold text-cyan-200">Select Rare Friend Identity</h2>
              <p className="text-xs text-slate-400">
                Robinhood Chain (Chain 4663) Generations NFT Identity
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.play('select');
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Wallet connection status bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {connectedAccount
                    ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`
                    : 'Simulated Preview Identity'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {connectedAccount ? 'Connected on Chain 4663' : 'Browser Sandbox Simulation'}
                </div>
              </div>
            </div>

            {!connectedAccount ? (
              <button
                onClick={onConnectWallet}
                className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition"
              >
                Connect Wallet
              </button>
            ) : (
              <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Preset Friends Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Canonical Rare Friends Presets:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_FRIENDS.map(f => {
                const isSelected = f.id === currentFriendId;
                return (
                  <button
                    key={f.id.toString()}
                    onClick={() => handleSelectPreset(f.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-sm'
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: f.hatColor }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-900 font-black text-xs shrink-0 mt-0.5"
                    >
                      #{f.id.toString()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{f.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-[11px] text-cyan-300 font-medium">{f.tagline}</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{f.bio}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom ID Input */}
          <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Custom Token ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                placeholder="e.g. 77"
                value={customIdInput}
                onChange={e => setCustomIdInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/30 transition"
              >
                Load Friend
              </button>
            </div>
          </form>

          {/* Verification Notice */}
          <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Per FriendSDK guidelines, prototypes verify Generation &ge; 1 ownership via read-only contracts. In preview mode, all Gen-1 sprite assets are dynamically decoded from the canonical manifest.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
