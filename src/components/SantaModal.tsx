import React, { useState } from 'react';
import { SantaState } from '../types.ts';
import { soundManager } from '../game/soundManager.ts';
import { Sparkles, X, Gift, Check, Flame, Award, PlaneTakeoff, Heart } from 'lucide-react';

interface SantaModalProps {
  isOpen: boolean;
  onClose: () => void;
  santaState: SantaState;
  onToggleSantaHat: () => void;
  onToggleMagicSnowballs: () => void;
  onOpenSnowmanBuilder: () => void;
  onReceiveHolidayGift: () => void;
  onLaunchSleigh: () => void;
  simulatedBalance?: string;
}

export const SantaModal: React.FC<SantaModalProps> = ({
  isOpen,
  onClose,
  santaState,
  onToggleSantaHat,
  onToggleMagicSnowballs,
  onOpenSnowmanBuilder,
  onReceiveHolidayGift,
  onLaunchSleigh,
  simulatedBalance = '100.00'
}) => {
  const [giftClaimedAnim, setGiftClaimedAnim] = useState(false);

  if (!isOpen) return null;

  const handleClaimGift = () => {
    soundManager.playHoHoHo();
    soundManager.playJingleBells();
    setGiftClaimedAnim(true);
    onReceiveHolidayGift();
    setTimeout(() => {
      setGiftClaimedAnim(false);
    }, 2500);
  };

  const handleSleighFly = () => {
    soundManager.playJingleBells();
    onLaunchSleigh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border-2 border-red-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl text-slate-100">
        {/* Festive Header */}
        <div className="relative flex items-center justify-between border-b border-red-500/30 bg-gradient-to-r from-red-950/90 via-red-900/60 to-slate-950 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-red-600/30 border border-red-400/50 shadow-inner text-2xl">
              🎅
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Santa's Holiday Sleigh & Grotto</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Vibeathon Guest
                </span>
              </div>
              <p className="text-xs text-red-200/80">Warm greetings & festive gifts directly from the North Pole!</p>
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Santa Speech Bubble */}
          <div className="relative p-4 rounded-xl bg-gradient-to-r from-red-950/60 to-slate-850 border border-red-500/30 flex items-start space-x-3">
            <span className="text-3xl select-none">🎄</span>
            <div className="space-y-1">
              <div className="text-sm font-bold text-amber-300 flex items-center space-x-2">
                <span>"Ho Ho Ho! Welcome, Rare Friend!"</span>
                <button
                  onClick={() => soundManager.playHoHoHo()}
                  className="text-xs text-red-300 hover:text-white underline"
                  title="Hear Santa laugh"
                >
                  (Hear Ho-Ho-Ho 🔊)
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "The powder snow in this valley is magnificent! I've parked my gift sleigh right here in the center meadow.
                Take a festive coat, sculpt a Santa snowman with me, or grab a holiday gift bag!"
              </p>
            </div>
          </div>

          {/* Interactive Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Dress as Santa */}
            <div className="p-4 rounded-xl bg-slate-850/90 border border-slate-700/80 hover:border-red-500/50 transition flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">🎅</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    santaState.santaHatEquipped
                      ? 'bg-red-500/30 text-red-300 border border-red-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {santaState.santaHatEquipped ? 'Equipped' : 'Standard'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100 mt-2">Santa Hat & Coat</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Equip a floppy red Santa hat with white fur trim and cozy red winter coat on your Rare Friend.
                </p>
              </div>
              <button
                onClick={() => {
                  soundManager.play('select');
                  onToggleSantaHat();
                }}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                  santaState.santaHatEquipped
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{santaState.santaHatEquipped ? 'Remove Santa Suit' : 'Wear Santa Suit'}</span>
              </button>
            </div>

            {/* 2. Magic Snowballs */}
            <div className="p-4 rounded-xl bg-slate-850/90 border border-slate-700/80 hover:border-amber-500/50 transition flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">✨</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    santaState.magicSnowballs
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {santaState.magicSnowballs ? 'Active' : 'Regular Snow'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100 mt-2">Santa's Magic Snowballs</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enchant your snowball throws with golden starlight trails and celestial bell chimes!
                </p>
              </div>
              <button
                onClick={() => {
                  soundManager.play('action-ready');
                  onToggleMagicSnowballs();
                }}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                  santaState.magicSnowballs
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{santaState.magicSnowballs ? 'Disable Magic Stars' : 'Enable Magic Snowballs'}</span>
              </button>
            </div>

            {/* 3. Sculpt Santa Snowman */}
            <div className="p-4 rounded-xl bg-slate-850/90 border border-slate-700/80 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">⛄</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 border border-cyan-400/40">
                    Yard Sculptor
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100 mt-2">Sculpt Santa Snowman</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Launch the 3-tier Snowman Builder pre-loaded with Santa hat, snowy beard, and red coat!
                </p>
              </div>
              <button
                onClick={() => {
                  soundManager.play('select');
                  onClose();
                  onOpenSnowmanBuilder();
                }}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white transition flex items-center justify-center space-x-1.5"
              >
                <span>Open Santa Sculptor</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* 4. Sleigh Flyby */}
            <div className="p-4 rounded-xl bg-slate-850/90 border border-slate-700/80 hover:border-purple-500/50 transition flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">🛷</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40">
                    Sky Aurora
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100 mt-2">Fly Reindeer Sleigh</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Launch Santa's sleigh across the aurora twilight sky with jingle bells and golden star showers!
                </p>
              </div>
              <button
                onClick={handleSleighFly}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-xs text-white transition flex items-center justify-center space-x-1.5 shadow"
              >
                <PlaneTakeoff className="w-3.5 h-3.5" />
                <span>Launch Sleigh Flyby</span>
              </button>
            </div>
          </div>

          {/* 5. Santa's Holiday Gift Box Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-slate-900 border border-red-500/50 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-red-500/30 border border-red-400/40 flex items-center justify-center text-2xl shadow">
                  🎁
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Santa's Holiday Gift Pack</h4>
                  <p className="text-xs text-red-200/90">
                    Contains +10.00 simulated RF holiday bonus, Gingerbread Friend & Peppermint items!
                  </p>
                  <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                    Gifts opened: {santaState.giftsOpened} | Balance: {simulatedBalance} RF
                  </p>
                </div>
              </div>
              <button
                onClick={handleClaimGift}
                disabled={giftClaimedAnim}
                className={`py-2.5 px-5 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 whitespace-nowrap ${
                  giftClaimedAnim
                    ? 'bg-green-600 text-white animate-bounce'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-900/40 active:scale-95'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>{giftClaimedAnim ? 'Opened! 🎉 (+10 RF)' : 'Claim Santa Gift (+10 RF)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>Rare Friends Vibeathon Winter Wonderland</span>
          <button
            onClick={() => {
              soundManager.play('select');
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Back to Snowfield
          </button>
        </div>
      </div>
    </div>
  );
};
