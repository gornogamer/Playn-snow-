import React, { useEffect, useState } from 'react';
import { GameClient, GameSnapshot } from '@rarefriends/friendsdk/game';
import {
  COLLECTIBLE_METADATA,
  formatRf,
  SNOW_GAME_DEFINITION
} from '../game/snowGameDefinition.ts';
import { soundManager } from '../game/soundManager.ts';
import {
  Sparkles,
  X,
  Pickaxe,
  Info,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface FrostCrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: GameClient;
  onSnapshotUpdated?: (snapshot: GameSnapshot) => void;
}

export const FrostCrateModal: React.FC<FrostCrateModalProps> = ({
  isOpen,
  onClose,
  client,
  onSnapshotUpdated
}) => {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [digging, setDigging] = useState<boolean>(false);
  const [unboxedItem, setUnboxedItem] = useState<{
    outcomeId: number;
    name: string;
    reward: bigint;
  } | null>(null);
  const [showRulesTable, setShowRulesTable] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const snap = await client.read();
      setSnapshot(snap);
      onSnapshotUpdated?.(snap);
    } catch (e: any) {
      console.error('Failed to read client snapshot:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void refresh();
      setErrorMsg(null);
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const handleBuyShovel = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      const can = await client.canBuy(1n);
      if (!can) {
        setErrorMsg('Not enough RF balance or free reserve stake to purchase a Frost Shovel.');
        setLoading(false);
        return;
      }
      soundManager.play('purchase');
      await client.buy(1n);
      await refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to buy shovel');
    } finally {
      setLoading(false);
    }
  };

  const handleDigCrate = async () => {
    setErrorMsg(null);
    if (!snapshot || snapshot.consumables < 1n) {
      setErrorMsg('You need at least 1 Frost Shovel to excavate snowdrifts.');
      return;
    }

    try {
      setDigging(true);
      soundManager.play('anticipation');

      // 1. Play (consumes 1 shovel)
      const plays = await client.play(1n);
      if (plays.length === 0) {
        throw new Error('No play returned from client');
      }

      // Simulate anticipation delay
      await new Promise(r => setTimeout(r, 600));

      // 2. Settle the play
      const settled = await client.settle(plays[0].id);
      if (settled.outcomeId === null) {
        throw new Error('Play outcome unresolved');
      }

      const outcomeIndex = settled.outcomeId - 1;
      const outcome = SNOW_GAME_DEFINITION.outcomes[outcomeIndex];

      // Audio cue based on rarity
      if (settled.outcomeId === 1) {
        soundManager.play('reveal-common');
      } else if (settled.outcomeId <= 3) {
        soundManager.play('reveal-rare');
      } else {
        soundManager.play('reveal-legendary');
      }

      setUnboxedItem({
        outcomeId: settled.outcomeId,
        name: outcome.name,
        reward: outcome.reward
      });

      await refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to excavate crate');
    } finally {
      setDigging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📦</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-cyan-200">Frost Mystery Depot</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                  FriendSDK v0.1.2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Excavate ancient frosted snowdrifts for simulated $RAREFRIENDS collectibles
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

        {/* Scrollable Container */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Economy Balances Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Simulated RF</span>
              <div className="text-base font-extrabold text-amber-400 truncate">
                {snapshot ? formatRf(snapshot.rfBalance) : '...'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Frost Shovels</span>
              <div className="text-base font-extrabold text-cyan-400 truncate flex items-center space-x-1">
                <span>{snapshot ? snapshot.consumables.toString() : '0'}</span>
                <span className="text-xs text-slate-500">x</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Reserved Max Stake</span>
              <div className="text-base font-bold text-slate-200 truncate">
                {snapshot ? formatRf(snapshot.stake) : '...'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Free Reserve</span>
              <div className="text-base font-bold text-emerald-400 truncate">
                {snapshot ? formatRf(snapshot.freeStake) : '...'}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {/* Unboxed Item Spotlight Modal / Section */}
          {unboxedItem && (
            <div className="relative p-5 rounded-xl border border-cyan-500/60 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 text-center animate-scale-in">
              <button
                onClick={() => setUnboxedItem(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-4xl mb-2">
                {COLLECTIBLE_METADATA[unboxedItem.name]?.emoji || '🎁'}
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1">
                <span
                  style={{ color: COLLECTIBLE_METADATA[unboxedItem.name]?.color }}
                >
                  {COLLECTIBLE_METADATA[unboxedItem.name]?.rarity} Collectible Unlocked!
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{unboxedItem.name}</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto my-2">
                {COLLECTIBLE_METADATA[unboxedItem.name]?.description}
              </p>
              <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>Simulated Redeem Value: {formatRf(unboxedItem.reward)}</span>
              </div>
            </div>
          )}

          {/* Excavation Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 1: Buy Shovel */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-850/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Pickaxe className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-sm text-cyan-200">Equip Frost Shovel</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Cost: 1.00 RF. Enables 1 snowdrift excavation with guaranteed prize backing.
                </p>
              </div>
              <button
                onClick={handleBuyShovel}
                disabled={loading || digging}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 font-bold text-xs text-cyan-300 border border-cyan-500/40 transition active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>Buy 1 Frost Shovel (1.00 RF)</span>
              </button>
            </div>

            {/* Action 2: Dig into Snowdrifts */}
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 to-cyan-950/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <h4 className="font-bold text-sm text-cyan-200">Excavate Snowdrift</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Dig into powdered ice. Outcomes range from Pinecone Snowballs to the Golden Snow Crown (10 RF)!
                </p>
              </div>
              <button
                onClick={handleDigCrate}
                disabled={digging || loading || !snapshot || snapshot.consumables < 1n}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-xs text-white shadow-lg shadow-cyan-900/40 transition active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{digging ? 'Excavating Snowdrift...' : 'Excavate Snowdrift (Use 1 Shovel)'}</span>
              </button>
            </div>
          </div>

          {/* Chance Odds & Backing Rules Dropdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <button
              onClick={() => {
                soundManager.play('select');
                setShowRulesTable(!showRulesTable);
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Chance Table & Verified Backing (10,000 Bps)</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showRulesTable ? 'rotate-90' : ''}`}
              />
            </button>

            {showRulesTable && (
              <div className="p-4 border-t border-slate-800 space-y-3 text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="pb-2">Outcome</th>
                        <th className="pb-2">Rarity</th>
                        <th className="pb-2">Chance (bps)</th>
                        <th className="pb-2">Probability</th>
                        <th className="pb-2">Redeem Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {SNOW_GAME_DEFINITION.outcomes.map(item => {
                        const meta = COLLECTIBLE_METADATA[item.name];
                        return (
                          <tr key={item.name} className="hover:bg-slate-900/50">
                            <td className="py-2 flex items-center space-x-1.5 font-medium text-slate-200">
                              <span>{meta?.emoji}</span>
                              <span>{item.name}</span>
                            </td>
                            <td className="py-2">
                              <span style={{ color: meta?.color }} className="font-semibold">
                                {meta?.rarity}
                              </span>
                            </td>
                            <td className="py-2 text-slate-400">{item.chanceBps}</td>
                            <td className="py-2 text-cyan-300">
                              {(item.chanceBps / 100).toFixed(1)}%
                            </td>
                            <td className="py-2 font-bold text-amber-400">
                              {formatRf(item.reward)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 text-[11px] text-slate-400 space-y-1">
                  <p>
                    <span className="font-bold text-cyan-300">FriendSDK Rule:</span> Consumable purchases require sufficient free stake covering the maximum prize (10 RF). Every purchased shovel reserves 10 RF of backing.
                  </p>
                  <p>
                    Redemption has no expiry and is fully simulated in this prototype.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
