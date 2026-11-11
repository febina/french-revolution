/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MISSIONS, MissionConfig, CHARACTER_GUIDES } from './data/gameData';
import { RiftCanvas } from './components/RiftCanvas';
import { MissionModal } from './components/MissionModal';
import { soundEngine } from './audio/soundEngine';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState<number>(0);
  const [riftStability, setRiftStability] = useState<number>(100);
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [unlockedUpTo, setUnlockedUpTo] = useState<number>(1);
  const [activeMission, setActiveMission] = useState<MissionConfig | null>(null);
  const [nearbyMission, setNearbyMission] = useState<MissionConfig | null>(null);
  const [collectedShards, setCollectedShards] = useState<number[]>([]);
  const [latestToast, setLatestToast] = useState<string | null>(null);
  const [showCodexModal, setShowCodexModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleStartGame = useCallback(() => {
    soundEngine.playPortalTransition();
    setGameState('PLAYING');
  }, []);

  const handleResetGame = useCallback(() => {
    soundEngine.playPortalTransition();
    setScore(0);
    setRiftStability(100);
    setCompletedMissions([]);
    setUnlockedUpTo(1);
    setActiveMission(null);
    setNearbyMission(null);
    setCollectedShards([]);
    setLatestToast(null);
    setShowCodexModal(false);
    setGameState('PLAYING');
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  }, [isMuted]);

  // Global keyboard shortcuts for Title Screen (Enter/Space to Start) and Pause (Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (gameState === 'TITLE_MENU' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame();
      } else if (e.code === 'Escape') {
        if (activeMission) {
          soundEngine.playClick();
          setActiveMission(null);
        } else if (showCodexModal) {
          soundEngine.playClick();
          setShowCodexModal(false);
        } else if (gameState === 'PLAYING') {
          soundEngine.playClick();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          soundEngine.playClick();
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, activeMission, showCodexModal, handleStartGame]);

  const handleSelectMission = useCallback((mission: MissionConfig) => {
    setActiveMission(mission);
  }, []);

  const handleCollectShard = useCallback((shardId: number, factText: string) => {
    setCollectedShards((prev) => {
      if (prev.includes(shardId)) return prev;
      return [...prev, shardId];
    });
    setScore((prev) => prev + 50);
    setLatestToast(`${factText} (+50 PTS)`);
  }, []);

  const handleRiftDamage = useCallback(() => {
    setRiftStability((prev) => {
      const next = Math.max(0, prev - 20);
      if (next <= 0) {
        setGameState('GAME_OVER');
      }
      return next;
    });
    setLatestToast('Shadow Sentry Impact! Rift Stability -20% · Watch for their Windup Ring!');
  }, []);

  const handleCompleteMission = useCallback(
    (missionId: number, bonusPoints: number) => {
      const m = MISSIONS.find((item) => item.id === missionId);
      const isAlreadyDone = completedMissions.includes(missionId);

      if (!isAlreadyDone && m) {
        setScore((prev) => prev + m.pointsReward + bonusPoints);
        setCompletedMissions((prev) => [...prev, missionId]);
        setRiftStability((prev) => Math.min(100, prev + 15));
      }

      if (missionId >= unlockedUpTo && missionId < MISSIONS.length) {
        setUnlockedUpTo(missionId + 1);
      }

      setActiveMission(null);

      if (missionId === MISSIONS.length) {
        setGameState('VICTORY');
      } else {
        const nextM = MISSIONS.find((item) => item.id === missionId + 1);
        if (nextM) {
          setLatestToast(
            `Badge Earned: ${m?.badgeName}! Next Rift Unlocked: ${nextM.title} (${nextM.locationName})`
          );
        }
      }
    },
    [completedMissions, unlockedUpTo]
  );

  const currentObjectiveMission =
    MISSIONS.find((m) => m.id === unlockedUpTo) || MISSIONS[MISSIONS.length - 1];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090A10] select-none">
      {/* 1. Isolated 60fps Interactive Canvas World */}
      <RiftCanvas
        mode={gameState}
        completedMissions={completedMissions}
        unlockedUpTo={unlockedUpTo}
        activeMissionId={activeMission ? activeMission.id : null}
        onSelectMission={handleSelectMission}
        onCollectShard={handleCollectShard}
        onRiftDamage={handleRiftDamage}
        onNearbyMissionChange={setNearbyMission}
      />

      {/* ==================== 2. TITLE SCREEN SHELL ==================== */}
      {gameState === 'TITLE_MENU' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between px-6 py-10 pointer-events-none">
          {/* Top Atmospheric Kicker */}
          <div className="text-xs md:text-sm font-mono-tabular tracking-widest text-slate-300 uppercase">
            Grade 5 Interactive Historical Adventure · France 1789
          </div>

          {/* Centerpiece Bespoke Inline SVG Title Lockup (Preserving 35%+ negative space) */}
          <div className="max-w-3xl w-full text-center flex flex-col items-center space-y-6 pointer-events-auto">
            <div className="w-full max-w-2xl mx-auto animate-rift-glow">
              <svg
                viewBox="0 0 800 210"
                className="w-full h-auto overflow-visible"
                role="img"
                aria-label="The Upside Down: Revolution 1789"
              >
                <defs>
                  <linearGradient id="crimsonGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FCA5A5" />
                    <stop offset="45%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </linearGradient>
                  <filter id="retroNeon" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#DC2626" floodOpacity="0.85" />
                    <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#991B1B" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* Top 1980s Glowing Crimson Bar */}
                <rect
                  x="70"
                  y="18"
                  width="660"
                  height="4"
                  rx="2"
                  fill="url(#crimsonGlow)"
                  filter="url(#retroNeon)"
                />

                {/* Main Title Line */}
                <text
                  x="400"
                  y="95"
                  textAnchor="middle"
                  fill="none"
                  stroke="url(#crimsonGlow)"
                  strokeWidth="3.5"
                  filter="url(#retroNeon)"
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '68px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                  }}
                >
                  THE UPSIDE DOWN
                </text>
                <text
                  x="400"
                  y="95"
                  textAnchor="middle"
                  fill="#FEE2E2"
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '68px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                  }}
                >
                  THE UPSIDE DOWN
                </text>

                {/* Flanking Bars around Subtitle */}
                <rect
                  x="70"
                  y="128"
                  width="145"
                  height="3"
                  fill="url(#crimsonGlow)"
                  filter="url(#retroNeon)"
                />
                <rect
                  x="585"
                  y="128"
                  width="145"
                  height="3"
                  fill="url(#crimsonGlow)"
                  filter="url(#retroNeon)"
                />

                {/* Subtitle Line */}
                <text
                  x="400"
                  y="142"
                  textAnchor="middle"
                  fill="#F87171"
                  filter="url(#retroNeon)"
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '30px',
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                  }}
                >
                  REVOLUTION 1789
                </text>

                {/* Bottom Glowing Bar */}
                <rect
                  x="190"
                  y="168"
                  width="420"
                  height="3"
                  rx="1.5"
                  fill="#0EA5E9"
                  opacity="0.75"
                />
              </svg>
            </div>

            <p className="text-base md:text-lg text-slate-200 font-medium max-w-xl">
              “History has a dark side. Can you uncover the truth?”
            </p>

            <div className="pt-2 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleStartGame}
                className="px-8 py-3.5 text-base font-bold text-white bg-red-600 hover:bg-red-500 border border-red-400 rounded-lg shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                Start Game
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="text-xs md:text-sm font-mono-tabular text-slate-300 tracking-wide">
            WASD Move · Space Action · Esc Pause
          </div>
        </div>
      )}

      {/* ==================== 3. PERIMETER HUD (LOW-OCCLUSION, POINTER-EVENTS-NONE) ==================== */}
      {gameState !== 'TITLE_MENU' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-5">
          {/* Top Perimeter Bar */}
          <div className="flex items-start justify-between gap-4">
            {/* Left Cluster: Game Identity & Current Objective */}
            <div className="pointer-events-auto flex items-center gap-4 px-4 py-2.5 bg-[#0B0E17] border border-slate-800 rounded-xl shadow-lg">
              <div>
                <div className="text-xs font-bold tracking-wider text-red-400 font-display">
                  THE UPSIDE DOWN · 1789
                </div>
                <div className="text-xs text-slate-300 font-mono-tabular mt-0.5">
                  <span>Active Goal: {currentObjectiveMission.codeName}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="text-sky-300">{currentObjectiveMission.title}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPortalTransition();
                  setActiveMission(currentObjectiveMission);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Mission {currentObjectiveMission.id}
              </button>
            </div>

            {/* Right Cluster: World-Matched Telemetry & Controls */}
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-[#0B0E17] border border-slate-800 rounded-xl shadow-lg font-mono-tabular text-xs">
              {/* Rift Stability Meter (Non-Hue-Only with explicit text state) */}
              <div className="flex items-center gap-1.5 text-slate-200">
                <svg className="w-4 h-4 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" />
                </svg>
                <span>
                  Rift: {riftStability}% ({riftStability >= 60 ? 'STABLE' : 'CRITICAL'})
                </span>
              </div>

              <span className="text-slate-700" aria-hidden="true">·</span>

              {/* Missions Solved */}
              <div className="text-slate-200 whitespace-nowrap shrink-0">
                Missions: {completedMissions.length}/6
              </div>

              <span className="text-slate-700" aria-hidden="true">·</span>

              {/* Score */}
              <div className="text-amber-300 font-semibold whitespace-nowrap shrink-0">
                Score: {score}
              </div>

              <span className="text-slate-700" aria-hidden="true">·</span>

              {/* Badges & Guidebook Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowCodexModal(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-sky-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Badges ({completedMissions.length})
              </button>

              {/* Audio Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? 'Audio: Off' : 'Audio: On'}
              </button>

              {/* Pause Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setGameState('PAUSED');
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Pause
              </button>
            </div>
          </div>

          {/* Bottom Perimeter Bar: Context Action Prompt & Quick Chapter Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left Bottom: Quick Mission Selector Strip */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-[#0B0E17] border border-slate-800 rounded-xl">
              {MISSIONS.map((m) => {
                const isDone = completedMissions.includes(m.id);
                const isUnlocked = m.id <= unlockedUpTo;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      soundEngine.playPortalTransition();
                      setActiveMission(m);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-mono-tabular font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/50'
                        : isUnlocked
                        ? 'bg-red-950/90 text-red-200 border border-red-500/60 hover:bg-red-900'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {isDone ? `✓ M${m.id}` : `M${m.id}`}
                  </button>
                );
              })}
            </div>

            {/* Center/Right Bottom: Nearby Node Prompt or Latest Discovery Toast */}
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-[#0B0E17] border border-slate-800 rounded-xl text-xs font-mono-tabular">
              {nearbyMission ? (
                <div className="flex items-center gap-3">
                  <span className="text-sky-300">
                    Near {nearbyMission.codeName}: {nearbyMission.title}
                  </span>
                  {nearbyMission.id <= unlockedUpTo ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playPortalTransition();
                        setActiveMission(nearbyMission);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-md cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Investigate (Space)
                    </button>
                  ) : (
                    <span className="text-slate-500">Complete previous mission first</span>
                  )}
                </div>
              ) : latestToast ? (
                <div className="text-amber-300">{latestToast}</div>
              ) : (
                <div className="text-slate-400">
                  Move with WASD / Arrows or Click any Red Rift Node · Shards Found: {collectedShards.length}/5
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. ACTIVE MISSION MODAL ==================== */}
      {activeMission && (
        <MissionModal
          mission={activeMission}
          isAlreadyCompleted={completedMissions.includes(activeMission.id)}
          onCompleteMission={handleCompleteMission}
          onClose={() => setActiveMission(null)}
        />
      )}

      {/* ==================== 5. BADGES & CHARACTER CODEX MODAL ==================== */}
      {showCodexModal && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl bg-[#0D101B] border border-slate-800 rounded-xl p-6 space-y-6 text-slate-100 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono-tabular text-sky-400">
                  Detective Dossier · Progress & Character Guides
                </div>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  Earned Badges & 1789 Field Guides
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCodexModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Earned Badges Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300">
                Mission Badges ({completedMissions.length} / {MISSIONS.length} Unlocked)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {MISSIONS.map((m) => {
                  const earned = completedMissions.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border ${
                        earned
                          ? 'bg-[#131C2B] border-emerald-500/60'
                          : 'bg-[#0A0D16] border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="text-xs font-mono-tabular text-emerald-400">
                        {earned ? '★ UNLOCKED' : 'LOCKED'} · {m.codeName}
                      </div>
                      <div className="font-bold text-sm text-white mt-1">
                        {m.badgeName}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {m.badgeDescription}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Era Guides */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300">
                Historical Character Guides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(CHARACTER_GUIDES).map((char) => (
                  <div
                    key={char.id}
                    className="p-3.5 rounded-xl bg-[#121626] border border-slate-800 flex items-center gap-3.5"
                  >
                    <img
                      src={char.portraitUrl}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-sm text-white">{char.name}</div>
                      <div className="text-xs text-sky-400">{char.role}</div>
                      <div className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                        {char.era}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. PAUSE / VICTORY / GAME OVER MODALS ==================== */}
      {(gameState === 'PAUSED' || gameState === 'VICTORY' || gameState === 'GAME_OVER') && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#0D101B] border border-slate-800 rounded-xl p-7 text-center space-y-6 shadow-2xl">
            {gameState === 'PAUSED' && (
              <>
                <div className="text-xs font-mono-tabular text-sky-400">
                  Simulation Paused
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Investigation Paused
                </h2>
                <p className="text-sm text-slate-300">
                  Use WASD or Arrow keys to move Leo across 1789 France, or click directly on any unlocked red Mission Node to enter its investigation.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setGameState('PLAYING');
                    }}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
                  >
                    Resume Game
                  </button>
                  <button
                    type="button"
                    onClick={handleResetGame}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                  >
                    Restart Campaign
                  </button>
                </div>
              </>
            )}

            {gameState === 'VICTORY' && (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-2xl text-emerald-300">
                  ★
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono-tabular text-emerald-400">
                    All 6 Rift Chapters Completed · Portal Home Unlocked!
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Truth Uncovered: Master of 1789!
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    You uncovered the Three Estates, audited the unfair Versailles taxes, solved the 1789 Bread Shortage, decoded the Tennis Court Oath, survived the Storming of the Bastille, and restored the Declaration of the Rights of Man!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-[#121626] border border-slate-800 rounded-xl font-mono-tabular">
                  <div>
                    <div className="text-xs text-slate-400">Final Score</div>
                    <div className="text-lg font-bold text-amber-300">{score}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Badges Earned</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {completedMissions.length}/6
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Lore Shards</div>
                    <div className="text-lg font-bold text-sky-400">
                      {collectedShards.length}/5
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetGame}
                  className="px-8 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  Play Again
                </button>
              </>
            )}

            {gameState === 'GAME_OVER' && (
              <>
                <div className="text-xs font-mono-tabular text-red-400">
                  Rift Stability Depleted
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Lost in the Upside Down of 1789
                </h2>
                <p className="text-sm text-slate-300">
                  The patrolling Shadow Sentries destabilized your temporal compass! Watch for their amber windup ring before they dash.
                </p>
                <div className="p-4 bg-[#121626] border border-slate-800 rounded-xl font-mono-tabular text-sm text-slate-200">
                  Score Reached: <span className="text-amber-300 font-bold">{score}</span> · Missions Solved: {completedMissions.length}/6
                </div>
                <button
                  type="button"
                  onClick={handleResetGame}
                  className="px-8 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  Play Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
