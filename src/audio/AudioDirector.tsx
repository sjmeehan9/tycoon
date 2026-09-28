import { useEffect, useRef, useState } from 'react';

import { useGame } from '../app/GameContext';
import type { GamePhase, VenueId } from '../game';

export type AudioCue = 'confirm' | 'event';

interface AudioHandle {
  currentTime: number;
  loop: boolean;
  preload: string;
  volume: number;
  pause: () => void;
  play: () => Promise<void> | void;
}

export type AudioFactory = (source: string) => AudioHandle;

/** Venue-scaled local ambience levels, exhaustive across the campaign progression. */
export const VENUE_AMBIENCE_VOLUME: Readonly<Record<VenueId, number>> = {
  cart: 0.13,
  kiosk: 0.15,
  cafe: 0.16,
  departmentStore: 0.18,
};

/** Small local-audio adapter that treats unsupported or blocked playback as muted operation. */
export class BrowserAudioManager {
  readonly #ambience: AudioHandle;
  readonly #cues: Record<AudioCue, AudioHandle>;

  public constructor(
    baseUrl = import.meta.env.BASE_URL,
    factory: AudioFactory = createBrowserAudio,
  ) {
    const asset = (name: string): string => `${baseUrl}assets/audio/${name}.wav`;
    this.#ambience = factory(asset('laneway-ambience'));
    this.#ambience.loop = true;
    this.#ambience.preload = 'metadata';
    this.#ambience.volume = 0.16;
    this.#cues = {
      confirm: factory(asset('confirm')),
      event: factory(asset('event')),
    };
    this.#cues.confirm.preload = 'auto';
    this.#cues.confirm.volume = 0.24;
    this.#cues.event.preload = 'auto';
    this.#cues.event.volume = 0.28;
  }

  /** Start or stop the locally bundled ambience after consent. */
  public setAmbienceEnabled(enabled: boolean): void {
    if (!enabled) {
      this.#ambience.pause();
      return;
    }
    safelyPlay(this.#ambience);
  }

  /** Match the local room tone level to the active venue without changing consent. */
  public setVenue(venueId: VenueId | null): void {
    this.#ambience.volume = venueId ? VENUE_AMBIENCE_VOLUME[venueId] : 0.16;
  }

  /** Play one non-blocking local interface cue. */
  public playCue(cue: AudioCue): void {
    const audio = this.#cues[cue];
    audio.currentTime = 0;
    safelyPlay(audio);
  }

  /** Stop all media when the application releases the adapter. */
  public dispose(): void {
    this.#ambience.pause();
    Object.values(this.#cues).forEach((audio) => audio.pause());
  }
}

/** Consent-aware bridge from saved preferences and visual state transitions to local media. */
export function AudioDirector(): null {
  const { game, preferences } = useGame();
  const [manager, setManager] = useState<BrowserAudioManager | null>(null);
  const managerRef = useRef<BrowserAudioManager | null>(null);
  const previousRef = useRef<{
    phase: GamePhase | null;
    soundEnabled: boolean;
    venueId: VenueId | null;
  }>({
    phase: game?.phase ?? null,
    soundEnabled: preferences.soundEnabled,
    venueId: game?.venueId ?? null,
  });
  useEffect(() => {
    const allow = (): void => {
      window.removeEventListener('pointerdown', allow);
      window.removeEventListener('keydown', allow);
      if (managerRef.current) return;
      const created = new BrowserAudioManager();
      managerRef.current = created;
      setManager(created);
    };
    window.addEventListener('pointerdown', allow);
    window.addEventListener('keydown', allow);
    return () => {
      window.removeEventListener('pointerdown', allow);
      window.removeEventListener('keydown', allow);
    };
  }, []);

  useEffect(() => {
    if (!manager) return;
    manager.setVenue(game?.venueId ?? null);
    manager.setAmbienceEnabled(preferences.ambienceEnabled);
  }, [game?.venueId, manager, preferences.ambienceEnabled]);

  useEffect(() => {
    const previous = previousRef.current;
    const next = {
      phase: game?.phase ?? null,
      soundEnabled: preferences.soundEnabled,
      venueId: game?.venueId ?? null,
    };
    previousRef.current = next;
    if (!manager || !preferences.soundEnabled) return;
    if (!previous.soundEnabled || previous.venueId !== next.venueId) {
      manager.playCue('confirm');
      return;
    }
    if (
      previous.phase !== next.phase &&
      (next.phase === 'event' || next.phase === 'victory' || next.phase === 'defeat')
    ) {
      manager.playCue('event');
    }
  }, [game?.phase, game?.venueId, manager, preferences.soundEnabled]);

  useEffect(
    () => () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    },
    [],
  );
  return null;
}

function createBrowserAudio(source: string): AudioHandle {
  const audio = document.createElement('audio');
  audio.src = source;
  return audio;
}

function safelyPlay(audio: AudioHandle): void {
  try {
    const result = audio.play();
    if (result) void result.catch(() => undefined);
  } catch {
    // Unsupported media and autoplay rejection are equivalent to muted operation.
  }
}
