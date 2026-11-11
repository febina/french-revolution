import React, { useEffect, useRef } from 'react';
import { MISSIONS, MissionConfig, HERO_PORTAL_IMAGE } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface RiftCanvasProps {
  mode: 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';
  completedMissions: number[];
  unlockedUpTo: number;
  activeMissionId: number | null;
  onSelectMission: (mission: MissionConfig) => void;
  onCollectShard: (shardId: number, factText: string) => void;
  onRiftDamage: () => void;
  onNearbyMissionChange: (mission: MissionConfig | null) => void;
}

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface BurstParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface LoreShard {
  id: number;
  xNorm: number;
  yNorm: number;
  collected: boolean;
  fact: string;
}

interface ShadowSentry {
  xNorm: number;
  yNorm: number;
  baseX: number;
  baseY: number;
  rangeX: number;
  rangeY: number;
  speed: number;
  phase: number;
  windupTimer: number;
  isDashing: boolean;
}

const INITIAL_SHARDS: LoreShard[] = [
  {
    id: 101,
    xNorm: 0.24,
    yNorm: 0.50,
    collected: false,
    fact: 'Rift Shard #1: France had 26 million people in 1789—97% belonged to the Third Estate!',
  },
  {
    id: 102,
    xNorm: 0.40,
    yNorm: 0.52,
    collected: false,
    fact: 'Rift Shard #2: The Gabelle was a hated tax on salt that only the Third Estate had to pay.',
  },
  {
    id: 103,
    xNorm: 0.56,
    yNorm: 0.49,
    collected: false,
    fact: 'Rift Shard #3: By July 1789, a single loaf of bread cost nearly a whole month of savings!',
  },
  {
    id: 104,
    xNorm: 0.71,
    yNorm: 0.48,
    collected: false,
    fact: 'Rift Shard #4: The tricolor cockade combined Paris colors (red & blue) with royal white.',
  },
  {
    id: 105,
    xNorm: 0.84,
    yNorm: 0.51,
    collected: false,
    fact: 'Rift Shard #5: July 14 is celebrated every year as Bastille Day, France’s National Holiday!',
  },
];

export const RiftCanvas: React.FC<RiftCanvasProps> = React.memo(
  ({
    mode,
    completedMissions,
    unlockedUpTo,
    activeMissionId,
    onSelectMission,
    onCollectShard,
    onRiftDamage,
    onNearbyMissionChange,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Keep latest props in refs so the 60fps loop never restarts on React state updates
    const stateRef = useRef({
      mode,
      completedMissions,
      unlockedUpTo,
      activeMissionId,
      onSelectMission,
      onCollectShard,
      onRiftDamage,
      onNearbyMissionChange,
    });

    useEffect(() => {
      stateRef.current = {
        mode,
        completedMissions,
        unlockedUpTo,
        activeMissionId,
        onSelectMission,
        onCollectShard,
        onRiftDamage,
        onNearbyMissionChange,
      };
    }, [
      mode,
      completedMissions,
      unlockedUpTo,
      activeMissionId,
      onSelectMission,
      onCollectShard,
      onRiftDamage,
      onNearbyMissionChange,
    ]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      let lastTime = performance.now();

      // Load background hero art for subtle atmospheric blending
      const bgImg = new Image();
      bgImg.src = HERO_PORTAL_IMAGE;
      let bgLoaded = false;
      bgImg.onload = () => {
        bgLoaded = true;
      };

      // Player state in normalized coordinates (0..1)
      const player = {
        x: MISSIONS[0].mapX,
        y: MISSIONS[0].mapY + 0.06,
        vx: 0,
        vy: 0,
        targetX: null as number | null,
        targetY: null as number | null,
        facingAngle: -Math.PI / 4,
        scaleX: 1,
        scaleY: 1,
        invulnTimer: 0,
      };

      // Simulation feel state
      let hitstopTimer = 0;
      let shakeIntensity = 0;
      let hitFlashAlpha = 0;
      let lastNearbyId: number | null = null;
      let cameraPanTime = 0;

      // Input state: separated continuous held vs edge-triggered justPressed
      const heldKeys = new Set<string>();
      const justPressedKeys = new Set<string>();

      const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in an input field
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        const code = e.code;
        if (!heldKeys.has(code)) {
          justPressedKeys.add(code);
        }
        heldKeys.add(code);
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        heldKeys.delete(e.code);
      };

      const handleWindowBlur = () => {
        heldKeys.clear();
        justPressedKeys.clear();
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleWindowBlur);

      // Resize observer
      const updateSize = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      updateSize();
      window.addEventListener('resize', updateSize);

      // Ambient upside-down ember particles
      const embers: EmberParticle[] = Array.from({ length: 75 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 18,
        vy: -12 - Math.random() * 24,
        size: 1.5 + Math.random() * 2.8,
        alpha: 0.25 + Math.random() * 0.65,
        color: Math.random() > 0.28 ? '#EF4444' : '#38BDF8',
      }));

      // Pooled burst particles (60 pool size)
      const burstPool: BurstParticle[] = Array.from({ length: 60 }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.6,
        size: 3,
        color: '#EF4444',
      }));

      const spawnBurst = (px: number, py: number, color: string, count: number = 18) => {
        let spawned = 0;
        for (let i = 0; i < burstPool.length && spawned < count; i++) {
          if (!burstPool[i].active) {
            const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.3;
            const speed = 45 + Math.random() * 130;
            burstPool[i].active = true;
            burstPool[i].x = px;
            burstPool[i].y = py;
            burstPool[i].vx = Math.cos(angle) * speed;
            burstPool[i].vy = Math.sin(angle) * speed;
            burstPool[i].life = 0;
            burstPool[i].maxLife = 0.35 + Math.random() * 0.35;
            burstPool[i].size = 2.5 + Math.random() * 3.5;
            burstPool[i].color = color;
            spawned++;
          }
        }
      };

      // Collectible Historical Shards on map
      const shards: LoreShard[] = INITIAL_SHARDS.map((s) => ({ ...s }));

      // 2 Patrolling Shadow Sentries with visible windup telegraphs
      const sentries: ShadowSentry[] = [
        {
          xNorm: 0.39,
          yNorm: 0.52,
          baseX: 0.39,
          baseY: 0.52,
          rangeX: 0.0,
          rangeY: 0.14,
          speed: 1.2,
          phase: 0,
          windupTimer: 0,
          isDashing: false,
        },
        {
          xNorm: 0.70,
          yNorm: 0.48,
          baseX: 0.70,
          baseY: 0.48,
          rangeX: 0.0,
          rangeY: 0.15,
          speed: 1.45,
          phase: 2.1,
          windupTimer: 0,
          isDashing: false,
        },
      ];

      // Click / Pointer interaction on Canvas
      const handleCanvasPointerDown = (e: MouseEvent) => {
        const st = stateRef.current;
        if (st.mode !== 'PLAYING' || st.activeMissionId !== null) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const normX = clickX / canvas.width;
        const normY = clickY / canvas.height;

        // Check if user clicked directly on an unlocked Mission Node
        for (const m of MISSIONS) {
          const dx = (m.mapX - normX) * canvas.width;
          const dy = (m.mapY - normY) * canvas.height;
          const dist = Math.hypot(dx, dy);
          if (dist < 44) {
            if (m.id <= st.unlockedUpTo) {
              soundEngine.playPortalTransition();
              spawnBurst(m.mapX * canvas.width, m.mapY * canvas.height, '#EF4444', 22);
              player.x = m.mapX;
              player.y = m.mapY + 0.04;
              player.targetX = null;
              player.targetY = null;
              st.onSelectMission(m);
            } else {
              soundEngine.playHazardHit();
              shakeIntensity = 6;
            }
            return;
          }
        }

        // Otherwise move player toward clicked point
        player.targetX = Math.max(0.06, Math.min(0.94, normX));
        player.targetY = Math.max(0.14, Math.min(0.88, normY));
        player.scaleX = 1.18;
        player.scaleY = 0.84;
        soundEngine.playClick();
        spawnBurst(clickX, clickY, '#38BDF8', 8);
      };

      canvas.addEventListener('mousedown', handleCanvasPointerDown);

      // Main 60fps Loop
      const loop = (now: number) => {
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;
        const dt = Math.min(rawDt, 0.05); // Mandatory clamp

        const st = stateRef.current;
        const w = canvas.width;
        const h = canvas.height;

        // Hitstop freeze handling
        if (hitstopTimer > 0) {
          hitstopTimer -= dt;
          animationFrameId = requestAnimationFrame(loop);
          return;
        }

        cameraPanTime += dt;

        // Decay camera shake & flash
        if (shakeIntensity > 0) {
          shakeIntensity = Math.max(0, shakeIntensity - dt * 28);
        }
        if (hitFlashAlpha > 0) {
          hitFlashAlpha = Math.max(0, hitFlashAlpha - dt * 2.8);
        }
        if (player.invulnTimer > 0) {
          player.invulnTimer = Math.max(0, player.invulnTimer - dt);
        }

        // Recover player squash & stretch smoothly
        player.scaleX += (1 - player.scaleX) * Math.min(1, dt * 14);
        player.scaleY += (1 - player.scaleY) * Math.min(1, dt * 14);

        // Process player movement when in PLAYING overworld mode (and no modal open)
        if (st.mode === 'PLAYING' && st.activeMissionId === null) {
          let moveX = 0;
          let moveY = 0;
          if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) moveY -= 1;
          if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) moveY += 1;
          if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) moveX -= 1;
          if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) moveX += 1;

          const moveSpeed = 0.24; // Normalized units per sec

          if (moveX !== 0 || moveY !== 0) {
            player.targetX = null;
            player.targetY = null;
            const len = Math.hypot(moveX, moveY);
            const nx = moveX / len;
            const ny = moveY / len;
            player.x = Math.max(0.06, Math.min(0.94, player.x + nx * moveSpeed * dt));
            player.y = Math.max(0.14, Math.min(0.88, player.y + ny * moveSpeed * dt));
            player.facingAngle = Math.atan2(ny * h, nx * w);
          } else if (player.targetX !== null && player.targetY !== null) {
            const dx = player.targetX - player.x;
            const dy = player.targetY - player.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 0.008) {
              player.targetX = null;
              player.targetY = null;
            } else {
              const step = Math.min(dist, moveSpeed * dt);
              player.x += (dx / dist) * step;
              player.y += (dy / dist) * step;
              player.facingAngle = Math.atan2(dy * h, dx * w);
            }
          }

          // Check proximity to Mission Nodes
          let closestMission: MissionConfig | null = null;
          let minDist = Infinity;
          for (const m of MISSIONS) {
            const dx = (m.mapX - player.x) * w;
            const dy = (m.mapY - player.y) * h;
            const d = Math.hypot(dx, dy);
            if (d < 68 && d < minDist) {
              minDist = d;
              closestMission = m;
            }
          }

          const nearbyId = closestMission ? closestMission.id : null;
          if (nearbyId !== lastNearbyId) {
            lastNearbyId = nearbyId;
            st.onNearbyMissionChange(closestMission);
          }

          // Edge-triggered Space / Enter to enter nearby unlocked mission
          if (
            (justPressedKeys.has('Space') || justPressedKeys.has('Enter')) &&
            closestMission
          ) {
            if (closestMission.id <= st.unlockedUpTo) {
              player.scaleX = 0.78;
              player.scaleY = 1.28;
              soundEngine.playPortalTransition();
              spawnBurst(closestMission.mapX * w, closestMission.mapY * h, '#EF4444', 24);
              st.onSelectMission(closestMission);
            } else {
              soundEngine.playHazardHit();
              shakeIntensity = 7;
            }
          }

          // Check Collectible Lore Shards
          for (const shard of shards) {
            if (!shard.collected) {
              const dx = (shard.xNorm - player.x) * w;
              const dy = (shard.yNorm - player.y) * h;
              if (Math.hypot(dx, dy) < 34) {
                shard.collected = true;
                player.scaleX = 1.24;
                player.scaleY = 0.80;
                soundEngine.playSuccess();
                spawnBurst(shard.xNorm * w, shard.yNorm * h, '#F59E0B', 20);
                st.onCollectShard(shard.id, shard.fact);
              }
            }
          }

          // Update Shadow Sentries with Windup Telegraph
          for (const s of sentries) {
            s.windupTimer += dt;
            const cycle = s.windupTimer % 3.2;
            s.isDashing = cycle > 2.2;
            const mult = s.isDashing ? 2.4 : 0.7;
            s.phase += dt * s.speed * mult;
            s.xNorm = s.baseX + Math.cos(s.phase) * s.rangeX;
            s.yNorm = s.baseY + Math.sin(s.phase) * s.rangeY;

            if (player.invulnTimer <= 0) {
              const dx = (s.xNorm - player.x) * w;
              const dy = (s.yNorm - player.y) * h;
              if (Math.hypot(dx, dy) < 30) {
                // Trigger weight-scaled hitstop, camera shake, hit flash, and audio
                player.invulnTimer = 1.8;
                player.scaleX = 1.35;
                player.scaleY = 0.68;
                hitstopTimer = 0.055; // 55ms hitstop
                shakeIntensity = 12;
                hitFlashAlpha = 0.42;
                soundEngine.playHazardHit();
                spawnBurst(player.x * w, player.y * h, '#DC2626', 24);
                st.onRiftDamage();
              }
            }
          }
        }

        justPressedKeys.clear();

        // ==================== RENDERING ====================
        ctx.save();

        // Apply decaying camera shake
        if (shakeIntensity > 0) {
          const sx = (Math.random() - 0.5) * shakeIntensity * 2;
          const sy = (Math.random() - 0.5) * shakeIntensity * 2;
          ctx.translate(sx, sy);
        }

        // 1. Deep Upside-Down Night Void Base
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#07080D');
        skyGrad.addColorStop(0.5, '#0F111C');
        skyGrad.addColorStop(1, '#090A10');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Subtle live-world camera pan over the Paris 1789 Rift artwork
        if (bgLoaded) {
          ctx.save();
          const panOffsetX = Math.sin(cameraPanTime * 0.18) * 18;
          const panOffsetY = Math.cos(cameraPanTime * 0.14) * 10;
          ctx.globalAlpha = st.mode === 'TITLE_MENU' ? 0.52 : 0.24;
          const scale = Math.max(w / bgImg.width, h / bgImg.height) * 1.06;
          const drawW = bgImg.width * scale;
          const drawH = bgImg.height * scale;
          ctx.drawImage(
            bgImg,
            (w - drawW) / 2 + panOffsetX,
            (h - drawH) / 2 + panOffsetY,
            drawW,
            drawH
          );
          ctx.restore();
        }

        // 3. Atmospheric Crimson Rift Glow in the upper center
        const riftGrad = ctx.createRadialGradient(
          w * 0.52 + Math.sin(cameraPanTime * 0.5) * 25,
          h * 0.22,
          10,
          w * 0.52,
          h * 0.25,
          Math.max(w, h) * 0.55
        );
        riftGrad.addColorStop(0, 'rgba(220, 38, 38, 0.34)');
        riftGrad.addColorStop(0.45, 'rgba(153, 27, 27, 0.12)');
        riftGrad.addColorStop(1, 'rgba(9, 10, 16, 0)');
        ctx.fillStyle = riftGrad;
        ctx.fillRect(0, 0, w, h);

        // 4. Electric Blue Lantern Rim Glow in lower left/right
        const blueGrad = ctx.createRadialGradient(
          w * 0.18,
          h * 0.72,
          10,
          w * 0.18,
          h * 0.72,
          w * 0.42
        );
        blueGrad.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
        blueGrad.addColorStop(1, 'rgba(9, 10, 16, 0)');
        ctx.fillStyle = blueGrad;
        ctx.fillRect(0, 0, w, h);

        // 5. If in PLAYING mode, render the 1789 France Interactive Map Network
        if (st.mode !== 'TITLE_MENU') {
          // Subtle topographic grid lines
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
          ctx.lineWidth = 1;
          const gridStep = 64;
          for (let gx = 0; gx < w; gx += gridStep) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
          }
          for (let gy = 0; gy < h; gy += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
          }

          // Seine River winding silhouette across the map
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, h * 0.58);
          ctx.bezierCurveTo(w * 0.28, h * 0.42, w * 0.55, h * 0.64, w, h * 0.48);
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.11)';
          ctx.lineWidth = 34;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Cobblestone / Rift paths connecting the 6 Mission Nodes
          for (let i = 0; i < MISSIONS.length - 1; i++) {
            const m1 = MISSIONS[i];
            const m2 = MISSIONS[i + 1];
            const x1 = m1.mapX * w;
            const y1 = m1.mapY * h;
            const x2 = m2.mapX * w;
            const y2 = m2.mapY * h;
            const isUnlockedPath = m2.id <= st.unlockedUpTo;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isUnlockedPath
              ? 'rgba(220, 38, 38, 0.55)'
              : 'rgba(100, 116, 139, 0.22)';
            ctx.lineWidth = isUnlockedPath ? 3.5 : 2;
            if (!isUnlockedPath) {
              ctx.setLineDash([8, 8]);
            }
            ctx.stroke();
            ctx.restore();
          }

          // Render Collectible Historical Shards
          for (const shard of shards) {
            if (!shard.collected) {
              const sx = shard.xNorm * w;
              const sy = shard.yNorm * h + Math.sin(cameraPanTime * 3.2 + shard.id) * 5;

              ctx.save();
              ctx.translate(sx, sy);
              ctx.rotate(cameraPanTime * 1.2);
              ctx.fillStyle = '#F59E0B';
              ctx.strokeStyle = '#FEF3C7';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(0, -10);
              ctx.lineTo(8, 0);
              ctx.lineTo(0, 10);
              ctx.lineTo(-8, 0);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();

              ctx.fillStyle = 'rgba(254, 243, 199, 0.78)';
              ctx.font = '600 10px "IBM Plex Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('LORE SHARD', sx, sy + 22);
            }
          }

          // Render Patrolling Shadow Rift Sentries with visible Windup Telegraph
          for (const s of sentries) {
            const sx = s.xNorm * w;
            const sy = s.yNorm * h;
            const cycle = s.windupTimer % 3.2;
            const isWindingUp = cycle > 1.5 && cycle <= 2.2;

            ctx.save();
            // Telegraph warning ring when winding up
            if (isWindingUp || s.isDashing) {
              ctx.beginPath();
              ctx.arc(
                sx,
                sy,
                isWindingUp ? 22 + Math.sin(cameraPanTime * 25) * 4 : 26,
                0,
                Math.PI * 2
              );
              ctx.strokeStyle = s.isDashing
                ? 'rgba(239, 68, 68, 0.9)'
                : 'rgba(245, 158, 11, 0.75)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            // Shadow Sentry core
            ctx.beginPath();
            ctx.arc(sx, sy, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#18181B';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = s.isDashing ? '#EF4444' : '#DC2626';
            ctx.stroke();

            // Glowing red eye
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fillStyle = s.isDashing ? '#FCA5A5' : '#EF4444';
            ctx.fill();

            ctx.fillStyle = 'rgba(248, 113, 113, 0.75)';
            ctx.font = '600 10px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
              isWindingUp ? '▲ WINDUP!' : 'RIFT SHADOW',
              sx,
              sy - 18
            );
            ctx.restore();
          }

          // Render the 6 Historical Mission Nodes
          for (const m of MISSIONS) {
            const mx = m.mapX * w;
            const my = m.mapY * h;
            const isCompleted = st.completedMissions.includes(m.id);
            const isUnlocked = m.id <= st.unlockedUpTo;
            const isCurrentTarget = m.id === st.unlockedUpTo && !isCompleted;

            ctx.save();
            // Pulsing outer ring for current target mission
            if (isCurrentTarget) {
              const pulseRadius = 32 + Math.sin(cameraPanTime * 4) * 6;
              ctx.beginPath();
              ctx.arc(mx, my, pulseRadius, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(220, 38, 38, 0.65)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            // Node base circle
            ctx.beginPath();
            ctx.arc(mx, my, 24, 0, Math.PI * 2);
            ctx.fillStyle = isCompleted
              ? '#064E3B'
              : isUnlocked
              ? '#450A0A'
              : '#0F172A';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = isCompleted
              ? '#10B981'
              : isUnlocked
              ? '#EF4444'
              : '#334155';
            ctx.stroke();

            // Mission number inside node
            ctx.fillStyle = isCompleted
              ? '#A7F3D0'
              : isUnlocked
              ? '#FEE2E2'
              : '#64748B';
            ctx.font = '700 14px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isCompleted ? `✓${m.id}` : `0${m.id}`, mx, my);

            // Mission Title & Historical Date label under node
            ctx.font = '700 13px "Cinzel", Georgia, serif';
            ctx.fillStyle = isUnlocked ? '#F8FAFC' : '#64748B';
            ctx.fillText(m.title, mx, my + 38);

            ctx.font = '500 11px "IBM Plex Mono", monospace';
            ctx.fillStyle = isCompleted
              ? '#34D399'
              : isUnlocked
              ? '#F87171'
              : '#475569';
            ctx.fillText(
              `${m.dateLabel} · ${
                isCompleted ? 'SOLVED' : isUnlocked ? 'OPEN RIFT' : 'LOCKED'
              }`,
              mx,
              my + 54
            );
            ctx.restore();
          }

          // Render Player Avatar (Leo with Flashlight Cone & Squash-and-Stretch)
          const px = player.x * w;
          const py = player.y * h;

          ctx.save();
          ctx.translate(px, py);

          // Flashlight directional cone
          ctx.save();
          ctx.rotate(player.facingAngle);
          const coneGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 125);
          coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 125, -0.38, 0.38);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Apply squash-and-stretch
          ctx.scale(player.scaleX, player.scaleY);

          // Blink if invulnerable after touching a shadow sentry
          if (player.invulnTimer > 0 && Math.floor(player.invulnTimer * 12) % 2 === 0) {
            ctx.globalAlpha = 0.45;
          }

          // Detective Cloak / Body
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fillStyle = '#0284C7';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#E0F2FE';
          ctx.stroke();

          // Compass core
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF8';
          ctx.fill();

          ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#E0F2FE';
          ctx.textAlign = 'center';
          ctx.fillText('LEO (YOU)', 0, -22);
          ctx.restore();
        }

        // 6. Floating Upside-Down Ash & Crimson Embers (All Modes)
        for (const e of embers) {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          if (e.y < -10) {
            e.y = h + 10;
            e.x = Math.random() * w;
          }
          if (e.x < -10) e.x = w + 10;
          if (e.x > w + 10) e.x = -10;

          ctx.save();
          ctx.globalAlpha = e.alpha * (0.65 + 0.35 * Math.sin(cameraPanTime * 2 + e.x));
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 7. Pooled Burst Particles
        for (const bp of burstPool) {
          if (bp.active) {
            bp.life += dt;
            if (bp.life >= bp.maxLife) {
              bp.active = false;
            } else {
              bp.x += bp.vx * dt;
              bp.y += bp.vy * dt;
              const progress = 1 - bp.life / bp.maxLife;
              ctx.save();
              ctx.globalAlpha = progress;
              ctx.fillStyle = bp.color;
              ctx.beginPath();
              ctx.arc(bp.x, bp.y, bp.size * progress, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        // 8. Hit Flash Overlay
        if (hitFlashAlpha > 0) {
          ctx.fillStyle = `rgba(220, 38, 38, ${hitFlashAlpha})`;
          ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
        animationFrameId = requestAnimationFrame(loop);
      };

      animationFrameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('resize', updateSize);
        canvas.removeEventListener('mousedown', handleCanvasPointerDown);
      };
    }, []);

    return (
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#090A10]">
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
        />
      </div>
    );
  }
);
