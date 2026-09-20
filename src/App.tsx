import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ActivityMode,
  GameStats,
  PlacedSnowman,
  SnowAngel,
  SnowTarget,
  SantaState
} from './types.ts';
import {
  createGamePreview,
  GameClient,
  GameSnapshot
} from '@rarefriends/friendsdk/game';
import {
  formatRf,
  PRESET_FRIENDS,
  RF,
  SNOW_GAME_DEFINITION
} from './game/snowGameDefinition.ts';
import { soundManager } from './game/soundManager.ts';
import { SnowCanvas } from './components/SnowCanvas.tsx';
import { SnowmanBuilderModal } from './components/SnowmanBuilderModal.tsx';
import { SnowAngelModal } from './components/SnowAngelModal.tsx';
import { FrostCrateModal } from './components/FrostCrateModal.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { FriendSelectorModal } from './components/FriendSelectorModal.tsx';
import { SantaModal } from './components/SantaModal.tsx';
import { VibeathonSubmissionModal } from './components/VibeathonSubmissionModal.tsx';
import { TouchControls } from './components/TouchControls.tsx';
import { WorldStation } from './game/snowWorld.ts';
import {
  Volume2,
  VolumeX,
  Smartphone,
  Sparkles,
  Trophy,
  Target,
  Backpack,
  User,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Friend Identity & Client
  const [selectedFriendId, setSelectedFriendId] = useState<bigint>(1n);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  // Sound & Motion Settings
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  // Active Modals & Station state
  const [activeModal, setActiveModal] = useState<ActivityMode>('roam');
  const [nearbyStation, setNearbyStation] = useState<WorldStation | null>(null);

  // Game World Persistence
  const [placedSnowmen, setPlacedSnowmen] = useState<PlacedSnowman[]>([]);
  const [snowAngels, setSnowAngels] = useState<SnowAngel[]>([]);
  const [rollingBallRadius, setRollingBallRadius] = useState<number>(0);
  const [isRollingSnowball, setIsRollingSnowball] = useState<boolean>(false);

  // Score & Stats
  const [stats, setStats] = useState<GameStats>({
    snowballsThrown: 0,
    targetsHit: 0,
    snowballScore: 0,
    snowmenBuilt: 0,
    snowAngelsMade: 0,
    cratesOpened: 0,
    rfRedeemed: '0 RF'
  });

  // Santa Holiday Feature State
  const [santaState, setSantaState] = useState<SantaState>({
    hasMetSanta: false,
    giftsOpened: 0,
    santaHatEquipped: false,
    magicSnowballs: false,
    sleighFlying: false
  });

  // External controller inputs (from touch/mobile UI)
  const [externalMoveVector, setExternalMoveVector] = useState<{ x: number; y: number } | null>(null);
  const [externalThrowTrigger, setExternalThrowTrigger] = useState<number>(0);

  // Initialize FriendSDK Preview Client
  const gamePreview = useMemo(() => {
    return createGamePreview(SNOW_GAME_DEFINITION, {
      stake: 200n * RF,
      rfBalance: 25n * RF,
      friendId: selectedFriendId
    });
  }, [selectedFriendId]);

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);

  const refreshSnapshot = async () => {
    try {
      const snap = await gamePreview.client.read();
      setSnapshot(snap);
    } catch (e) {
      console.error('Error reading snapshot:', e);
    }
  };

  useEffect(() => {
    void refreshSnapshot();
  }, [gamePreview]);

  // Audio setup
  useEffect(() => {
    soundManager.init(isMuted);
    const unlockAudio = () => {
      void soundManager.unlock();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Detect mobile touch screen on mount
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
      setShowTouchControls(true);
    }
  }, []);

  // Handle Mute Toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  // Connect Web3 Wallet
  const handleConnectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        soundManager.play('select');
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        if (accounts && accounts[0]) {
          setConnectedAccount(accounts[0]);
        }
      } catch (err) {
        console.error('Wallet connect error:', err);
      }
    } else {
      // Fallback simulated notification
      setConnectedAccount('0x71C...4663');
    }
  };

  // Target Hit in Range
  const handleTargetHit = (target: SnowTarget) => {
    setStats(prev => ({
      ...prev,
      targetsHit: prev.targetsHit + 1,
      snowballScore: prev.snowballScore + target.points
    }));
  };

  // Open specific station from walking up to it or clicking
  const handleOpenStation = (stationId: string) => {
    if (stationId === 'snowball_range') {
      setActiveModal('snowball_range');
    } else if (stationId === 'snowman_builder') {
      setActiveModal('snowman_builder');
    } else if (stationId === 'snow_angel') {
      setActiveModal('snow_angel');
    } else if (stationId === 'frost_crate') {
      setActiveModal('frost_crate');
    } else if (stationId === 'santa') {
      soundManager.playHoHoHo();
      setSantaState(prev => ({ ...prev, hasMetSanta: true }));
      setActiveModal('santa');
    }
  };

  // Add placed snowman
  const handleAddSnowman = (snowman: PlacedSnowman) => {
    setPlacedSnowmen(prev => [...prev, snowman]);
    setStats(prev => ({
      ...prev,
      snowmenBuilt: prev.snowmenBuilt + 1
    }));
  };

  // Add snow angel
  const handleAddSnowAngel = (angel: SnowAngel) => {
    setSnowAngels(prev => [...prev, angel]);
    setStats(prev => ({
      ...prev,
      snowAngelsMade: prev.snowAngelsMade + 1
    }));
  };

  const currentFriend = PRESET_FRIENDS.find(f => f.id === selectedFriendId) || {
    id: selectedFriendId,
    name: `Rare Friend #${selectedFriendId.toString()}`,
    family: 'Generations',
    tagline: 'Custom Digital Companion',
    hatColor: '#38BDF8'
  };

  // Count total collectibles in satchel
  const totalInventoryCount = snapshot
    ? snapshot.inventory.reduce((acc, curr) => acc + Number(curr), 0)
    : 0;

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 shrink-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-30">
        {/* Left: App Title & Vibeathon Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">❄️</span>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              Play&apos;n with Snow
            </h1>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            Rare Friends Vibeathon
          </span>
        </div>

        {/* Center: Simulated Balances & Inventory Quick Bar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active Friend identity pill */}
          <button
            onClick={() => {
              soundManager.play('select');
              setActiveModal('friend_selector');
            }}
            className="flex items-center space-x-1.5 py-1 px-2.5 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition text-xs"
            title="Switch Friend identity"
          >
            <span
              style={{ backgroundColor: currentFriend.hatColor }}
              className="w-2.5 h-2.5 rounded-full"
            />
            <span className="font-semibold text-slate-200 truncate max-w-[90px] sm:max-w-[130px]">
              {currentFriend.name}
            </span>
          </button>

          {/* Simulated RF balance */}
          <div
            onClick={() => {
              soundManager.play('select');
              setActiveModal('frost_crate');
            }}
            className="hidden xs:flex items-center space-x-1 py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition text-xs"
            title="Simulated RF balance"
          >
            <span className="text-amber-400 font-bold">
              {snapshot ? formatRf(snapshot.rfBalance) : '...'}
            </span>
          </div>

          {/* Satchel Button */}
          <button
            onClick={() => {
              soundManager.play('select');
              setActiveModal('inventory');
            }}
            className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition"
            title="Open Winter Collectibles Satchel"
          >
            <Backpack className="w-4 h-4 text-cyan-400" />
            {totalInventoryCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-black text-slate-950 flex items-center justify-center">
                {totalInventoryCount}
              </span>
            )}
          </button>

          {/* Santa Sleigh Quick Button */}
          <button
            onClick={() => {
              soundManager.playHoHoHo();
              setActiveModal('santa');
            }}
            className="flex items-center space-x-1.5 py-1 px-2.5 rounded-lg bg-gradient-to-r from-red-950/80 to-red-900/60 border border-red-500/50 hover:border-red-400 text-xs text-red-200 transition active:scale-95 shadow"
            title="Visit Santa Claus & Holiday Sleigh"
          >
            <span>🎅</span>
            <span className="hidden md:inline font-bold">Santa</span>
          </button>
        </div>

        {/* Right: Controls & Vibeathon PR Packager */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Touch Controls toggle button */}
          <button
            onClick={() => setShowTouchControls(!showTouchControls)}
            className={`p-1.5 rounded-lg border transition ${
              showTouchControls
                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
            title="Toggle On-screen Touch Joystick"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Audio Mute toggle */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title={isMuted ? 'Unmute FriendSDK audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Vibeathon Submit Button */}
          <button
            onClick={() => {
              soundManager.play('select');
              setActiveModal('vibeathon_submission');
            }}
            className="py-1 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-bold text-xs text-slate-950 flex items-center space-x-1.5 shadow-md shadow-amber-900/30 active:scale-95 transition"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit to Vibeathon</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage Frame */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 p-0 sm:p-2">
        <div className="relative w-full h-full max-w-[960px] max-h-[640px] aspect-[3/2] rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-slate-800 shadow-2xl bg-slate-900">
          {/* Target Practice Score Banner (Top Left) */}
          <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs pointer-events-none">
            <Target className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Target Score:</span>
            <span className="font-extrabold text-cyan-300">{stats.snowballScore} pts</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Hits:</span>
            <span className="font-bold text-white">{stats.targetsHit}</span>
          </div>

          {/* Canvas Component */}
          <SnowCanvas
            friendId={selectedFriendId}
            currentMode={activeModal}
            onOpenStation={handleOpenStation}
            paused={activeModal !== 'roam' && activeModal !== 'snowball_range'}
            reducedMotion={reducedMotion}
            placedSnowmen={placedSnowmen}
            snowAngels={snowAngels}
            rollingBallRadius={rollingBallRadius}
            isRollingSnowball={isRollingSnowball}
            onTargetHit={handleTargetHit}
            onNearbyStationChange={setNearbyStation}
            externalMoveVector={externalMoveVector}
            externalThrowTrigger={externalThrowTrigger}
            santaState={santaState}
            onFlySleighComplete={() => setSantaState(prev => ({ ...prev, sleighFlying: false }))}
          />

          {/* Proximity Station Prompt Bar (when walking near a station) */}
          {nearbyStation && activeModal === 'roam' && (
            <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/50 shadow-lg animate-fade-in">
              <span className="text-base">{nearbyStation.icon}</span>
              <div>
                <div className="text-xs font-bold text-cyan-200">{nearbyStation.name}</div>
                <div className="text-[10px] text-slate-400">{nearbyStation.description}</div>
              </div>
              <button
                onClick={() => handleOpenStation(nearbyStation.id)}
                className="ml-2 py-1 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition active:scale-95 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Desktop Keyboard Hints HUD at bottom */}
          <div className="hidden sm:flex absolute bottom-3 inset-x-0 justify-center pointer-events-none z-10">
            <div className="flex items-center space-x-3 bg-slate-950/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-400">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">WASD</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">Click</kbd> Walk
              </span>
              <span>&bull;</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">Space</kbd> Throw Snowball
              </span>
              <span>&bull;</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">F</kbd> Enter Station
              </span>
            </div>
          </div>

          {/* Mobile Touch Controls Overlay */}
          {showTouchControls && activeModal === 'roam' && (
            <TouchControls
              onMoveVectorChange={setExternalMoveVector}
              onThrowSnowball={() => {
                setExternalThrowTrigger(Date.now());
                setStats(prev => ({
                  ...prev,
                  snowballsThrown: prev.snowballsThrown + 1
                }));
              }}
              onInteract={() => {
                if (nearbyStation) {
                  handleOpenStation(nearbyStation.id);
                }
              }}
              nearbyStation={nearbyStation}
            />
          )}
        </div>
      </main>

      {/* Modals & Sub-experiences */}
      <SnowmanBuilderModal
        isOpen={activeModal === 'snowman_builder'}
        onClose={() => setActiveModal('roam')}
        onPlaceSnowman={handleAddSnowman}
      />

      <SnowAngelModal
        isOpen={activeModal === 'snow_angel'}
        onClose={() => setActiveModal('roam')}
        onCompleteAngel={handleAddSnowAngel}
      />

      <FrostCrateModal
        isOpen={activeModal === 'frost_crate'}
        onClose={() => setActiveModal('roam')}
        client={gamePreview.client}
        onSnapshotUpdated={setSnapshot}
      />

      <InventoryModal
        isOpen={activeModal === 'inventory'}
        onClose={() => setActiveModal('roam')}
        snapshot={snapshot}
        client={gamePreview.client}
        onSnapshotUpdated={setSnapshot}
      />

      <FriendSelectorModal
        isOpen={activeModal === 'friend_selector'}
        onClose={() => setActiveModal('roam')}
        currentFriendId={selectedFriendId}
        onSelectFriendId={setSelectedFriendId}
        connectedAccount={connectedAccount}
        onConnectWallet={handleConnectWallet}
      />

      <SantaModal
        isOpen={activeModal === 'santa'}
        onClose={() => setActiveModal('roam')}
        santaState={santaState}
        onToggleSantaHat={() => {
          setSantaState(prev => ({
            ...prev,
            santaHatEquipped: !prev.santaHatEquipped
          }));
        }}
        onToggleMagicSnowballs={() => {
          setSantaState(prev => ({
            ...prev,
            magicSnowballs: !prev.magicSnowballs
          }));
        }}
        onOpenSnowmanBuilder={() => {
          setActiveModal('snowman_builder');
        }}
        onReceiveHolidayGift={() => {
          setSantaState(prev => ({
            ...prev,
            giftsOpened: prev.giftsOpened + 1
          }));
          if (snapshot) {
            setSnapshot({
              ...snapshot,
              rfBalance: snapshot.rfBalance + 10n * RF
            });
          }
        }}
        onLaunchSleigh={() => {
          setSantaState(prev => ({
            ...prev,
            sleighFlying: true
          }));
        }}
        simulatedBalance={snapshot ? formatRf(snapshot.rfBalance) : '25.00 RF'}
      />

      <VibeathonSubmissionModal
        isOpen={activeModal === 'vibeathon_submission'}
        onClose={() => setActiveModal('roam')}
      />
    </div>
  );
}
