import React, { useState } from 'react';
import { soundManager } from '../game/soundManager.ts';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Github,
  Award,
  FileText,
  Sparkles
} from 'lucide-react';

interface VibeathonSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VibeathonSubmissionModal: React.FC<VibeathonSubmissionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = `### Submission: Play'n with Snow
**Category**: Character Spotlight & Gameplay Experience  
**SDK Version**: @rarefriends/friendsdk v0.1.2  
**Target Devices**: Desktop (Keyboard/Mouse) & Mobile (Touch Joystick & Action Buttons)  
**Live Preview URL**: [Hosted on GitHub Pages / Vibeathon Preview]

#### Pitch
"Play'n with Snow" is a whimsical winter wonderland experience where your verified Rare Friend frolics in fresh alpine powder: throw snowballs at moving frost targets, sculpt and customize multi-tiered snowmen with hats and scarves, carve glistening snow angels, and excavate snowdrifts for simulated $RAREFRIENDS collectibles!

#### Key Features & Activities
1. **Snowball Target Range**:
   - Aim & throw snowballs with realistic parabolic physics and particle burst collisions.
   - Score points against Bullseye boards, Floating Frost Crystals, Winter Bells, and Ice Sprites.
2. **Snowman Sculpting Yard**:
   - Roll snow to expand spheres through 3 tiers (Base, Torso, Head).
   - Customize snowmen with Top Hats, Beanies, Golden Crowns, Carrot Noses, Twig Arms, and colorful wool scarves.
   - Place permanent decorated snowmen in your winter yard!
3. **Powder Meadow Snow Angels**:
   - Lay down in deep snow and flap wings to imprint sparkling snow angels.
4. **Frost Mystery Depot (FriendSDK Chance Game)**:
   - Built on \`ChanceGameDefinition\` with verified maximum prize backing (10 RF max prize reserve per shovel).
   - Exact 10,000 basis points probability table:
     - 45.0% (4,500 bps): Pinecone Snowball (0.25 RF)
     - 28.0% (2,800 bps): Glacial Icicle (0.50 RF)
     - 15.0% (1,500 bps): Frost Crystal Star (1.25 RF)
     - 8.0% (800 bps): Aurora Snow Globe (3.50 RF)
     - 4.0% (400 bps): Golden Snow Crown (10.00 RF)
   - Simulated RF Ledger with full buy, play, settle, and redeem lifecycle.

#### FriendSDK Integration & Compliance
- **Identity**: Uses \`createFriendReader()\` to decode canonical Gen-1 Rare Friends sprites (Mask, Cellular, Family, etc.) with walking cycles and facings.
- **Audio**: Uses \`createFriendSoundKit()\` procedural Web Audio synthesized cues (select, purchase, action-start, impact, reveal-common, reveal-rare, reveal-legendary, reward).
- **Runtime**: Compliant with FriendSDK v0.1.2 sandbox boundaries, Robinhood Chain 4663 ownership verification, and simulated economy rules.`;

  const handleCopy = () => {
    soundManager.play('select');
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-cyan-200">Vibeathon Submission Packager</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  Ready to Submit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Submit &ldquo;Play&apos;n with Snow&rdquo; to the Rare Friends Vibeathon repository
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 min-w-[200px] py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow-md shadow-cyan-900/40 transition active:scale-98 flex items-center justify-center space-x-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Markdown Copied to Clipboard!' : 'Copy Submission Markdown'}</span>
            </button>

            <a
              href="https://github.com/spokesz/rarefriends-vibeathon/pulls"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 font-bold text-xs text-cyan-300 border border-cyan-500/40 transition flex items-center justify-center space-x-2"
            >
              <Github className="w-4 h-4" />
              <span>Open Vibeathon PRs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Checklist */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Vibeathon Submission Checklist:
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Uses official FriendSDK v0.1.2 (@rarefriends/friendsdk)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Canonical Rare Friends Gen-1 sprite decoder & renderer</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Synthesized Web Audio procedural sound cues (no external audio files)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Compliant ChanceGameDefinition (10,000 bps table, max prize reserve)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Responsive: Works on computer (desktop) and phone (touch controls)</span>
              </div>
            </div>
          </div>

          {/* Formatted Markdown Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Submission README.md Content:</span>
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-56 select-all">
              {markdownContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
