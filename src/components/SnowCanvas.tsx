import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityMode,
  Direction,
  Footprint,
  ParticleBurst,
  PlacedSnowman,
  Position,
  SnowAngel,
  SnowballProjectile,
  Snowflake,
  SnowTarget,
  SantaState
} from '../types.ts';
import { drawFriend, FriendSpriteData, loadFriendSprite } from '../game/spriteRenderer.ts';
import {
  createInitialTargets,
  isWalkable,
  STATIONS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  WorldStation
} from '../game/snowWorld.ts';
import { soundManager } from '../game/soundManager.ts';

interface SnowCanvasProps {
  friendId: bigint;
  currentMode: ActivityMode;
  onOpenStation: (stationId: string) => void;
  paused: boolean;
  reducedMotion: boolean;
  placedSnowmen: PlacedSnowman[];
  snowAngels: SnowAngel[];
  rollingBallRadius: number;
  isRollingSnowball: boolean;
  onTargetHit: (target: SnowTarget) => void;
  onSnowAngelFlap?: () => void;
  onThrowSnowballTrigger?: () => void;
  onNearbyStationChange: (station: WorldStation | null) => void;
  externalMoveVector?: { x: number; y: number } | null;
  externalThrowTrigger?: number;
  santaState?: SantaState;
  onFlySleighComplete?: () => void;
}

export const SnowCanvas: React.FC<SnowCanvasProps> = ({
  friendId,
  currentMode,
  onOpenStation,
  paused,
  reducedMotion,
  placedSnowmen,
  snowAngels,
  rollingBallRadius,
  isRollingSnowball,
  onTargetHit,
  onSnowAngelFlap,
  onNearbyStationChange,
  externalMoveVector,
  externalThrowTrigger,
  santaState,
  onFlySleighComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player position state
  const playerPos = useRef<Position>({ x: 480, y: 360 });
  const playerFacing = useRef<Direction>('down');
  const isWalking = useRef<boolean>(false);
  const targetMovePos = useRef<Position | null>(null);

  // Keyboard keys
  const keysPressed = useRef<Set<string>>(new Set());

  // Visual state
  const spriteData = useRef<FriendSpriteData | null>(null);
  const snowflakes = useRef<Snowflake[]>([]);
  const footprints = useRef<Footprint[]>([]);
  const snowballs = useRef<SnowballProjectile[]>([]);
  const particles = useRef<ParticleBurst[]>([]);
  const targets = useRef<SnowTarget[]>(createInitialTargets());
  const lastFootprintTime = useRef<number>(0);
  const footSide = useRef<boolean>(false);
  const prevThrowTrigger = useRef<number>(0);
  const flyingSleighX = useRef<number | null>(null);

  useEffect(() => {
    if (santaState?.sleighFlying && flyingSleighX.current === null) {
      flyingSleighX.current = -120;
    }
  }, [santaState?.sleighFlying]);

  const [nearbyStation, setNearbyStation] = useState<WorldStation | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);

  // Initialize Snowflakes
  useEffect(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 90; i++) {
      flakes.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: 1 + Math.random() * 2.8,
        speed: 0.8 + Math.random() * 1.8,
        drift: -0.5 + Math.random() * 1.0,
        swaySpeed: 0.01 + Math.random() * 0.02,
        swayOffset: Math.random() * Math.PI * 2
      });
    }
    snowflakes.current = flakes;
  }, []);

  // Load Friend sprite
  useEffect(() => {
    let cancelled = false;
    setSpriteLoaded(false);
    loadFriendSprite(friendId).then(data => {
      if (!cancelled) {
        spriteData.current = data;
        setSpriteLoaded(true);
      }
    }).catch(err => {
      console.error('Failed to load Friend sprite:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [friendId]);

  // Handle Throw Snowball action
  const throwSnowball = (targetX?: number, targetY?: number) => {
    soundManager.unlock();
    soundManager.play('action-start');

    const startX = playerPos.current.x;
    const startY = playerPos.current.y - 20;

    let destX = targetX;
    let destY = targetY;

    if (destX === undefined || destY === undefined) {
      const dist = 180;
      if (playerFacing.current === 'up') {
        destX = startX;
        destY = startY - dist;
      } else if (playerFacing.current === 'down') {
        destX = startX;
        destY = startY + dist;
      } else if (playerFacing.current === 'left') {
        destX = startX - dist;
        destY = startY;
      } else {
        destX = startX + dist;
        destY = startY;
      }
    }

    // Clamp inside canvas
    destX = Math.max(50, Math.min(WORLD_WIDTH - 50, destX));
    destY = Math.max(70, Math.min(WORLD_HEIGHT - 50, destY));

    const projectile: SnowballProjectile = {
      id: Math.random().toString(),
      startX,
      startY,
      targetX: destX,
      targetY: destY,
      currentX: startX,
      currentY: startY,
      currentZ: 0,
      progress: 0,
      hit: false
    };

    snowballs.current.push(projectile);
  };

  // Check external throw trigger from UI button
  useEffect(() => {
    if (externalThrowTrigger && externalThrowTrigger !== prevThrowTrigger.current) {
      prevThrowTrigger.current = externalThrowTrigger;
      throwSnowball();
    }
  }, [externalThrowTrigger]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (paused) return;

      const code = e.code.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'keyw', 'keys', 'keya', 'keyd'].includes(code)) {
        keysPressed.current.add(code);
        targetMovePos.current = null; // Keyboard overrides point-and-click
      }

      if (code === 'space') {
        e.preventDefault();
        throwSnowball();
      }

      if (code === 'keyf' || code === 'enter') {
        if (nearbyStation) {
          e.preventDefault();
          soundManager.unlock();
          soundManager.play('select');
          onOpenStation(nearbyStation.id);
        }
      }

      if (code === 'keym' && currentMode === 'snow_angel') {
        onSnowAngelFlap?.();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [paused, nearbyStation, currentMode, onOpenStation, onSnowAngelFlap]);

  // Canvas Click / Tap Handler
  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.unlock();

    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // If shift or right click, throw snowball at location
    if (e.shiftKey || e.button === 2) {
      throwSnowball(clickX, clickY);
      return;
    }

    // Check if clicked near an interactive station
    for (const station of STATIONS) {
      if (Math.hypot(clickX - station.x, clickY - station.y) <= station.radius) {
        soundManager.play('select');
        onOpenStation(station.id);
        return;
      }
    }

    // In target range mode, clicking throws directly at target coordinates
    if (currentMode === 'snowball_range') {
      throwSnowball(clickX, clickY);
      return;
    }

    // If in snow angel mode, tap to flap
    if (currentMode === 'snow_angel') {
      onSnowAngelFlap?.();
      return;
    }

    // Otherwise point-and-click to walk
    targetMovePos.current = { x: clickX, y: clickY };
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Compute Movement
      let moveX = 0;
      let moveY = 0;

      if (!paused && currentMode !== 'snow_angel') {
        // From Keyboard
        const k = keysPressed.current;
        if (k.has('arrowup') || k.has('keyw')) moveY -= 1;
        if (k.has('arrowdown') || k.has('keys')) moveY += 1;
        if (k.has('arrowleft') || k.has('keya')) moveX -= 1;
        if (k.has('arrowright') || k.has('keyd')) moveX += 1;

        // From Mobile Joystick
        if (externalMoveVector && (externalMoveVector.x !== 0 || externalMoveVector.y !== 0)) {
          moveX = externalMoveVector.x;
          moveY = externalMoveVector.y;
        }

        // From Point-and-Click
        if (moveX === 0 && moveY === 0 && targetMovePos.current) {
          const dx = targetMovePos.current.x - playerPos.current.x;
          const dy = targetMovePos.current.y - playerPos.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 8) {
            moveX = dx / dist;
            moveY = dy / dist;
          } else {
            targetMovePos.current = null;
          }
        }
      }

      // Apply Movement & Facing
      const speed = isRollingSnowball ? 110 : 160;
      if (moveX !== 0 || moveY !== 0) {
        isWalking.current = true;
        const len = Math.hypot(moveX, moveY);
        const normX = (moveX / len) * speed * dt;
        const normY = (moveY / len) * speed * dt;

        // Facing direction
        if (Math.abs(moveX) > Math.abs(moveY)) {
          playerFacing.current = moveX > 0 ? 'right' : 'left';
        } else {
          playerFacing.current = moveY > 0 ? 'down' : 'up';
        }

        // Collision detection
        const nextX = playerPos.current.x + normX;
        const nextY = playerPos.current.y + normY;

        if (isWalkable(nextX, playerPos.current.y)) {
          playerPos.current.x = nextX;
        }
        if (isWalkable(playerPos.current.x, nextY)) {
          playerPos.current.y = nextY;
        }

        // Footprints in snow
        if (now - lastFootprintTime.current > 180) {
          lastFootprintTime.current = now;
          footSide.current = !footSide.current;
          const angle = Math.atan2(normY, normX);
          footprints.current.push({
            x: playerPos.current.x + (footSide.current ? 4 : -4),
            y: playerPos.current.y + 4,
            angle,
            isLeft: footSide.current,
            opacity: 0.6
          });
          if (footprints.current.length > 70) {
            footprints.current.shift();
          }
        }
      } else {
        isWalking.current = false;
      }

      // Check Nearby Stations
      let closestStation: WorldStation | null = null;
      let minDistance = Infinity;
      for (const s of STATIONS) {
        const d = Math.hypot(playerPos.current.x - s.x, playerPos.current.y - s.y);
        if (d <= s.radius && d < minDistance) {
          minDistance = d;
          closestStation = s;
        }
      }
      setNearbyStation(closestStation);
      onNearbyStationChange(closestStation);

      // 2. Update Moving Targets
      for (const t of targets.current) {
        t.x += t.vx * dt * 45;
        if (Math.abs(t.x - t.baseX) > 90) {
          t.vx *= -1;
        }
        if (t.hitTimer && t.hitTimer > 0) {
          t.hitTimer -= dt;
        }
      }

      // 3. Update Projectiles (Snowballs)
      for (let i = snowballs.current.length - 1; i >= 0; i--) {
        const sb = snowballs.current[i];
        sb.progress += dt * 2.8;

        if (sb.progress >= 1) {
          // Explode on ground
          const isMagic = !!santaState?.magicSnowballs;
          createBurst(sb.targetX, sb.targetY, isMagic ? '#FCD34D' : '#FFFFFF', 14);
          if (isMagic) {
            createBurst(sb.targetX, sb.targetY, '#EF4444', 8);
            createBurst(sb.targetX, sb.targetY, '#10B981', 8);
          }
          soundManager.play(isMagic ? 'reward' : 'impact');

          // Check if landed near Santa Claus (480, 190)
          const santaDist = Math.hypot(sb.targetX - 480, sb.targetY - 190);
          if (santaDist <= 46) {
            soundManager.playHoHoHo();
            createBurst(480, 170, '#EF4444', 16);
            createBurst(480, 170, '#FBBF24', 16);
          }

          // Check if hit any target
          for (const t of targets.current) {
            const hitDist = Math.hypot(sb.targetX - t.x, sb.targetY - t.y);
            if (hitDist <= t.radius + 12) {
              t.hitTimer = 0.4;
              createBurst(t.x, t.y, '#38BDF8', 22);
              createBurst(t.x, t.y, '#FCD34D', 12);
              soundManager.play('reveal-rare');
              onTargetHit(t);
              break;
            }
          }
          snowballs.current.splice(i, 1);
        } else {
          sb.currentX = sb.startX + (sb.targetX - sb.startX) * sb.progress;
          sb.currentY = sb.startY + (sb.targetY - sb.startY) * sb.progress;
          sb.currentZ = Math.sin(sb.progress * Math.PI) * 70; // Height arc

          // Trail particles
          if (Math.random() < 0.4) {
            const isMagic = !!santaState?.magicSnowballs;
            particles.current.push({
              x: sb.currentX,
              y: sb.currentY - sb.currentZ,
              vx: (Math.random() - 0.5) * 10,
              vy: Math.random() * 15,
              size: isMagic ? 2.5 + Math.random() * 3 : 2 + Math.random() * 2,
              color: isMagic ? (Math.random() < 0.5 ? '#FBBF24' : '#F43F5E') : '#FFFFFF',
              life: 0.35,
              maxLife: 0.35
            });
          }
        }
      }

      // Update Flying Sleigh position (if active)
      if (flyingSleighX.current !== null) {
        flyingSleighX.current += dt * 160;
        // Sparkle star trail
        if (Math.random() < 0.5) {
          particles.current.push({
            x: flyingSleighX.current - 20,
            y: 70 + Math.sin(flyingSleighX.current * 0.015) * 14 + (Math.random() - 0.5) * 8,
            vx: -25 + (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: 2 + Math.random() * 2.5,
            color: Math.random() < 0.6 ? '#FDE047' : '#F472B6',
            life: 0.6,
            maxLife: 0.6
          });
        }
        if (flyingSleighX.current > WORLD_WIDTH + 140) {
          flyingSleighX.current = null;
          onFlySleighComplete?.();
        }
      }

      // 4. Update Snowflakes
      for (const flake of snowflakes.current) {
        flake.y += flake.speed * (reducedMotion ? 0.4 : 1.0);
        flake.x += Math.sin(now * flake.swaySpeed + flake.swayOffset) * 0.7 + flake.drift;

        if (flake.y > WORLD_HEIGHT) {
          flake.y = -10;
          flake.x = Math.random() * WORLD_WIDTH;
        }
        if (flake.x < -10) flake.x = WORLD_WIDTH + 10;
        if (flake.x > WORLD_WIDTH + 10) flake.x = -10;
      }

      // 5. Update Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life -= dt;
        p.x += p.vx * dt * 30;
        p.y += p.vy * dt * 30;
        if (p.life <= 0) {
          particles.current.splice(i, 1);
        }
      }

      // Helper: spawn bursts
      function createBurst(x: number, y: number, color: string, count = 12) {
        for (let j = 0; j < count; j++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 5;
          particles.current.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: 2 + Math.random() * 3.5,
            color,
            life: 0.4 + Math.random() * 0.4,
            maxLife: 0.8
          });
        }
      }

      // ----------------------------------------------------
      // DRAWING PIPELINE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // 1. Winter Twilight Sky & Distant Mountain Silhouette
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 220);
      skyGrad.addColorStop(0, '#0F172A'); // Deep midnight navy
      skyGrad.addColorStop(0.6, '#1E293B');
      skyGrad.addColorStop(1, '#334155');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WORLD_WIDTH, 220);

      // Distant Alpine Peaks
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(120, 60);
      ctx.lineTo(260, 150);
      ctx.lineTo(380, 70);
      ctx.lineTo(520, 160);
      ctx.lineTo(660, 80);
      ctx.lineTo(800, 150);
      ctx.lineTo(920, 65);
      ctx.lineTo(WORLD_WIDTH, 140);
      ctx.lineTo(WORLD_WIDTH, 220);
      ctx.lineTo(0, 220);
      ctx.fill();

      // Peak snowcaps
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(100, 75);
      ctx.lineTo(120, 60);
      ctx.lineTo(140, 75);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(360, 85);
      ctx.lineTo(380, 70);
      ctx.lineTo(400, 85);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(640, 95);
      ctx.lineTo(660, 80);
      ctx.lineTo(680, 95);
      ctx.closePath();
      ctx.fill();

      // Aurora Borealis shimmer ribbon
      const auroraGrad = ctx.createLinearGradient(0, 30, WORLD_WIDTH, 120);
      auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
      auroraGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.25)');
      auroraGrad.addColorStop(1, 'rgba(168, 85, 247, 0.15)');
      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(0, 60 + Math.sin(now * 0.001) * 10);
      ctx.bezierCurveTo(300, 30, 600, 100, WORLD_WIDTH, 50);
      ctx.lineTo(WORLD_WIDTH, 120);
      ctx.bezierCurveTo(600, 160, 300, 80, 0, 110);
      ctx.closePath();
      ctx.fill();

      // Flying Reindeer Sleigh across the twilight sky
      if (flyingSleighX.current !== null) {
        drawFlyingSleigh(ctx, flyingSleighX.current, 70 + Math.sin(flyingSleighX.current * 0.015) * 14, now);
      }

      // 2. Main Snowy Ground Layer
      const snowGrad = ctx.createLinearGradient(0, 140, 0, WORLD_HEIGHT);
      snowGrad.addColorStop(0, '#E2E8F0');
      snowGrad.addColorStop(0.3, '#F1F5F9');
      snowGrad.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = snowGrad;
      ctx.beginPath();
      ctx.moveTo(0, 140);
      ctx.bezierCurveTo(240, 125, 680, 145, WORLD_WIDTH, 130);
      ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
      ctx.lineTo(0, WORLD_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Soft snow banks and drifts shading
      ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.beginPath();
      ctx.ellipse(280, 260, 180, 50, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(720, 330, 200, 60, 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(480, 560, 340, 55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Frozen Ice Pond in center
      const iceGrad = ctx.createRadialGradient(480, 360, 10, 480, 360, 85);
      iceGrad.addColorStop(0, 'rgba(186, 230, 253, 0.85)');
      iceGrad.addColorStop(0.7, 'rgba(125, 211, 252, 0.7)');
      iceGrad.addColorStop(1, 'rgba(224, 242, 254, 0.5)');
      ctx.fillStyle = iceGrad;
      ctx.beginPath();
      ctx.ellipse(480, 360, 85, 42, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Ice cracks & sheen
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(450, 355);
      ctx.lineTo(495, 362);
      ctx.lineTo(520, 350);
      ctx.moveTo(480, 360);
      ctx.lineTo(470, 372);
      ctx.stroke();

      // 3. Draw Station Markers
      for (const st of STATIONS) {
        const isNear = nearbyStation?.id === st.id;
        const pulse = Math.sin(now * 0.005) * 4;

        // Ground highlight ring
        ctx.beginPath();
        ctx.ellipse(st.x, st.y, (st.radius - 10) + pulse, ((st.radius - 10) * 0.55) + pulse * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = isNear ? 'rgba(56, 189, 248, 0.3)' : 'rgba(203, 213, 225, 0.25)';
        ctx.fill();
        ctx.strokeStyle = isNear ? '#0284C7' : 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = isNear ? 3 : 1.5;
        ctx.stroke();

        // Wooden Station Signpost
        ctx.fillStyle = '#78350F';
        ctx.fillRect(st.x - 3, st.y - 45, 6, 45);

        // Sign board
        ctx.fillStyle = isNear ? '#0284C7' : '#0F172A';
        ctx.beginPath();
        ctx.roundRect(st.x - 55, st.y - 75, 110, 32, 6);
        ctx.fill();
        ctx.strokeStyle = isNear ? '#38BDF8' : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sign text & icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${st.icon} ${st.name}`, st.x, st.y - 59);

        // Snow on top of sign
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(st.x - 56, st.y - 80, 112, 7, 3);
        ctx.fill();

        // Proximity key action bubble
        if (isNear) {
          ctx.fillStyle = '#CCFF00'; // Rare Friends signal green
          ctx.beginPath();
          ctx.roundRect(st.x - 60, st.y - 102, 120, 20, 10);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`[F / TAP] ${st.keyLabel}`, st.x, st.y - 92);
        }
      }

      // 4. Draw Pine Trees & Winter Props
      const trees = [
        { x: 90, y: 155, s: 1.2 },
        { x: 140, y: 140, s: 1.0 },
        { x: 420, y: 110, s: 0.9 },
        { x: 540, y: 105, s: 0.95 },
        { x: 840, y: 145, s: 1.15 },
        { x: 890, y: 135, s: 0.95 },
        { x: 80, y: 340, s: 0.85 },
        { x: 890, y: 370, s: 0.9 }
      ];

      for (const t of trees) {
        drawPineTree(ctx, t.x, t.y, t.s);
      }

      // 5. Draw Snow Angels
      for (const angel of snowAngels) {
        drawSnowAngel(ctx, angel);
      }

      // 6. Draw Footprints
      for (const fp of footprints.current) {
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.rotate(fp.angle);
        ctx.fillStyle = `rgba(148, 163, 184, ${fp.opacity * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Draw Placed Snowmen
      for (const sm of placedSnowmen) {
        drawPlacedSnowman(ctx, sm);
      }

      // 8. Draw Range Targets (Target Range area)
      for (const t of targets.current) {
        drawTarget(ctx, t);
      }

      // 8.5 Draw Santa Claus NPC, Holiday Tree & Parked Sleigh (at 480, 190)
      drawSantaNPC(ctx, 480, 190, now, nearbyStation?.id === 'santa');

      // 9. Draw Rare Friend Character Sprite
      if (spriteData.current) {
        drawFriend(
          ctx,
          spriteData.current,
          playerPos.current.x,
          playerPos.current.y,
          playerFacing.current,
          isWalking.current,
          now,
          {
            reducedMotion,
            scale: 1.0,
            showScarf: !santaState?.santaHatEquipped,
            isFlappingAngels: currentMode === 'snow_angel',
            hasSantaHat: !!santaState?.santaHatEquipped,
            santaSuit: !!santaState?.santaHatEquipped
          }
        );
      }

      // 10. Draw Active Rolling Snowball (if rolling)
      if (isRollingSnowball && rollingBallRadius > 0) {
        const offsetDist = 24 + rollingBallRadius;
        let ballX = playerPos.current.x;
        let ballY = playerPos.current.y;
        if (playerFacing.current === 'right') ballX += offsetDist;
        if (playerFacing.current === 'left') ballX -= offsetDist;
        if (playerFacing.current === 'down') ballY += offsetDist * 0.6;
        if (playerFacing.current === 'up') ballY -= offsetDist * 0.6;

        ctx.save();
        // Ground shadow
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.beginPath();
        ctx.ellipse(ballX, ballY + rollingBallRadius * 0.85, rollingBallRadius * 1.1, rollingBallRadius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snowball
        const ballGrad = ctx.createRadialGradient(
          ballX - rollingBallRadius * 0.3,
          ballY - rollingBallRadius * 0.3,
          rollingBallRadius * 0.2,
          ballX,
          ballY,
          rollingBallRadius
        );
        ballGrad.addColorStop(0, '#FFFFFF');
        ballGrad.addColorStop(0.8, '#E2E8F0');
        ballGrad.addColorStop(1, '#CBD5E1');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ballX, ballY, rollingBallRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 11. Draw Projectiles (Flying snowballs)
      for (const sb of snowballs.current) {
        // Shadow on ground
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.beginPath();
        ctx.ellipse(sb.currentX, sb.currentY, 8 * (1 - sb.progress * 0.3), 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snowball in air
        const ballY = sb.currentY - sb.currentZ;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(sb.currentX, ballY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 12. Draw Particles
      for (const p of particles.current) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 13. Draw Falling Snowflakes (Over everything)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (const flake of snowflakes.current) {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [paused, currentMode, placedSnowmen, snowAngels, isRollingSnowball, rollingBallRadius, reducedMotion, externalMoveVector]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        className="w-full h-full object-contain cursor-crosshair touch-none"
        onPointerDown={handleCanvasPointer}
        onContextMenu={e => e.preventDefault()}
      />
      {!spriteLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-cyan-200 text-sm font-semibold tracking-wide">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Loading Rare Friend #{friendId.toString()}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Drawing functions
function drawPineTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);

  // Trunk
  ctx.fillStyle = '#451A03';
  ctx.fillRect(-4 * scale, 0, 8 * scale, 16 * scale);

  // Tier 3 (Bottom)
  ctx.fillStyle = '#064E3B';
  ctx.beginPath();
  ctx.moveTo(0, -35 * scale);
  ctx.lineTo(-24 * scale, 0);
  ctx.lineTo(24 * scale, 0);
  ctx.closePath();
  ctx.fill();

  // Snow on bottom tier
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(0, -35 * scale);
  ctx.lineTo(-24 * scale, 0);
  ctx.lineTo(-12 * scale, -4 * scale);
  ctx.lineTo(0, -2 * scale);
  ctx.lineTo(12 * scale, -4 * scale);
  ctx.lineTo(24 * scale, 0);
  ctx.closePath();
  ctx.fill();

  // Tier 2 (Middle)
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.moveTo(0, -55 * scale);
  ctx.lineTo(-18 * scale, -24 * scale);
  ctx.lineTo(18 * scale, -24 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(0, -55 * scale);
  ctx.lineTo(-18 * scale, -24 * scale);
  ctx.lineTo(0, -28 * scale);
  ctx.lineTo(18 * scale, -24 * scale);
  ctx.closePath();
  ctx.fill();

  // Tier 1 (Top)
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(0, -75 * scale);
  ctx.lineTo(-12 * scale, -48 * scale);
  ctx.lineTo(12 * scale, -48 * scale);
  ctx.closePath();
  ctx.fill();

  // Snow cap
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(0, -76 * scale);
  ctx.lineTo(-10 * scale, -58 * scale);
  ctx.lineTo(10 * scale, -58 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPlacedSnowman(ctx: CanvasRenderingContext2D, sm: PlacedSnowman) {
  ctx.save();
  ctx.translate(sm.x, sm.y);

  // Shadow
  ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, sm.baseRadius * 0.8, sm.baseRadius * 1.2, sm.baseRadius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, sm.baseRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Torso
  const torsoY = -sm.baseRadius * 0.85;
  if (sm.suit === 'santa_suit') {
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = '#991B1B';
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
  }
  ctx.beginPath();
  ctx.arc(0, torsoY, sm.torsoRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Santa belt on torso if santa_suit
  if (sm.suit === 'santa_suit') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-sm.torsoRadius * 0.95, torsoY - 3, sm.torsoRadius * 1.9, 6);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-5, torsoY - 5, 10, 10);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-2, torsoY - 2, 4, 4);
    // White fur trim at bottom of torso
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-sm.torsoRadius * 0.8, torsoY + sm.torsoRadius * 0.7, sm.torsoRadius * 1.6, 4, 2);
    ctx.fill();
  }

  // Twig Arms
  if (sm.hasTwigArms) {
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-sm.torsoRadius * 0.8, torsoY);
    ctx.lineTo(-sm.torsoRadius * 1.8, torsoY - 14);
    ctx.lineTo(-sm.torsoRadius * 2.1, torsoY - 18);
    ctx.moveTo(sm.torsoRadius * 0.8, torsoY);
    ctx.lineTo(sm.torsoRadius * 1.8, torsoY - 14);
    ctx.lineTo(sm.torsoRadius * 2.1, torsoY - 18);
    ctx.stroke();
  }

  // Buttons on Torso
  if (sm.buttons !== 'none') {
    if (sm.buttons === 'candy_cane') {
      // Red & white candy cane buttons
      for (let b = -1; b <= 1; b++) {
        const by = torsoY + b * 7;
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(0, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-1.5, by - 1.5, 3, 3);
      }
    } else {
      ctx.fillStyle = sm.buttons === 'berries' ? '#DC2626' : sm.buttons === 'gold' ? '#F59E0B' : '#0F172A';
      for (let b = -1; b <= 1; b++) {
        ctx.beginPath();
        ctx.arc(0, torsoY + b * 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Head
  const headY = torsoY - sm.torsoRadius * 0.85;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.arc(0, headY, sm.headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Scarf
  ctx.fillStyle = sm.scarfColor;
  ctx.fillRect(-sm.headRadius * 0.9, headY + sm.headRadius * 0.65, sm.headRadius * 1.8, 6);
  ctx.fillRect(sm.headRadius * 0.3, headY + sm.headRadius * 0.65, 5, 14);

  // White Santa Beard
  if (sm.beard === 'white_beard') {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-sm.headRadius * 0.75, headY + sm.headRadius * 0.2);
    ctx.quadraticCurveTo(-sm.headRadius * 0.9, headY + sm.headRadius * 1.3, 0, headY + sm.headRadius * 1.5);
    ctx.quadraticCurveTo(sm.headRadius * 0.9, headY + sm.headRadius * 1.3, sm.headRadius * 0.75, headY + sm.headRadius * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Charcoal Eyes
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-4, headY - 2, 2, 0, Math.PI * 2);
  ctx.arc(4, headY - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Carrot Nose
  if (sm.hasCarrot) {
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(0, headY + 1);
    ctx.lineTo(12, headY + 3);
    ctx.lineTo(0, headY + 5);
    ctx.closePath();
    ctx.fill();
  }

  // Hat
  if (sm.hat === 'santa_hat') {
    // Red curved Santa cap
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-sm.headRadius * 0.85, headY - sm.headRadius * 0.4);
    ctx.lineTo(sm.headRadius * 0.85, headY - sm.headRadius * 0.4);
    ctx.quadraticCurveTo(sm.headRadius * 0.5, headY - sm.headRadius * 1.5, sm.headRadius * 1.25, headY - sm.headRadius * 1.6);
    ctx.quadraticCurveTo(0, headY - sm.headRadius * 1.2, -sm.headRadius * 0.85, headY - sm.headRadius * 0.4);
    ctx.closePath();
    ctx.fill();

    // White fluffy fur brim
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-sm.headRadius * 0.95, headY - sm.headRadius * 0.65, sm.headRadius * 1.9, 6.5, 3);
    ctx.fill();

    // White pom-pom
    ctx.beginPath();
    ctx.arc(sm.headRadius * 1.25, headY - sm.headRadius * 1.6, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sm.hat === 'tophat') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-sm.headRadius * 0.9, headY - sm.headRadius - 3, sm.headRadius * 1.8, 4);
    ctx.fillRect(-sm.headRadius * 0.6, headY - sm.headRadius - 18, sm.headRadius * 1.2, 16);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-sm.headRadius * 0.6, headY - sm.headRadius - 6, sm.headRadius * 1.2, 3);
  } else if (sm.hat === 'beanie') {
    ctx.fillStyle = sm.scarfColor;
    ctx.beginPath();
    ctx.arc(0, headY - sm.headRadius * 0.5, sm.headRadius * 0.95, Math.PI, Math.PI * 2);
    ctx.fill();
    // Pom-pom
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, headY - sm.headRadius * 1.4, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (sm.hat === 'crown') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-sm.headRadius * 0.8, headY - sm.headRadius);
    ctx.lineTo(-sm.headRadius * 0.8, headY - sm.headRadius - 12);
    ctx.lineTo(-sm.headRadius * 0.3, headY - sm.headRadius - 6);
    ctx.lineTo(0, headY - sm.headRadius - 14);
    ctx.lineTo(sm.headRadius * 0.3, headY - sm.headRadius - 6);
    ctx.lineTo(sm.headRadius * 0.8, headY - sm.headRadius - 12);
    ctx.lineTo(sm.headRadius * 0.8, headY - sm.headRadius);
    ctx.closePath();
    ctx.fill();
  }

  // Name tag
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-45, headY - sm.headRadius - 28, 90, 16, 4);
  ctx.fill();
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sm.name, 0, headY - sm.headRadius - 20);

  ctx.restore();
}

function drawSnowAngel(ctx: CanvasRenderingContext2D, angel: SnowAngel) {
  ctx.save();
  ctx.translate(angel.x, angel.y);

  // Indented angel impression in snow
  ctx.fillStyle = 'rgba(186, 214, 240, 0.4)';
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
  ctx.lineWidth = 1.5;

  // Head
  ctx.beginPath();
  ctx.arc(0, -22, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Body / gown
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(-14, 20);
  ctx.lineTo(14, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wings (spread out arcs)
  ctx.beginPath();
  ctx.ellipse(-18, -4, 22, 14, -0.2, 0, Math.PI * 2);
  ctx.ellipse(18, -4, 22, 14, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sparkles around angel
  ctx.fillStyle = '#FEF08A';
  for (const s of angel.sparkles) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTarget(ctx: CanvasRenderingContext2D, t: SnowTarget) {
  ctx.save();
  ctx.translate(t.x, t.y);

  // If hit recently, shake/scale animation
  if (t.hitTimer && t.hitTimer > 0) {
    const scale = 1.2 + Math.sin(t.hitTimer * 20) * 0.15;
    ctx.scale(scale, scale);
  }

  if (t.type === 'target_board') {
    // Hanging post
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Outer ring
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Middle ring
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, t.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Bullseye
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, t.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.type === 'frost_crystal') {
    // Floating glowing ice crystal
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#BAE6FD';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -t.radius);
    ctx.lineTo(t.radius * 0.8, 0);
    ctx.lineTo(0, t.radius);
    ctx.lineTo(-t.radius * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, t.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.type === 'golden_bell') {
    // Winter brass bell
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-t.radius * 0.7, t.radius * 0.6);
    ctx.lineTo(-t.radius * 0.4, -t.radius * 0.5);
    ctx.quadraticCurveTo(0, -t.radius, t.radius * 0.4, -t.radius * 0.5);
    ctx.lineTo(t.radius * 0.7, t.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Clapper
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(0, t.radius * 0.75, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.type === 'ice_sprite') {
    // Mischievous little frost imp
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-4, -2, 3, 0, Math.PI * 2);
    ctx.arc(4, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-4, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label badge
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  ctx.roundRect(-24, t.radius + 4, 48, 14, 3);
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+${t.points}`, 0, t.radius + 11);

  ctx.restore();
}

function drawFestiveChristmasTree(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number) {
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brown trunk
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-5, 0, 10, 10);

  // 3 Pine Tiers
  // Tier 1 (Bottom)
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.moveTo(-26, 2);
  ctx.lineTo(26, 2);
  ctx.lineTo(16, -14);
  ctx.lineTo(20, -14);
  ctx.lineTo(0, -32);
  ctx.lineTo(-20, -14);
  ctx.lineTo(-16, -14);
  ctx.closePath();
  ctx.fill();

  // Tier 2 (Middle)
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(20, -12);
  ctx.lineTo(14, -26);
  ctx.lineTo(17, -26);
  ctx.lineTo(0, -44);
  ctx.lineTo(-17, -26);
  ctx.lineTo(-14, -26);
  ctx.closePath();
  ctx.fill();

  // Tier 3 (Top)
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.moveTo(-14, -26);
  ctx.lineTo(14, -26);
  ctx.lineTo(0, -52);
  ctx.closePath();
  ctx.fill();

  // Snowy branch frost
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(-22, 0, 44, 2);
  ctx.fillRect(-16, -13, 32, 2);
  ctx.fillRect(-10, -27, 20, 2);

  // Blinking fairy lights
  const lightColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#A855F7'];
  const lightOffsets = [
    { x: -14, y: -4 },
    { x: -2, y: -2 },
    { x: 12, y: -6 },
    { x: -8, y: -16 },
    { x: 6, y: -18 },
    { x: -4, y: -28 },
    { x: 5, y: -34 },
    { x: -1, y: -42 }
  ];

  for (let i = 0; i < lightOffsets.length; i++) {
    const pt = lightOffsets[i];
    const pulse = Math.sin(timeMs * 0.005 + i * 1.3) > 0;
    const col = lightColors[i % lightColors.length];
    ctx.fillStyle = pulse ? col : 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pulse ? 2.5 : 1.5, 0, Math.PI * 2);
    ctx.fill();
    if (pulse) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Golden 5-Point Star Topper
  ctx.save();
  ctx.translate(0, -54);
  const starGlow = 0.8 + Math.sin(timeMs * 0.006) * 0.2;
  ctx.fillStyle = '#FBBF24';
  ctx.shadowColor = '#FBBF24';
  ctx.shadowBlur = 8 * starGlow;
  ctx.beginPath();
  for (let s = 0; s < 5; s++) {
    const angle = (s * 4 * Math.PI) / 5 - Math.PI / 2;
    const r = 6;
    const sx = Math.cos(angle) * r;
    const sy = Math.sin(angle) * r;
    if (s === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawParkedSleigh(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number) {
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden Curved Runners
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-24, 8);
  ctx.lineTo(18, 8);
  ctx.quadraticCurveTo(28, 7, 28, -2);
  ctx.moveTo(-16, 8);
  ctx.lineTo(-14, 0);
  ctx.moveTo(12, 8);
  ctx.lineTo(10, 0);
  ctx.stroke();

  // Sleigh Carriage Body (Red with Gold Filigree)
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(16, 0);
  ctx.quadraticCurveTo(24, 0, 22, -14);
  ctx.lineTo(-18, -14);
  ctx.quadraticCurveTo(-24, -8, -22, 0);
  ctx.closePath();
  ctx.fill();

  // Gold rim
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Brown Toy Bag
  ctx.fillStyle = '#92400E';
  ctx.beginPath();
  ctx.ellipse(-8, -17, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gift Boxes overflowing
  // Green gift
  ctx.fillStyle = '#16A34A';
  ctx.fillRect(2, -22, 11, 11);
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(6, -22, 3, 11);
  ctx.fillRect(2, -18, 11, 3);

  // Red gift
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(-14, -25, 9, 9);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-11, -25, 3, 9);
  ctx.fillRect(-14, -22, 9, 3);

  // Blue gift
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(-4, -27, 9, 8);
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(-1, -27, 3, 8);

  ctx.restore();
}

function drawSantaNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeMs: number,
  isHighlighted: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(timeMs * 0.003) * 1.5;

  // 1. Festive Christmas Pine beside Santa
  drawFestiveChristmasTree(ctx, -56, 4, timeMs);

  // 2. Santa's Parked Wooden Gift Sleigh
  drawParkedSleigh(ctx, 44, 4, timeMs);

  // 3. Ground shadow for Santa
  ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight glow if player is near
  if (isHighlighted) {
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 8, 26, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4. Black Boots
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(-10, 4, 8, 8, 3);
  ctx.roundRect(2, 4, 8, 8, 3);
  ctx.fill();

  // 5. Red Trousers & Coat Base
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.roundRect(-14, -22 + bob, 28, 26, [10, 10, 6, 6]);
  ctx.fill();

  // White fur coat trim at bottom
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(-15, 2 + bob, 30, 5, 2.5);
  ctx.fill();

  // Black Belt with Gold Buckle
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-14, -8 + bob, 28, 5);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-5, -9 + bob, 10, 7);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-2, -7 + bob, 4, 3);

  // 6. Santa's Head & Face
  const headY = -34 + bob;
  // Face skin
  ctx.fillStyle = '#FED7AA';
  ctx.beginPath();
  ctx.arc(0, headY, 11, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.beginPath();
  ctx.arc(-6, headY + 2, 3, 0, Math.PI * 2);
  ctx.arc(6, headY + 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Friendly eyes
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-4, headY - 1, 1.6, 0, Math.PI * 2);
  ctx.arc(4, headY - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Big Fluffy White Beard & Mustache
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-11, headY + 2);
  ctx.bezierCurveTo(-15, headY + 20, 15, headY + 20, 11, headY + 2);
  ctx.closePath();
  ctx.fill();

  // Mustache puffs
  ctx.beginPath();
  ctx.ellipse(-4, headY + 3, 5, 2.5, -0.15, 0, Math.PI * 2);
  ctx.ellipse(4, headY + 3, 5, 2.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 7. Santa Hat
  // Red cap leaning over
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(-11, headY - 6);
  ctx.lineTo(11, headY - 6);
  ctx.quadraticCurveTo(16, headY - 24, 22, headY - 14);
  ctx.quadraticCurveTo(4, headY - 18, -11, headY - 6);
  ctx.closePath();
  ctx.fill();

  // White fluffy band
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(-12, headY - 8, 24, 6, 3);
  ctx.fill();

  // White pom-pom
  ctx.beginPath();
  ctx.arc(22, headY - 14, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 8. Arms & Mittens
  ctx.fillStyle = '#DC2626';
  // Left arm resting
  ctx.beginPath();
  ctx.ellipse(-16, -14 + bob, 5, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right arm waving gently with golden bell
  const waveAngle = Math.sin(timeMs * 0.005) * 0.25;
  ctx.save();
  ctx.translate(14, -16 + bob);
  ctx.rotate(waveAngle);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(0, -6, 12, 6);
  // Red mitten
  ctx.beginPath();
  ctx.arc(14, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  // Small golden jingle bell in hand
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(17, -3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 9. Floating Festive Nametag
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(-42, headY - 28, 84, 18, 5);
  ctx.fill();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎅 Santa Claus', 0, headY - 19);

  ctx.restore();
}

function drawFlyingSleigh(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Two Reindeer ahead (x: 45, x: 75)
  for (const rx of [45, 75]) {
    const legSwing = Math.sin(timeMs * 0.015 + rx) * 4;

    // Brown Reindeer Body
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(rx, 0, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reindeer Legs running
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx - 6, 4);
    ctx.lineTo(rx - 8 - legSwing, 12);
    ctx.moveTo(rx + 6, 4);
    ctx.lineTo(rx + 8 + legSwing, 12);
    ctx.stroke();

    // Reindeer Head & Neck
    ctx.beginPath();
    ctx.moveTo(rx + 8, 0);
    ctx.lineTo(rx + 14, -8);
    ctx.lineTo(rx + 18, -6);
    ctx.lineTo(rx + 12, 2);
    ctx.closePath();
    ctx.fill();

    // Red glowing nose on lead reindeer (Rudolph!)
    if (rx === 75) {
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(rx + 18, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Antlers
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx + 14, -8);
    ctx.lineTo(rx + 16, -15);
    ctx.lineTo(rx + 19, -13);
    ctx.stroke();
  }

  // Golden Harness Reins
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.lineTo(45, 0);
  ctx.lineTo(75, 0);
  ctx.stroke();

  // 2. Sleigh
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(-18, 4);
  ctx.lineTo(14, 4);
  ctx.quadraticCurveTo(20, 4, 18, -8);
  ctx.lineTo(-14, -8);
  ctx.closePath();
  ctx.fill();

  // Golden runners
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, 8);
  ctx.lineTo(16, 8);
  ctx.quadraticCurveTo(22, 8, 22, 0);
  ctx.stroke();

  // Santa inside sleigh waving
  // Red coat & hat
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(0, -10, 6, 0, Math.PI * 2);
  ctx.fill();
  // Beard
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -8, 4, 0, Math.PI);
  ctx.fill();
  // Hat
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(-4, -14);
  ctx.lineTo(4, -14);
  ctx.lineTo(8, -18);
  ctx.closePath();
  ctx.fill();
  // White pom-pom
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(8, -18, 2, 0, Math.PI * 2);
  ctx.fill();

  // Toy bag in back of sleigh
  ctx.fillStyle = '#92400E';
  ctx.beginPath();
  ctx.arc(-10, -8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
