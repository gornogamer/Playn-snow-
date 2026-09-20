import React, { useState } from 'react';
import { SnowAngel } from '../types.ts';
import { soundManager } from '../game/soundManager.ts';
import { Sparkles, X } from 'lucide-react';

interface SnowAngelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteAngel: (angel: SnowAngel) => void;
}

export const SnowAngelModal: React.FC<SnowAngelModalProps> = ({
  isOpen,
  onClose,
  onCompleteAngel
}) => {
  const [flaps, setFlaps] = useState(0);
  const targetFlaps = 5;

  if (!isOpen) return null;

  const handleFlap = () => {
    soundManager.play('action-start');
    const next = flaps + 1;
    setFlaps(next);

    if (next >= targetFlaps) {
      soundManager.play('reward');
      const sparkles: { x: number; y: number; alpha: number; size: number }[] = [];
      for (let i = 0; i < 18; i++) {
        sparkles.push({
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          alpha: 0.6 + Math.random() * 0.4,
          size: 1.5 + Math.random() * 2.5
        });
      }

      const angel: SnowAngel = {
        id: 'angel-' + Date.now(),
        x: 200 + Math.floor(Math.random() * 80),
        y: 440 + Math.floor(Math.random() * 60),
        createdAt: Date.now(),
        flaps: next,
        sparkles
      };

      setTimeout(() => {
        onCompleteAngel(angel);
        onClose();
        setFlaps(0);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✨</span>
            <div>
              <h2 className="text-lg font-bold text-cyan-200">Powder Snow Angel</h2>
              <p className="text-xs text-slate-400">Flap your arms in the deep winter powder</p>
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

        <div className="p-6 space-y-6 text-center">
          {/* Visual snow angel preview */}
          <div className="relative h-44 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
            {/* Soft snow background */}
            <div className="absolute inset-0 bg-radial from-slate-800/40 to-transparent" />

            {/* Angel silhouette expanding with flaps */}
            <div
              style={{
                transform: `scale(${0.7 + (flaps / targetFlaps) * 0.4})`,
                opacity: 0.3 + (flaps / targetFlaps) * 0.7
              }}
              className="relative transition-all duration-300 flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-200/50 border border-cyan-300 mb-1" />
              <div className="flex items-center justify-center">
                <div className="w-14 h-8 rounded-full bg-cyan-200/40 border border-cyan-300 -mr-2 rotate-12" />
                <div className="w-8 h-12 bg-cyan-200/50 border border-cyan-300 z-10" />
                <div className="w-14 h-8 rounded-full bg-cyan-200/40 border border-cyan-300 -ml-2 -rotate-12" />
              </div>
            </div>

            {/* Floating glitter particles */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {Array.from({ length: flaps * 3 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-yellow-300 text-xs animate-ping"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`
                  }}
                >
                  ✦
                </span>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Carving Progress</span>
              <span className="text-cyan-300 font-bold">{flaps} / {targetFlaps} Flaps</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${(flaps / targetFlaps) * 100}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleFlap}
            disabled={flaps >= targetFlaps}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-white text-base shadow-lg shadow-cyan-900/40 transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span>{flaps >= targetFlaps ? 'Angel Carved!' : 'Flap Arms & Legs (Tap or Space)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
