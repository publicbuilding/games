/**
 * Sound Effect System Placeholders
 * This file contains placeholder comments for sound effects to be implemented
 * Each function represents where audio would be played in the game
 */

/**
 * UI Sounds
 */
export function soundBuildingPlaced(): void {
  // TODO: Play sound - "ui_place_building.wav"
  // Type: UI confirmation
  // Duration: 0.3s
  // Pitch: medium, pleasant wooden sound
  console.log('[SFX] Building placed');
}

export function soundResourceGathered(): void {
  // TODO: Play sound - "resource_gather.wav"
  // Type: Resource collection
  // Duration: 0.4s
  // Pitch: clink/collection sound
  console.log('[SFX] Resource gathered');
}

export function soundPopulationHappy(): void {
  // TODO: Play sound - "population_happy.wav"
  // Type: Positive feedback
  // Duration: 0.5s
  // Pitch: cheerful bells/chimes
  console.log('[SFX] Population happy');
}

export function soundQuestComplete(): void {
  // TODO: Play sound - "quest_complete.wav"
  // Type: Achievement
  // Duration: 1.0s
  // Pitch: victorious orchestral sting
  console.log('[SFX] Quest completed!');
}

export function soundWarning(): void {
  // TODO: Play sound - "warning.wav"
  // Type: Alert
  // Duration: 0.3s
  // Pitch: urgent, attention-getting
  console.log('[SFX] Warning');
}

/**
 * Ambient Sounds
 */
export function soundAmbientDay(): void {
  // TODO: Loop sound - "ambience_day.wav"
  // Type: Background ambience
  // Duration: loops indefinitely
  // Content: birds chirping, distant work sounds
  console.log('[SFX] Day ambience playing');
}

export function soundAmbientNight(): void {
  // TODO: Loop sound - "ambience_night.wav"
  // Type: Background ambience
  // Duration: loops indefinitely
  // Content: crickets, wind, peaceful quiet
  console.log('[SFX] Night ambience playing');
}

export function soundSeasonal(season: string): void {
  // TODO: Loop sound - `ambience_${season}.wav`
  // Spring: "ambience_spring.wav" - cherry blossoms, birds
  // Summer: "ambience_summer.wav" - warm, cicadas
  // Autumn: "ambience_autumn.wav" - wind, leaves
  // Winter: "ambience_winter.wav" - cold wind, snow falling
  console.log(`[SFX] Seasonal ambience: ${season}`);
}

/**
 * Building Production Sounds
 */
export function soundFarmProduction(): void {
  // TODO: Play sound - "farm_work.wav"
  // Type: Building activity
  // Duration: 0.6s
  // Content: shoveling soil, water splashing
  console.log('[SFX] Farm working');
}

export function soundMineProduction(): void {
  // TODO: Play sound - "mine_work.wav"
  // Type: Building activity
  // Duration: 0.7s
  // Content: pickaxe striking rock
  console.log('[SFX] Mining in progress');
}

export function soundBlacksmithProduction(): void {
  // TODO: Play sound - "blacksmith_work.wav"
  // Type: Building activity
  // Duration: 0.8s
  // Content: hammer striking anvil, sparks
  console.log('[SFX] Blacksmith crafting');
}

export function soundMarketTransaction(): void {
  // TODO: Play sound - "market_transaction.wav"
  // Type: Commerce activity
  // Duration: 0.5s
  // Content: coins jingling, seller calling
  console.log('[SFX] Market transaction');
}

export function soundConstruction(): void {
  // TODO: Play sound - "construction.wav"
  // Type: Building activity
  // Duration: 1.0s
  // Content: hammering, sawing, builders calling
  console.log('[SFX] Construction in progress');
}

export function soundBuildingComplete(): void {
  // TODO: Play sound - "building_complete.wav"
  // Type: Building activity
  // Duration: 0.8s
  // Content: final hammer strike, construction complete fanfare
  console.log('[SFX] Building complete');
}

/**
 * Combat/Defense Sounds
 */
export function soundWatchtowerAlert(): void {
  // TODO: Play sound - "watchtower_alert.wav"
  // Type: Alert
  // Duration: 1.2s
  // Content: gong/bell warning
  console.log('[SFX] Watchtower alert!');
}

export function soundDefenseMode(): void {
  // TODO: Play sound - "defense_mode.wav"
  // Type: State change
  // Duration: 1.0s
  // Content: soldiers mobilizing, armor clanking
  console.log('[SFX] Defense mode activated');
}

/**
 * Nature/Environment Sounds
 */
export function soundRiverFlow(): void {
  // TODO: Loop sound - "river_flow.wav"
  // Type: Ambient nature
  // Duration: loops indefinitely
  // Content: water flowing, peaceful
  console.log('[SFX] River flowing');
}

export function soundWind(): void {
  // TODO: Loop sound - "wind.wav"
  // Type: Ambient nature
  // Duration: loops indefinitely
  // Content: wind through trees/bamboo
  console.log('[SFX] Wind blowing');
}

export function soundRain(): void {
  // TODO: Loop sound - "rain.wav"
  // Type: Weather effect
  // Duration: loops indefinitely
  // Content: rainfall, gentle to heavy
  console.log('[SFX] Rain falling');
}

/**
 * Music Tracks
 */
export function musicMainTheme(): void {
  // TODO: Loop music - "music_main_theme.ogg"
  // Type: Background music
  // Duration: 3-5 minutes
  // Style: Traditional East Asian instrumental
  // Tempo: Calm, meditative
  console.log('[MUSIC] Main theme playing');
}

export function musicExploration(): void {
  // TODO: Loop music - "music_exploration.ogg"
  // Type: Background music
  // Duration: 3-5 minutes
  // Style: Adventure, discovery
  // Used during: Exploration quests
  console.log('[MUSIC] Exploration theme playing');
}

export function musicTrade(): void {
  // TODO: Loop music - "music_trade.ogg"
  // Type: Background music
  // Duration: 3-5 minutes
  // Style: Bustling marketplace
  // Used during: Commerce/trade focus
  console.log('[MUSIC] Trade theme playing');
}

export function musicCombat(): void {
  // TODO: Loop music - "music_combat.ogg"
  // Type: Background music
  // Duration: 2-3 minutes
  // Style: Tense, dramatic
  // Used during: Defense situations
  console.log('[MUSIC] Combat theme playing');
}

export function musicCultural(): void {
  // TODO: Loop music - "music_cultural.ogg"
  // Type: Background music
  // Duration: 3-5 minutes
  // Style: Sacred, ceremonial
  // Used during: Temple construction, celebrations
  console.log('[MUSIC] Cultural theme playing');
}

/**
 * Sound Manager for coordinating audio
 */
export class SoundManager {
  private currentAmbience: string | null = null;
  private currentMusic: string | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.5; // Start at 50%
  private effectVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private audioContext: AudioContext | null = null;

  // Initialize sound manager
  init(): void {
    try {
      // Create audio context on first user interaction
      if (!this.audioContext && typeof AudioContext !== 'undefined') {
        this.audioContext = new AudioContext();
      }
    } catch (e) {
      console.warn('[SoundManager] Web Audio API not available');
    }
    
    console.log('[SoundManager] Initialized');
    console.log('[SoundManager] Master Volume:', this.masterVolume);
    console.log('[SoundManager] Effects Volume:', this.effectVolume);
    console.log('[SoundManager] Music Volume:', this.musicVolume);
  }

  // Ensure audio context is initialized
  private ensureAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof AudioContext !== 'undefined') {
      try {
        this.audioContext = new AudioContext();
      } catch (e) {
        return null;
      }
    }
    return this.audioContext;
  }

  // Play a procedural click sound (short blip)
  private playClickSound(volume: number): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 800; // High pitch
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // Play a procedural build/thud sound
  private playBuildSound(volume: number): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  // Play a procedural error sound (low buzz)
  private playErrorSound(volume: number): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 150; // Low frequency
    osc.type = 'square';
    
    gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // Play a procedural success/level-up sound (ascending tones)
  private playSuccessSound(volume: number): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(volume * 0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play ascending tones: 440 -> 550 -> 660 Hz
    const baseTime = ctx.currentTime;
    playTone(440, baseTime, 0.15);
    playTone(550, baseTime + 0.15, 0.15);
    playTone(660, baseTime + 0.3, 0.15);
  }

  // Play a procedural resource collect sound (soft ding)
  private playCollectSound(volume: number): void {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  // Switch background music based on game state
  setMusicForGameState(state: 'exploration' | 'trade' | 'combat' | 'cultural' | 'normal'): void {
    if (!this.enabled) return;
    console.log(`[SoundManager] 🎵 Switching to ${state} music`);
    switch (state) {
      case 'exploration':
        musicExploration();
        break;
      case 'trade':
        musicTrade();
        break;
      case 'combat':
        musicCombat();
        break;
      case 'cultural':
        musicCultural();
        break;
      case 'normal':
      default:
        musicMainTheme();
        break;
    }
  }

  // Update ambience based on day/night and season
  updateAmbience(dayTime: number, season: string): void {
    if (!this.enabled) return;
    const ambience = dayTime > 0.25 && dayTime < 0.75 ? 'day' : 'night';
    if (ambience !== this.currentAmbience) {
      this.currentAmbience = ambience;
      if (ambience === 'day') {
        soundAmbientDay();
      } else {
        soundAmbientNight();
      }
    }
    soundSeasonal(season);
  }

  // Play UI sound effect
  playUISound(action: 'click' | 'place_building' | 'error' | 'success'): void {
    if (!this.enabled) return;
    const volume = this.effectVolume * this.masterVolume;
    
    switch (action) {
      case 'click':
        this.playClickSound(volume);
        console.log(`[SFX] 🔘 UI Click (volume: ${volume.toFixed(2)})`);
        break;
      case 'place_building':
        this.playBuildSound(volume);
        console.log(`[SFX] 🏗️  Building Placed (volume: ${volume.toFixed(2)})`);
        break;
      case 'error':
        this.playErrorSound(volume);
        console.log(`[SFX] ⚠️  Error Buzz (volume: ${volume.toFixed(2)})`);
        break;
      case 'success':
        this.playSuccessSound(volume);
        console.log(`[SFX] ✅ Success Chime (volume: ${volume.toFixed(2)})`);
        break;
    }
  }

  // Play production sound effect
  playProductionSound(buildingType: string): void {
    if (!this.enabled) return;
    const volume = this.effectVolume * this.masterVolume;
    
    console.log(`[SFX] 🏭 Production - ${buildingType} (volume: ${volume.toFixed(2)})`);
    this.playBuildSound(volume * 0.7); // Use build sound for production
  }

  // Play celebration sound
  playCelebrationSound(type: 'fanfare' | 'quest_complete' | 'level_up'): void {
    if (!this.enabled) return;
    const volume = this.effectVolume * this.masterVolume;
    
    switch (type) {
      case 'fanfare':
        this.playSuccessSound(volume);
        console.log(`[SFX] 🎺 Fanfare (volume: ${volume.toFixed(2)})`);
        break;
      case 'quest_complete':
        this.playSuccessSound(volume);
        console.log(`[SFX] ✨ Quest Complete! (volume: ${volume.toFixed(2)})`);
        break;
      case 'level_up':
        this.playSuccessSound(volume);
        console.log(`[SFX] ⭐ Level Up! (volume: ${volume.toFixed(2)})`);
        break;
    }
  }

  // Play resource sound
  playResourceSound(resourceType: string): void {
    if (!this.enabled) return;
    const volume = this.effectVolume * this.masterVolume;
    
    this.playCollectSound(volume);
    console.log(`[SFX] 💰 Resource - ${resourceType} (volume: ${volume.toFixed(2)})`);
  }

  // Play sound effect with volume control
  playSoundEffect(effectName: string, volume: number = 0.7): void {
    if (!this.enabled) return;
    const finalVolume = volume * this.masterVolume;
    
    // Default to click sound for generic effects
    this.playClickSound(finalVolume);
    console.log(`[SoundManager] 🔊 Playing ${effectName} at volume ${finalVolume.toFixed(2)}`);
  }

  // Set master volume (0-1)
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`[SoundManager] 🔊 Master Volume: ${(this.masterVolume * 100).toFixed(0)}%`);
  }

  // Get current master volume
  getMasterVolume(): number {
    return this.masterVolume;
  }

  // Toggle sound on/off
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[SoundManager] ${enabled ? '🔊 Sound enabled' : '🔇 Sound disabled'}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Global sound manager instance
export const soundManager = new SoundManager();
