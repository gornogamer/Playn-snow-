import React, { useState } from 'react';
import { PlacedSnowman, SnowmanDecoration } from '../types.ts';
import { soundManager } from '../game/soundManager.ts';
import { Sparkles, X, Check, RefreshCw } from 'lucide-react';

interface SnowmanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceSnowman: (snowman: PlacedSnowman) => void;
}

const HATS: { id: SnowmanDecoration['hat']; label: string; icon: string }[] = [
  { id: 'santa_hat', label: 'Santa Hat', icon: '🎅' },
  { id: 'tophat', label: 'Top Hat', icon: '🎩' },
  { id: 'beanie', label: 'Beanie', icon: '🧶' },
  { id: 'crown', label: 'Snow Crown', icon: '👑' },
  { id: 'none', label: 'None', icon: '❄️' }
];

const SCARVES = [
  { color: '#EF4444', name: 'Santa Red' },
  { color: '#38BDF8', name: 'Glacier Blue' },
  { color: '#10B981', name: 'Pine Green' },
  { color: '#F59E0B', name: 'Amber Glow' },
  { color: '#A855F7', name: 'Aurora Violet' },
  { color: '#FFFFFF', name: 'Snow White' }
];

const BUTTON_STYLES: { id: SnowmanDecoration['buttons']; label: string }[] = [
  { id: 'gold', label: 'Gold Buckle / Buttons' },
  { id: 'candy_cane', label: 'Candy Canes' },
  { id: 'charcoal', label: 'Black Charcoal' },
  { id: 'berries', label: 'Red Holly Berries' },
  { id: 'none', label: 'No Buttons' }
];

export const SnowmanBuilderModal: React.FC<SnowmanBuilderModalProps> = ({
  isOpen,
  onClose,
  onPlaceSnowman
}) => {
  const [step, setStep] = useState<'rolling' | 'decorating'>('rolling');
  const [rolledTiers, setRolledTiers] = useState<{ base: number; torso: number; head: number }>({
    base: 34,
    torso: 26,
    head: 18
  });

  const [decoration, setDecoration] = useState<SnowmanDecoration>({
    hat: 'santa_hat',
    scarfColor: '#EF4444',
    hasCarrot: true,
    hasTwigArms: true,
    beard: 'white_beard',
    suit: 'santa_suit',
    buttons: 'gold',
    name: 'Santa Frosty'
  });

  if (!isOpen) return null;

  const handleApplySantaPreset = () => {
    soundManager.playHoHoHo();
    setDecoration({
      hat: 'santa_hat',
      scarfColor: '#EF4444',
      hasCarrot: true,
      hasTwigArms: true,
      beard: 'white_beard',
      suit: 'santa_suit',
      buttons: 'gold',
      name: 'Santa Claus'
    });
    setRolledTiers({
      base: 38,
      torso: 28,
      head: 18
    });
  };

  const handleRollSnow = () => {
    soundManager.play('action-start');
    setRolledTiers(prev => ({
      base: Math.min(42, prev.base + 2),
      torso: Math.min(30, prev.torso + 1.5),
      head: Math.min(22, prev.head + 1)
    }));
  };

  const handleFinish = () => {
    soundManager.play('reward');
    const newSnowman: PlacedSnowman = {
      ...decoration,
      id: 'snowman-' + Date.now(),
      x: 680 + Math.floor(Math.random() * 120),
      y: 200 + Math.floor(Math.random() * 90),
      baseRadius: rolledTiers.base,
      torsoRadius: rolledTiers.torso,
      headRadius: rolledTiers.head,
      completedAt: Date.now()
    };
    onPlaceSnowman(newSnowman);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⛄</span>
            <div>
              <h2 className="text-lg font-bold text-cyan-200">Snowman Sculpting Yard</h2>
              <p className="text-xs text-slate-400">Roll fresh snowdrifts & craft custom winter sculptures</p>
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

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => {
                soundManager.play('select');
                setStep('rolling');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
                step === 'rolling'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. Roll Snow Spheres
            </button>
            <button
              onClick={() => {
                soundManager.play('select');
                setStep('decorating');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
                step === 'decorating'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. Decorate & Name
            </button>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="relative flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-b from-slate-950 to-slate-850 border border-slate-800/80 min-h-[190px]">
            {/* Soft snow bank */}
            <div className="absolute bottom-2 w-48 h-8 rounded-full bg-slate-800/60 blur-xs" />

            {/* Render stacked snowman balls */}
            <div className="relative flex flex-col items-center">
              {/* Head */}
              <div
                style={{
                  width: `${rolledTiers.head * 2}px`,
                  height: `${rolledTiers.head * 2}px`,
                  marginBottom: `-${rolledTiers.head * 0.3}px`
                }}
                className="relative z-30 rounded-full bg-gradient-to-tr from-slate-200 to-white shadow-md border border-slate-300 flex items-center justify-center"
              >
                {/* Face preview */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 left-[28%] top-[38%]" />
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 right-[28%] top-[38%]" />
                  {decoration.hasCarrot && (
                    <div className="absolute w-3 h-1.5 bg-orange-500 rounded-r-full left-[48%] top-[50%]" />
                  )}
                </div>
                {/* Hat preview */}
                {decoration.hat === 'santa_hat' && (
                  <div className="absolute -top-6 w-8 h-8 z-40">
                    <div className="w-8 h-5 bg-red-600 rounded-t-full relative">
                      <div className="absolute -top-2 right-0 w-3 h-3 rounded-full bg-white shadow" />
                    </div>
                    <div className="w-9 h-2 bg-white rounded-full -mt-0.5 -ml-0.5 shadow" />
                  </div>
                )}
                {decoration.hat === 'tophat' && (
                  <div className="absolute -top-4 w-7 h-5 bg-slate-900 rounded-t border-b-2 border-red-500 shadow" />
                )}
                {decoration.hat === 'crown' && (
                  <div className="absolute -top-4 text-xs">👑</div>
                )}
                {decoration.hat === 'beanie' && (
                  <div
                    style={{ backgroundColor: decoration.scarfColor }}
                    className="absolute -top-3 w-6 h-4 rounded-t-full"
                  >
                    <div className="absolute -top-1 left-2 w-2 h-2 rounded-full bg-white" />
                  </div>
                )}

                {/* Santa Beard Preview */}
                {decoration.beard === 'white_beard' && (
                  <div className="absolute -bottom-3 z-35 w-8 h-6 bg-white rounded-b-2xl border-t border-slate-200 shadow-sm flex flex-col items-center justify-end pb-0.5">
                    <div className="w-5 h-1 bg-slate-100 rounded-full" />
                  </div>
                )}
              </div>

              {/* Scarf */}
              <div
                style={{ backgroundColor: decoration.scarfColor }}
                className="relative z-40 w-12 h-2 rounded-full -my-1 shadow"
              />

              {/* Torso */}
              <div
                style={{
                  width: `${rolledTiers.torso * 2}px`,
                  height: `${rolledTiers.torso * 2}px`,
                  marginBottom: `-${rolledTiers.torso * 0.3}px`
                }}
                className={`relative z-20 rounded-full shadow-md border flex items-center justify-center ${
                  decoration.suit === 'santa_suit'
                    ? 'bg-gradient-to-tr from-red-600 to-red-500 border-red-700'
                    : 'bg-gradient-to-tr from-slate-200 to-white border-slate-300'
                }`}
              >
                {/* Santa Belt on Torso */}
                {decoration.suit === 'santa_suit' ? (
                  <div className="w-full h-3 bg-slate-950 flex items-center justify-center relative">
                    <div className="w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-xs flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-950" />
                    </div>
                  </div>
                ) : (
                  decoration.buttons !== 'none' && (
                    <div className="flex flex-col space-y-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          decoration.buttons === 'berries'
                            ? 'bg-red-500'
                            : decoration.buttons === 'gold'
                            ? 'bg-amber-400'
                            : decoration.buttons === 'candy_cane'
                            ? 'bg-red-600 border border-white'
                            : 'bg-slate-900'
                        }`}
                      />
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          decoration.buttons === 'berries'
                            ? 'bg-red-500'
                            : decoration.buttons === 'gold'
                            ? 'bg-amber-400'
                            : decoration.buttons === 'candy_cane'
                            ? 'bg-red-600 border border-white'
                            : 'bg-slate-900'
                        }`}
                      />
                    </div>
                  )
                )}
              </div>

              {/* Base */}
              <div
                style={{
                  width: `${rolledTiers.base * 2}px`,
                  height: `${rolledTiers.base * 2}px`
                }}
                className="relative z-10 rounded-full bg-gradient-to-tr from-slate-200 to-white shadow-lg border border-slate-300"
              />
            </div>

            <div className="mt-4 text-center">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                {decoration.name}
              </span>
            </div>
          </div>

          {/* Step 1: Rolling controls */}
          {step === 'rolling' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Click to roll and pack more snow onto your 3 tiers:
              </p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400">Head Tier</span>
                  <div className="text-base font-bold text-cyan-400">{rolledTiers.head}px</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400">Torso Tier</span>
                  <div className="text-base font-bold text-cyan-400">{rolledTiers.torso}px</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400">Base Tier</span>
                  <div className="text-base font-bold text-cyan-400">{rolledTiers.base}px</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRollSnow}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white transition active:scale-95 shadow-md shadow-cyan-900/40"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Roll Snow (+Pack Size)</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.play('select');
                    setStep('decorating');
                  }}
                  className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-cyan-300 border border-cyan-500/30 transition"
                >
                  Next: Decorate &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Decorating controls */}
          {step === 'decorating' && (
            <div className="space-y-4 text-xs">
              {/* Santa Preset Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-950/70 via-red-900/50 to-slate-900 border border-red-500/40">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">🎅</span>
                  <div>
                    <div className="text-sm font-bold text-red-200">Make a Santa Claus!</div>
                    <div className="text-xs text-red-300/80">Auto-equip Santa hat, fluffy beard, red suit & gold belt</div>
                  </div>
                </div>
                <button
                  onClick={handleApplySantaPreset}
                  className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950 transition active:scale-95 flex items-center space-x-1"
                >
                  <span>Apply Santa</span>
                  <span>✨</span>
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Snowman Name:</label>
                <input
                  type="text"
                  value={decoration.name}
                  onChange={e => setDecoration({ ...decoration, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
                  maxLength={25}
                />
              </div>

              {/* Hat selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Headwear:</label>
                <div className="grid grid-cols-5 gap-2">
                  {HATS.map(h => (
                    <button
                      key={h.id}
                      onClick={() => {
                        soundManager.play('select');
                        setDecoration({ ...decoration, hat: h.id });
                      }}
                      className={`p-2 rounded-lg border text-center transition ${
                        decoration.hat === h.id
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200'
                          : 'border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-base">{h.icon}</div>
                      <div className="truncate font-medium mt-1">{h.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Santa Beard & Suit Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundManager.play('select');
                    setDecoration({
                      ...decoration,
                      beard: decoration.beard === 'white_beard' ? 'none' : 'white_beard'
                    });
                  }}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                    decoration.beard === 'white_beard'
                      ? 'border-red-400 bg-red-950/40 text-red-200 font-semibold'
                      : 'border-slate-800 bg-slate-850 text-slate-400'
                  }`}
                >
                  <span>🎅 Fluffy Santa Beard</span>
                  {decoration.beard === 'white_beard' && <Check className="w-4 h-4 text-red-400" />}
                </button>

                <button
                  onClick={() => {
                    soundManager.play('select');
                    setDecoration({
                      ...decoration,
                      suit: decoration.suit === 'santa_suit' ? 'classic' : 'santa_suit'
                    });
                  }}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                    decoration.suit === 'santa_suit'
                      ? 'border-red-400 bg-red-950/40 text-red-200 font-semibold'
                      : 'border-slate-800 bg-slate-850 text-slate-400'
                  }`}
                >
                  <span>🧣 Red Coat & Gold Belt</span>
                  {decoration.suit === 'santa_suit' && <Check className="w-4 h-4 text-red-400" />}
                </button>
              </div>

              {/* Scarf Color */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Scarf Wool Color:</label>
                <div className="flex space-x-2">
                  {SCARVES.map(s => (
                    <button
                      key={s.color}
                      onClick={() => {
                        soundManager.play('select');
                        setDecoration({ ...decoration, scarfColor: s.color });
                      }}
                      style={{ backgroundColor: s.color }}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        decoration.scarfColor === s.color
                          ? 'border-white scale-110 shadow'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={s.name}
                    />
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    soundManager.play('select');
                    setDecoration({ ...decoration, hasCarrot: !decoration.hasCarrot });
                  }}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                    decoration.hasCarrot
                      ? 'border-orange-500 bg-orange-950/40 text-orange-200'
                      : 'border-slate-800 bg-slate-850 text-slate-400'
                  }`}
                >
                  <span>🥕 Carrot Nose</span>
                  {decoration.hasCarrot && <Check className="w-4 h-4 text-orange-400" />}
                </button>

                <button
                  onClick={() => {
                    soundManager.play('select');
                    setDecoration({ ...decoration, hasTwigArms: !decoration.hasTwigArms });
                  }}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                    decoration.hasTwigArms
                      ? 'border-amber-600 bg-amber-950/40 text-amber-200'
                      : 'border-slate-800 bg-slate-850 text-slate-400'
                  }`}
                >
                  <span>🌿 Twig Arms</span>
                  {decoration.hasTwigArms && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              </div>

              {/* Buttons */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Torso Buttons:</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUTTON_STYLES.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        soundManager.play('select');
                        setDecoration({ ...decoration, buttons: b.id });
                      }}
                      className={`p-2 rounded-lg border text-left transition ${
                        decoration.buttons === b.id
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200'
                          : 'border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-white shadow-lg shadow-cyan-900/40 transition active:scale-98 flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Place Snowman in Yard</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
