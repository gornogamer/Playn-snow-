import React, { useState } from 'react';
import { GameClient, GameSnapshot } from '@rarefriends/friendsdk/game';
import {
  COLLECTIBLE_METADATA,
  formatRf,
  SNOW_GAME_DEFINITION
} from '../game/snowGameDefinition.ts';
import { soundManager } from '../game/soundManager.ts';
import { X, Coins, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: GameSnapshot | null;
  client: GameClient;
  onSnapshotUpdated?: (snap: GameSnapshot) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  snapshot,
  client,
  onSnapshotUpdated
}) => {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<number | null>(null);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const inventory = snapshot?.inventory || [0n, 0n, 0n, 0n, 0n];

  const handleRedeem = async (outcomeId: number) => {
    try {
      setRedeeming(true);
      setRedeemSuccess(null);
      soundManager.play('reward');
      await client.redeem(outcomeId, 1n);
      const updated = await client.read();
      onSnapshotUpdated?.(updated);
      const outcome = SNOW_GAME_DEFINITION.outcomes[outcomeId - 1];
      setRedeemSuccess(`Successfully redeemed 1x ${outcome.name} for ${formatRf(outcome.reward)}!`);
    } catch (err: any) {
      console.error('Redeem failed:', err);
    } finally {
      setRedeeming(false);
    }
  };

  const selectedOutcome =
    selectedOutcomeId !== null
      ? SNOW_GAME_DEFINITION.outcomes[selectedOutcomeId - 1]
      : null;
  const selectedMeta = selectedOutcome ? COLLECTIBLE_METADATA[selectedOutcome.name] : null;
  const selectedCount =
    selectedOutcomeId !== null ? inventory[selectedOutcomeId - 1] : 0n;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-lg font-bold text-cyan-200">Winter Collectibles Satchel</h2>
              <p className="text-xs text-slate-400">
                Your excavated snow treasures, artifacts, and simulated RF redemptions
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {redeemSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between">
              <span>{redeemSuccess}</span>
              <button onClick={() => setRedeemSuccess(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Grid of Items */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SNOW_GAME_DEFINITION.outcomes.map((outcome, idx) => {
              const outcomeId = idx + 1;
              const meta = COLLECTIBLE_METADATA[outcome.name];
              const count = inventory[idx];
              const isSelected = selectedOutcomeId === outcomeId;

              return (
                <button
                  key={outcome.name}
                  onClick={() => {
                    soundManager.play('select');
                    setSelectedOutcomeId(outcomeId);
                    setRedeemSuccess(null);
                  }}
                  className={`relative p-3 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/50 shadow-md'
                      : 'border-slate-800 bg-slate-850 hover:bg-slate-800'
                  }`}
                >
                  {/* Badge count */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-cyan-300">
                    x{count.toString()}
                  </div>

                  <div className="text-3xl my-2">{meta?.emoji}</div>
                  <div className="w-full">
                    <div className="text-xs font-bold text-slate-100 truncate">{outcome.name}</div>
                    <div
                      style={{ color: meta?.color }}
                      className="text-[10px] font-semibold"
                    >
                      {meta?.rarity}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Item Detail */}
          {selectedOutcome && selectedMeta && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">{selectedMeta.emoji}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white">{selectedOutcome.name}</h4>
                      <span
                        style={{ color: selectedMeta.color }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold border border-current/30"
                      >
                        {selectedMeta.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedMeta.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Redeem Payout</span>
                  <div className="text-base font-extrabold text-amber-400">
                    {formatRf(selectedOutcome.reward)}
                  </div>
                </div>
              </div>

              {/* Redeem Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  You own: <span className="font-bold text-cyan-300">{selectedCount.toString()}x</span>
                </div>

                <button
                  onClick={() => selectedOutcomeId && handleRedeem(selectedOutcomeId)}
                  disabled={redeeming || selectedCount < 1n}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white transition active:scale-98 disabled:opacity-40 flex items-center space-x-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>
                    {redeeming
                      ? 'Redeeming...'
                      : `Redeem 1 for ${formatRf(selectedOutcome.reward)}`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Ledger note */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Simulated FriendSDK Ledger: Items can be kept in your satchel or redeemed for RF with no expiration.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
