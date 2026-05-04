import { Injectable } from '@angular/core';

export enum SoundEffect {
  CardPlay = 'card-play',
  CardDraw = 'card-draw',
  Combat = 'combat',
  Damage = 'damage',
  PhaseChange = 'phase-change',
  Victory = 'victory',
  Defeat = 'defeat',
  ButtonClick = 'button-click',
  CardDestroy = 'card-destroy',
  Shuffle = 'shuffle',

  // Multiplayer sounds
  PlayerJoined = 'player-joined',
  PlayerLeft = 'player-left',
  GameStart = 'game-start',
  OpponentAction = 'opponent-action',
  TurnChange = 'turn-change',
  EmoteSent = 'emote-sent',
  ChatMessage = 'chat-message',
}

@Injectable({ providedIn: 'root' })
export class SoundService {
  private audioCache = new Map<SoundEffect, HTMLAudioElement>();
  private enabled = true;
  private volume = 0.5;

  private soundFiles: Record<SoundEffect, string> = {
    [SoundEffect.CardPlay]: 'sounds/card-play.mp3',
    [SoundEffect.CardDraw]: 'sounds/card-draw.mp3',
    [SoundEffect.Combat]: 'sounds/combat.mp3',
    [SoundEffect.Damage]: 'sounds/damage.mp3',
    [SoundEffect.PhaseChange]: 'sounds/phase-change.mp3',
    [SoundEffect.Victory]: 'sounds/victory.mp3',
    [SoundEffect.Defeat]: 'sounds/defeat.mp3',
    [SoundEffect.ButtonClick]: 'sounds/button-click.mp3',
    [SoundEffect.CardDestroy]: 'sounds/card-destroy.mp3',
    [SoundEffect.Shuffle]: 'sounds/shuffle.mp3',

    // Multiplayer sounds (reuse existing sounds for now)
    [SoundEffect.PlayerJoined]: 'sounds/button-click.mp3',
    [SoundEffect.PlayerLeft]: 'sounds/card-destroy.mp3',
    [SoundEffect.GameStart]: 'sounds/shuffle.mp3',
    [SoundEffect.OpponentAction]: 'sounds/card-play.mp3',
    [SoundEffect.TurnChange]: 'sounds/phase-change.mp3',
    [SoundEffect.EmoteSent]: 'sounds/button-click.mp3',
    [SoundEffect.ChatMessage]: 'sounds/card-draw.mp3',
  };

  constructor() {
    this.loadSettings();
  }

  /**
   * Play a sound effect
   */
  play(effect: SoundEffect): void {
    if (!this.enabled) return;

    try {
      let audio = this.audioCache.get(effect);

      if (!audio) {
        audio = new Audio(this.soundFiles[effect]);
        audio.volume = this.volume;
        this.audioCache.set(effect, audio);
      }

      // Clone the audio to allow multiple simultaneous plays
      const clonedAudio = audio.cloneNode(true) as HTMLAudioElement;
      clonedAudio.volume = this.volume;
      clonedAudio.play().catch((err) => {
        console.warn('Sound playback failed:', effect, err);
      });
    } catch (err) {
      console.warn('Sound effect not available:', effect, err);
    }
  }

  /**
   * Enable/disable sound effects
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    // Update cached audio elements
    this.audioCache.forEach((audio) => {
      audio.volume = this.volume;
    });
    this.saveSettings();
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Preload all sound effects
   */
  preloadAll(): void {
    Object.values(SoundEffect).forEach((effect) => {
      if (!this.audioCache.has(effect)) {
        const audio = new Audio(this.soundFiles[effect]);
        audio.volume = this.volume;
        audio.preload = 'auto';
        this.audioCache.set(effect, audio);
      }
    });
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('soundSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled ?? true;
        this.volume = parsed.volume ?? 0.5;
      }
    } catch (err) {
      console.warn('Failed to load sound settings:', err);
    }
  }

  private saveSettings(): void {
    try {
      const settings = {
        enabled: this.enabled,
        volume: this.volume,
      };
      localStorage.setItem('soundSettings', JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save sound settings:', err);
    }
  }
}
