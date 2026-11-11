import React, { useState, useEffect } from 'react';
import {
  MissionConfig,
  CHARACTER_GUIDES,
  MISSION_1_CARDS,
  MISSION_3_CLUES,
  MISSION_5_DECISIONS,
  MISSION_6_TIMELINE,
  TimelineEventItem,
} from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';

interface MissionModalProps {
  mission: MissionConfig;
  isAlreadyCompleted: boolean;
  onCompleteMission: (missionId: number, bonusPoints: number) => void;
  onClose: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  mission,
  isAlreadyCompleted,
  onCompleteMission,
  onClose,
}) => {
  const [stage, setStage] = useState<'BRIEFING' | 'CHALLENGE' | 'COMPLETED'>('BRIEFING');
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [inspectedFacts, setInspectedFacts] = useState<number[]>([0]);
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  // Mission 1 State: Estate Matching
  const [estateAssignments, setEstateAssignments] = useState<Record<string, 'first' | 'second' | 'third'>>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(MISSION_1_CARDS[0].id);

  // Mission 2 State: Tax Ledger & Detective Questions
  const [taxPayers, setTaxPayers] = useState<{
    taille: 'first_second' | 'third' | null;
    gabelle: 'first_second' | 'third' | null;
    tithe: 'first_second' | 'third' | null;
  }>({ taille: null, gabelle: null, tithe: null });
  const [m2DetectiveChoice, setM2DetectiveChoice] = useState<string | null>(null);

  // Mission 3 State: Hidden-Object Flashlight Investigation
  const [flashlightPos, setFlashlightPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [foundClueIds, setFoundClueIds] = useState<string[]>([]);
  const [m3SummaryChoice, setM3SummaryChoice] = useState<string | null>(null);

  // Mission 4 State: Tennis Court Cipher & Password
  const [cipherShift, setCipherShift] = useState<number>(3);
  const [decodedInput, setDecodedInput] = useState<string>('');
  const [assemblyChoice, setAssemblyChoice] = useState<string | null>(null);

  // Mission 5 State: Bastille Decision Challenge
  const [bastilleStep, setBastilleStep] = useState<number>(0);
  const [bastilleSelectedOpt, setBastilleSelectedOpt] = useState<string | null>(null);
  const [bastilleSolvedSteps, setBastilleSolvedSteps] = useState<number>(0);

  // Mission 6 State: Chronological Timeline Ordering
  const [timelineItems, setTimelineItems] = useState<TimelineEventItem[]>(() => [
    MISSION_6_TIMELINE[3],
    MISSION_6_TIMELINE[0],
    MISSION_6_TIMELINE[4],
    MISSION_6_TIMELINE[1],
    MISSION_6_TIMELINE[5],
    MISSION_6_TIMELINE[2],
  ]);
  const [declarationChoice, setDeclarationChoice] = useState<string | null>(null);

  // Countdown timer during CHALLENGE stage for bonus points
  useEffect(() => {
    if (stage !== 'CHALLENGE') return;
    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  const currentDialogue = mission.dialogueIntro[dialogueIdx] || mission.dialogueIntro[0];
  const currentSpeaker = CHARACTER_GUIDES[currentDialogue.speakerId];

  const handleNextDialogue = () => {
    soundEngine.playVoiceBleep(currentSpeaker.voicePitch);
    if (dialogueIdx < mission.dialogueIntro.length - 1) {
      setDialogueIdx(dialogueIdx + 1);
    }
  };

  const handleInspectFact = (idx: number) => {
    soundEngine.playClick();
    if (!inspectedFacts.includes(idx)) {
      setInspectedFacts([...inspectedFacts, idx]);
    }
  };

  const triggerSuccessCompletion = () => {
    soundEngine.playSuccess();
    setStage('COMPLETED');
  };

  // Verify Mission 1: Estates Matching
  const handleVerifyMission1 = () => {
    const totalAssigned = Object.keys(estateAssignments).length;
    if (totalAssigned < MISSION_1_CARDS.length) {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: `Assign all ${MISSION_1_CARDS.length} citizen cards into an Estate first (${totalAssigned}/${MISSION_1_CARDS.length} placed).`,
        type: 'error',
      });
      return;
    }

    const wrongCard = MISSION_1_CARDS.find(
      (c) => estateAssignments[c.id] !== c.correctEstate
    );
    if (wrongCard) {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: `Check "${wrongCard.label}" again! Remember: 1st Estate = Clergy, 2nd Estate = Nobility, 3rd Estate = Everyone else (peasants, bakers, doctors, lawyers).`,
        type: 'error',
      });
      return;
    }

    triggerSuccessCompletion();
  };

  // Verify Mission 2: Kingdom of Inequality
  const handleVerifyMission2 = () => {
    if (
      taxPayers.taille !== 'third' ||
      taxPayers.gabelle !== 'third' ||
      taxPayers.tithe !== 'third'
    ) {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'Inspect the Royal Tax Ledger! In 1789 France, the First and Second Estates were exempt—the Third Estate had to pay the Taille, the Gabelle, AND the Tithe.',
        type: 'error',
      });
      return;
    }
    if (m2DetectiveChoice !== 'correct-inequality') {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'Select the correct detective conclusion explaining why the Third Estate was unhappy.',
        type: 'error',
      });
      return;
    }
    triggerSuccessCompletion();
  };

  // Verify Mission 3: Missing Bread
  const handleVerifyMission3 = () => {
    if (foundClueIds.length < MISSION_3_CLUES.length) {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: `Move your flashlight across the dark bakery to uncover all 4 hidden clues (${foundClueIds.length}/4 found).`,
        type: 'error',
      });
      return;
    }
    if (m3SummaryChoice !== 'correct-bread') {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'Choose the correct historical conclusion based on the 4 clues you uncovered!',
        type: 'error',
      });
      return;
    }
    triggerSuccessCompletion();
  };

  // Verify Mission 4: Secret Meeting & Cipher
  const handleVerifyMission4 = () => {
    const cleanCode = decodedInput.trim().toUpperCase();
    if (cleanCode !== 'CONSTITUTION') {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'Decode the secret 12-letter word! Use the Cipher Key (Shift = 0) or type CONSTITUTION—the fair law book promised in the Tennis Court Oath.',
        type: 'error',
      });
      return;
    }
    if (assemblyChoice !== 'national-assembly') {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'Select the name of the new assembly formed by the Third Estate on June 17, 1789.',
        type: 'error',
      });
      return;
    }
    triggerSuccessCompletion();
  };

  // Verify Mission 5: Step-by-Step Bastille Decisions
  const handleVerifyMission5Step = () => {
    const currentDecision = MISSION_5_DECISIONS[bastilleStep];
    const chosen = currentDecision.options.find((o) => o.id === bastilleSelectedOpt);
    if (!chosen) {
      soundEngine.playHazardHit();
      setFeedbackMsg({ text: 'Choose a historical decision to proceed!', type: 'error' });
      return;
    }

    if (!chosen.isCorrect) {
      soundEngine.playHazardHit();
      setFeedbackMsg({ text: chosen.feedback, type: 'error' });
      return;
    }

    soundEngine.playSuccess();
    setFeedbackMsg({ text: chosen.feedback, type: 'success' });
    const nextStep = bastilleStep + 1;
    setBastilleSolvedSteps(nextStep);

    if (nextStep >= MISSION_5_DECISIONS.length) {
      setTimeout(() => {
        triggerSuccessCompletion();
      }, 650);
    } else {
      setBastilleStep(nextStep);
      setBastilleSelectedOpt(null);
    }
  };

  // Verify Mission 6: Chronological Timeline
  const moveTimelineItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= timelineItems.length) return;
    soundEngine.playClick();
    const copy = [...timelineItems];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setTimelineItems(copy);
  };

  const handleVerifyMission6 = () => {
    const isOrdered = timelineItems.every(
      (item, idx) => item.chronologicalOrder === idx + 1
    );
    if (!isOrdered) {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'The timeline is still out of order! Look carefully at the dates from Summer 1788 -> May 1789 -> June 17 -> June 20 -> July 14 -> August 26, 1789.',
        type: 'error',
      });
      return;
    }
    if (declarationChoice !== 'free-and-equal') {
      soundEngine.playHazardHit();
      setFeedbackMsg({
        text: 'Select the core message of the Declaration of the Rights of Man and of the Citizen!',
        type: 'error',
      });
      return;
    }
    triggerSuccessCompletion();
  };

  // Helper to shift letters for Mission 4 Caesar Cipher visual
  const getCipherPreview = (word: string, shift: number) => {
    return word
      .split('')
      .map((ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + shift) % 26) + 65);
        }
        return ch;
      })
      .join(' ');
  };

  const bonusPoints = Math.min(150, Math.floor(timeRemaining * 1.25));

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 md:p-6 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-modal-title"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0D101B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[#090A10] border-b border-slate-800">
          <div>
            <div className="text-xs text-slate-400 font-mono-tabular">
              <span>{mission.codeName}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{mission.locationName}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="text-red-400">{mission.dateLabel}</span>
            </div>
            <h2
              id="mission-modal-title"
              className="text-xl md:text-2xl font-bold text-slate-50 tracking-wide mt-0.5"
            >
              {mission.title}
            </h2>
          </div>

          {/* Interactive Stage Switcher & Close */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage('BRIEFING');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  stage === 'BRIEFING'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Historical Briefing
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage('CHALLENGE');
                  setFeedbackMsg(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  stage === 'CHALLENGE'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Detective Challenge
              </button>
            </div>

            {stage === 'CHALLENGE' && (
              <div className="text-xs font-mono-tabular text-sky-400 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg whitespace-nowrap shrink-0">
                Bonus Timer: {timeRemaining}s
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Return to Map
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ==================== STAGE 1: HISTORICAL BRIEFING (TEACH FIRST) ==================== */}
          {stage === 'BRIEFING' && (
            <div className="space-y-6">
              {/* Character Conversation Box */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-[#121626] border border-slate-800 rounded-xl items-center">
                <div className="md:col-span-3 flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                    {!imgErrorMap[currentSpeaker.id] ? (
                      <img
                        src={currentSpeaker.portraitUrl}
                        alt={currentSpeaker.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrorMap((prev) => ({ ...prev, [currentSpeaker.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-sky-400 font-display text-2xl font-bold">
                        {currentSpeaker.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 font-semibold text-sm text-white">
                    {currentSpeaker.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentSpeaker.role}
                  </div>
                </div>

                <div className="md:col-span-9 flex flex-col justify-between space-y-4">
                  <div className="text-xs text-sky-400 font-mono-tabular">
                    Character Guide Transmission · Line {dialogueIdx + 1} of{' '}
                    {mission.dialogueIntro.length}
                  </div>
                  <p className="text-base md:text-lg text-slate-100 leading-relaxed font-medium">
                    “{currentDialogue.line}”
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {mission.dialogueIntro.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setDialogueIdx(idx);
                          }}
                          className={`w-6 h-1.5 rounded-sm transition-colors ${
                            idx === dialogueIdx ? 'bg-red-500' : 'bg-slate-700'
                          }`}
                          aria-label={`Dialogue line ${idx + 1}`}
                        />
                      ))}
                    </div>
                    {dialogueIdx < mission.dialogueIntro.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNextDialogue}
                        className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Next Dialogue →
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-mono-tabular">
                        ✓ Briefing Received
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Historical Concept Teaching Deck */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-red-400 font-mono-tabular">
                      Historical Evidence File · Inspect All 3 Clues Before Testing
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mt-0.5">
                      {mission.teachingConceptTitle}
                    </h3>
                  </div>
                  <div className="text-xs font-mono-tabular text-slate-400">
                    Evidence Reviewed: {inspectedFacts.length} / {mission.teachingFacts.length}
                  </div>
                </div>

                <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
                  {mission.teachingSummary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mission.teachingFacts.map((fact, idx) => {
                    const isRead = inspectedFacts.includes(idx);
                    return (
                      <button
                        key={fact.title}
                        type="button"
                        onClick={() => handleInspectFact(idx)}
                        className={`text-left p-5 rounded-xl border transition-all flex flex-col justify-between ${
                          isRead
                            ? 'bg-[#14192B] border-sky-500/60 shadow-sm'
                            : 'bg-[#0F1320] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-mono-tabular">
                            <span className="text-sky-400">0{idx + 1}. {fact.statistic}</span>
                            <span className={isRead ? 'text-emerald-400' : 'text-amber-400'}>
                              {isRead ? '✓ Studied' : 'Click to Study'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">
                            {fact.title}
                          </h4>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {fact.explanation}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono-tabular text-amber-300">
                          Key Takeaway: {fact.keyTerm}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proceed to Challenge Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Tip: Every clue above directly helps you solve the escape-room challenge!
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPortalTransition();
                    setStage('CHALLENGE');
                    setFeedbackMsg(null);
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Start Detective Challenge →
                </button>
              </div>
            </div>
          )}

          {/* ==================== STAGE 2: INTERACTIVE CHALLENGES ==================== */}
          {stage === 'CHALLENGE' && (
            <div className="space-y-6">
              {/* Feedback Banner */}
              {feedbackMsg && (
                <div
                  className={`p-4 rounded-lg border text-sm font-medium flex items-center justify-between ${
                    feedbackMsg.type === 'error'
                      ? 'bg-red-950/60 border-red-700 text-red-200'
                      : feedbackMsg.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <span>{feedbackMsg.text}</span>
                  <button
                    type="button"
                    onClick={() => setFeedbackMsg(null)}
                    className="text-xs underline ml-4 whitespace-nowrap shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* --- MISSION 1 MECHANIC: THREE ESTATES MATCHING PUZZLE --- */}
              {mission.mechanicType === 'ESTATES_MATCH' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-sky-400 font-mono-tabular">
                        Puzzle 01 · Social Pyramid Sorting
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Match Each Citizen Group to the Correct Estate
                      </h3>
                    </div>
                    <div className="text-xs text-slate-400 font-mono-tabular">
                      Sorted: {Object.keys(estateAssignments).length} / {MISSION_1_CARDS.length}
                    </div>
                  </div>

                  {/* Citizen Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MISSION_1_CARDS.map((card) => {
                      const assigned = estateAssignments[card.id];
                      const isSelected = selectedCardId === card.id;
                      return (
                        <div
                          key={card.id}
                          onClick={() => {
                            soundEngine.playClick();
                            setSelectedCardId(card.id);
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#172036] border-sky-400'
                              : 'bg-[#111524] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono-tabular mb-1">
                              <span className="text-slate-400">Citizen Card</span>
                              <span
                                className={
                                  assigned
                                    ? 'text-emerald-400 font-semibold'
                                    : 'text-amber-400'
                                }
                              >
                                {assigned === 'first'
                                  ? '→ 1st Estate (Clergy)'
                                  : assigned === 'second'
                                  ? '→ 2nd Estate (Nobility)'
                                  : assigned === 'third'
                                  ? '→ 3rd Estate (Commoners)'
                                  : 'Unassigned'}
                              </span>
                            </div>
                            <div className="font-bold text-sm text-white">
                              {card.label}
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              {card.detail}
                            </p>
                          </div>

                          {/* Direct Quick-Assign Buttons for Accessibility & Fast Play */}
                          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
                            {(
                              [
                                { key: 'first', label: '1st Estate' },
                                { key: 'second', label: '2nd Estate' },
                                { key: 'third', label: '3rd Estate' },
                              ] as const
                            ).map((est) => (
                              <button
                                key={est.key}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundEngine.playClick();
                                  setEstateAssignments((prev) => ({
                                    ...prev,
                                    [card.id]: est.key,
                                  }));
                                  setFeedbackMsg(null);
                                }}
                                className={`py-1.5 px-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                                  assigned === est.key
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {est.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStage('BRIEFING')}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      ← Review Clues
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyMission1}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Check Answer
                    </button>
                  </div>
                </div>
              )}

              {/* --- MISSION 2 MECHANIC: ROYAL TAX LEDGER & INEQUALITY DETECTIVE --- */}
              {mission.mechanicType === 'TAX_DETECTIVE' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-sky-400 font-mono-tabular">
                      Puzzle 02 · Royal Treasury Audit at Versailles
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Step 1: Identify Who Paid Each Tax in 1789 France
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'taille' as const,
                        name: 'The Taille (Royal Land Tax)',
                        desc: 'Direct tax on land and property paid to King Louis XVI.',
                      },
                      {
                        id: 'gabelle' as const,
                        name: 'The Gabelle (Salt Tax)',
                        desc: 'Compulsory tax on salt needed to preserve food.',
                      },
                      {
                        id: 'tithe' as const,
                        name: 'The Tithe (10% Church Tax)',
                        desc: 'One-tenth of all crops grown on peasant farms.',
                      },
                    ].map((tax) => (
                      <div
                        key={tax.id}
                        className="p-4 bg-[#121626] border border-slate-800 rounded-xl space-y-3"
                      >
                        <div className="font-bold text-sm text-white">{tax.name}</div>
                        <p className="text-xs text-slate-300">{tax.desc}</p>
                        <div className="space-y-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setTaxPayers((p) => ({ ...p, [tax.id]: 'first_second' }));
                            }}
                            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-colors ${
                              taxPayers[tax.id] === 'first_second'
                                ? 'bg-amber-600/30 border-amber-400 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            Paid by 1st & 2nd Estates (Clergy & Nobles)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setTaxPayers((p) => ({ ...p, [tax.id]: 'third' }));
                            }}
                            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-colors ${
                              taxPayers[tax.id] === 'third'
                                ? 'bg-red-600 border-red-400 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            Paid ONLY by the 3rd Estate (Commoners)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Step 2: Detective Multiple-Choice Deduction */}
                  <div className="p-5 bg-[#121626] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-base font-bold text-white">
                      Step 2: Solve the Mystery — Why was the Third Estate so angry about this system?
                    </h4>
                    <div className="space-y-2">
                      {[
                        {
                          id: 'wrong-1',
                          label:
                            'Because the First and Second Estates paid all the taxes and didn’t let the Third Estate pay any.',
                        },
                        {
                          id: 'correct-inequality',
                          label:
                            'Because the Third Estate (97% of people) worked the hardest and paid almost ALL the taxes, while the wealthy King and Nobles lived in luxury and paid almost nothing.',
                        },
                        {
                          id: 'wrong-2',
                          label:
                            'Because everyone in France paid the exact same amount of taxes.',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setM2DetectiveChoice(opt.id);
                          }}
                          className={`w-full p-3.5 text-left text-sm rounded-lg border transition-colors ${
                            m2DetectiveChoice === opt.id
                              ? 'bg-sky-950/80 border-sky-400 text-white font-semibold'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStage('BRIEFING')}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      ← Review Clues
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyMission2}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Check Answer
                    </button>
                  </div>
                </div>
              )}

              {/* --- MISSION 3 MECHANIC: HIDDEN-OBJECT FLASHLIGHT INVESTIGATION --- */}
              {mission.mechanicType === 'BREAD_FLASHLIGHT' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-sky-400 font-mono-tabular">
                        Puzzle 03 · Hidden-Object Lantern Search
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Sweep Your Flashlight Over the Dark Bakery to Uncover 4 Clues
                      </h3>
                    </div>
                    <div className="text-xs font-mono-tabular text-amber-400">
                      Clues Discovered: {foundClueIds.length} / {MISSION_3_CLUES.length}
                    </div>
                  </div>

                  {/* Interactive Flashlight Canvas / Investigation Box */}
                  <div
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setFlashlightPos({ x, y });
                    }}
                    className="relative w-full h-64 rounded-xl border border-slate-800 bg-[#06070B] overflow-hidden select-none cursor-crosshair"
                  >
                    {/* Subtle Bakery Interior Architectural Grid */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle 140px at ${flashlightPos.x}% ${flashlightPos.y}%, rgba(56, 189, 248, 0.25), rgba(220, 38, 38, 0.08) 55%, rgba(5, 6, 10, 0.96) 100%)`,
                      }}
                    />

                    <div className="absolute top-3 left-4 text-xs font-mono-tabular text-slate-400 pointer-events-none">
                      Move mouse / tap across the dark room to illuminate hidden evidence
                    </div>

                    {/* 4 Hidden Clues */}
                    {MISSION_3_CLUES.map((clue) => {
                      const isFound = foundClueIds.includes(clue.id);
                      const dist = Math.hypot(
                        flashlightPos.x - clue.xPercent,
                        flashlightPos.y - clue.yPercent
                      );
                      const isIlluminated = dist < 24 || isFound;

                      return (
                        <button
                          key={clue.id}
                          type="button"
                          onClick={() => {
                            if (!isFound) {
                              soundEngine.playSuccess();
                              setFoundClueIds((prev) => [...prev, clue.id]);
                            } else {
                              soundEngine.playClick();
                            }
                          }}
                          style={{
                            left: `${clue.xPercent}%`,
                            top: `${clue.yPercent}%`,
                            transform: 'translate(-50%, -50%)',
                            opacity: isIlluminated ? 1 : 0.15,
                          }}
                          className={`absolute px-3 py-2 rounded-lg border text-xs font-semibold transition-opacity cursor-pointer whitespace-nowrap shrink-0 ${
                            isFound
                              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                              : 'bg-red-950/90 border-red-400 text-white animate-pulse'
                          }`}
                        >
                          <span>{clue.clueSymbol} </span>
                          <span>{isFound ? `✓ ${clue.title}` : `Inspect: ${clue.title}`}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Discovered Clues Log */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MISSION_3_CLUES.map((clue) => {
                      const isFound = foundClueIds.includes(clue.id);
                      return (
                        <div
                          key={clue.id}
                          className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                            isFound
                              ? 'bg-[#14192B] border-emerald-500/50 text-slate-200'
                              : 'bg-[#0B0E17] border-slate-800/80 text-slate-500'
                          }`}
                        >
                          {isFound
                            ? clue.historicalFact
                            : `Locked Evidence (${clue.title}) — Find it in the dark bakery above!`}
                        </div>
                      );
                    })}
                  </div>

                  {/* Synthesis Question */}
                  <div className="p-4 bg-[#121626] border border-slate-800 rounded-xl space-y-2.5">
                    <div className="text-sm font-bold text-white">
                      Detective Question: What combined to cause the severe food shortage and anger in 1789?
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: 'correct-bread',
                          text: 'Freezing storms ruined the 1788 harvest, causing bread prices to skyrocket while the Third Estate still paid heavy taxes.',
                        },
                        {
                          id: 'wrong-bread-1',
                          text: 'People in France stopped liking bread and decided to eat only cake.',
                        },
                        {
                          id: 'wrong-bread-2',
                          text: 'Bread became free for everyone in Paris, so bakeries ran out.',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setM3SummaryChoice(opt.id);
                          }}
                          className={`p-3 text-left text-xs sm:text-sm rounded-lg border transition-colors ${
                            m3SummaryChoice === opt.id
                              ? 'bg-sky-950 border-sky-400 text-white font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStage('BRIEFING')}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      ← Review Clues
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyMission3}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Check Answer
                    </button>
                  </div>
                </div>
              )}

              {/* --- MISSION 4 MECHANIC: ESCAPE-ROOM CIPHER & TENNIS COURT OATH --- */}
              {mission.mechanicType === 'TENNIS_CIPHER' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-sky-400 font-mono-tabular">
                      Puzzle 04 · Royal Tennis Court Secret Cipher (20 June 1789)
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Decode the Secret Word Promised in the Tennis Court Oath
                    </h3>
                  </div>

                  {/* Interactive Cipher Decoder Console */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[#121626] border border-slate-800 rounded-xl">
                    <div className="space-y-3">
                      <div className="text-xs font-mono-tabular text-red-400">
                        Intercepted Upside-Down Rift Transmission:
                      </div>
                      <div className="p-4 bg-[#090A10] border border-red-900/60 rounded-lg font-mono-tabular text-lg tracking-widest text-amber-300 text-center">
                        {getCipherPreview('CONSTITUTION', cipherShift)}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="cipher-slider"
                          className="block text-xs font-mono-tabular text-slate-300"
                        >
                          Cipher Rotor Alignment Shift: +{cipherShift} (Slide to 0 to Align Rift Frequency)
                        </label>
                        <input
                          id="cipher-slider"
                          type="range"
                          min={0}
                          max={6}
                          step={1}
                          value={cipherShift}
                          onChange={(e) => {
                            soundEngine.playClick();
                            const val = Number(e.target.value);
                            setCipherShift(val);
                            if (val === 0) {
                              setDecodedInput('CONSTITUTION');
                            }
                          }}
                          className="w-full accent-red-500 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Clue: A written set of fundamental laws that limits the King’s power and guarantees fair rights for all citizens.
                      </p>
                    </div>

                    <div className="space-y-3 flex flex-col justify-between">
                      <div>
                        <label
                          htmlFor="secret-code-input"
                          className="block text-xs font-semibold text-slate-300 mb-1.5"
                        >
                          Enter the 12-Letter Decoded Password:
                        </label>
                        <input
                          id="secret-code-input"
                          type="text"
                          value={decodedInput}
                          onChange={(e) => setDecodedInput(e.target.value)}
                          placeholder="Type CONSTITUTION..."
                          className="w-full px-4 py-2.5 bg-[#090A10] border border-slate-700 rounded-lg font-mono-tabular text-base text-white uppercase tracking-wider focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setCipherShift(0);
                            setDecodedInput('CONSTITUTION');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg"
                        >
                          Auto-Fill from Aligned Rotor
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: National Assembly Question */}
                  <div className="p-5 bg-[#121626] border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      Step 2: When the Third Estate broke away from the unfair 2-to-1 Estates-General vote, what new body did they form on June 17, 1789?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'national-assembly', label: 'The National Assembly' },
                        { id: 'royal-council', label: 'The King’s Luxury Council' },
                        { id: 'salt-collectors', label: 'The Gabelle Tax Guild' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setAssemblyChoice(item.id);
                          }}
                          className={`p-3.5 text-sm font-semibold rounded-lg border transition-colors ${
                            assemblyChoice === item.id
                              ? 'bg-sky-950 border-sky-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStage('BRIEFING')}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      ← Review Clues
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyMission4}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Unlock Tennis Court Door
                    </button>
                  </div>
                </div>
              )}

              {/* --- MISSION 5 MECHANIC: STORMING OF THE BASTILLE DECISIONS --- */}
              {mission.mechanicType === 'BASTILLE_DECISION' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-sky-400 font-mono-tabular">
                        Puzzle 05 · 14 July 1789 Decision Simulation
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Decision {bastilleStep + 1} of {MISSION_5_DECISIONS.length}: The Fall of the Bastille
                      </h3>
                    </div>
                    <div className="text-xs font-mono-tabular text-emerald-400">
                      Fortress Gates Breached: {bastilleSolvedSteps} / {MISSION_5_DECISIONS.length}
                    </div>
                  </div>

                  {/* Current Bastille Decision Card */}
                  {MISSION_5_DECISIONS[bastilleStep] && (
                    <div className="p-5 bg-[#121626] border border-slate-800 rounded-xl space-y-4">
                      <div className="p-3.5 bg-[#090A10] border border-slate-800 rounded-lg text-sm text-amber-200 leading-relaxed">
                        {MISSION_5_DECISIONS[bastilleStep].situation}
                      </div>

                      <h4 className="text-base font-bold text-white">
                        {MISSION_5_DECISIONS[bastilleStep].prompt}
                      </h4>

                      <div className="space-y-2.5">
                        {MISSION_5_DECISIONS[bastilleStep].options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setBastilleSelectedOpt(opt.id);
                              setFeedbackMsg(null);
                            }}
                            className={`w-full p-4 text-left text-sm rounded-lg border transition-colors ${
                              bastilleSelectedOpt === opt.id
                                ? 'bg-red-950/90 border-red-400 text-white font-semibold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStage('BRIEFING')}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      ← Review Clues
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyMission5Step}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Confirm Decision
                    </button>
                  </div>
                </div>
              )}

              {/* --- MISSION 6 MECHANIC: FINAL TIMELINE ORDERING & DECLARATION --- */}
              {mission.mechanicType === 'TIMELINE_ORDER' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-sky-400 font-mono-tabular">
                      Final Puzzle · Chronological Rift Stabilization
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Arrange All 6 Events in Exact Order (From Earliest in 1788 to Latest in August 1789)
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {timelineItems.map((item, idx) => {
                      const isCorrectSlot = item.chronologicalOrder === idx + 1;
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                            isCorrectSlot
                              ? 'bg-[#111C24] border-emerald-500/60'
                              : 'bg-[#121626] border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center font-mono-tabular text-xs font-bold text-sky-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-mono-tabular text-amber-300">
                                {item.dateLabel}
                                {isCorrectSlot && (
                                  <span className="ml-2 text-emerald-400">· ✓ Position Aligned</span>
                                )}
                              </div>
                              <div className="text-sm font-bold text-white">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-300">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveTimelineItem(idx, -1)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded border border-slate-700 cursor-pointer"
                            >
                              ↑ Up
                            </button>
                            <button
                              type="button"
                              disabled={idx === timelineItems.length - 1}
                              onClick={() => moveTimelineItem(idx, 1)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded border border-slate-700 cursor-pointer"
                            >
                              ↓ Down
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Declaration of the Rights of Man Final Verification */}
                  <div className="p-4 bg-[#121626] border border-slate-800 rounded-xl space-y-2.5">
                    <div className="text-sm font-bold text-white">
                      Final Portal Lock: What did Article 1 of the Declaration of the Rights of Man and of the Citizen (August 1789) proclaim?
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setDeclarationChoice('free-and-equal');
                        }}
                        className={`p-3 text-left text-xs sm:text-sm rounded-lg border transition-colors ${
                          declarationChoice === 'free-and-equal'
                            ? 'bg-sky-950 border-sky-400 text-white font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        “Men are born and remain free and equal in rights” (Liberty, Equality, Fraternity).
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setDeclarationChoice('only-nobles');
                        }}
                        className={`p-3 text-left text-xs sm:text-sm rounded-lg border transition-colors ${
                          declarationChoice === 'only-nobles'
                            ? 'bg-sky-950 border-sky-400 text-white font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        “Only the First and Second Estates have rights and never have to pay taxes.”
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStage('BRIEFING')}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      ← Review Clues
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyMission6}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Stabilize Timeline & Open Portal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== STAGE 3: MISSION COMPLETED REWARD ==================== */}
          {stage === 'COMPLETED' && (
            <div className="py-8 px-4 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-2xl text-emerald-300">
                ★
              </div>
              <div className="space-y-2">
                <div className="text-xs font-mono-tabular text-emerald-400">
                  {mission.codeName} Cleared · Rift Node Stabilized
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Badge Unlocked: {mission.badgeName}
                </h3>
                <p className="text-sm text-slate-300">
                  {mission.badgeDescription}
                </p>
              </div>

              <div className="p-4 bg-[#121626] border border-slate-800 rounded-xl flex items-center justify-around font-mono-tabular">
                <div>
                  <div className="text-xs text-slate-400">Mission Points</div>
                  <div className="text-lg font-bold text-white">
                    +{mission.pointsReward}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-xs text-slate-400">Speed Bonus</div>
                  <div className="text-lg font-bold text-sky-400">
                    +{isAlreadyCompleted ? 0 : bonusPoints}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPortalTransition();
                  onCompleteMission(mission.id, isAlreadyCompleted ? 0 : bonusPoints);
                }}
                className="px-8 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
              >
                {mission.id === 6
                  ? 'Step Through Portal to Present Day →'
                  : 'Continue to Next Rift Location →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
