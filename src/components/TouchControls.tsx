import React, { useRef, useState, useEffect } from 'react';
import { WorldStation } from '../game/snowWorld.ts';
import { soundManager } from '../game/soundManager.ts';

interface TouchControlsProps {
  onMoveVectorChange: (vec: { x: number; y: number } | null) => void;
  onThrowSnowball: () => void;
  onInteract: () => void;
  nearbyStation: WorldStation | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveVectorChange,
  onThrowSnowball,
  onInteract,
  nearbyStation
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  const maxRadius = 45;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickBaseRef.current || activeTouchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        let clampedX = dx;
        let clampedY = dy;
        if (dist > maxRadius) {
          clampedX = (dx / dist) * maxRadius;
          clampedY = (dy / dist) * maxRadius;
        }

        setKnobPos({ x: clampedX, y: clampedY });
        onMoveVectorChange({
          x: clampedX / maxRadius,
          y: clampedY / maxRadius
        });
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMoveVectorChange(null);
        break;
      }
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-3 px-4 flex items-end justify-between pointer-events-none z-20 select-none">
      {/* Virtual Joystick (Left) */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-slate-950/60 backdrop-blur-sm border-2 border-cyan-500/40 flex items-center justify-center pointer-events-auto touch-none shadow-lg active:border-cyan-400"
      >
        <div
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`
          }}
          className={`w-12 h-12 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 shadow-md transition-transform duration-75 ${
            isDragging ? 'scale-110' : ''
          }`}
        />
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex flex-col items-end space-y-2 pointer-events-auto">
        {/* Interact / Station Button */}
        {nearbyStation && (
          <button
            onClick={() => {
              soundManager.play('select');
              onInteract();
            }}
            className="px-4 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-400/30 flex items-center space-x-1.5 active:scale-95 animate-bounce"
          >
            <span>{nearbyStation.icon}</span>
            <span>{nearbyStation.keyLabel}</span>
          </button>
        )}

        {/* Throw Snowball Button */}
        <button
          onClick={onThrowSnowball}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-white via-slate-100 to-cyan-100 border-2 border-cyan-400/60 shadow-xl flex flex-col items-center justify-center text-slate-900 active:scale-90 transition font-bold"
        >
          <span className="text-xl leading-none">❄️</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-700 font-extrabold mt-0.5">
            Throw
          </span>
        </button>
      </div>
    </div>
  );
};
