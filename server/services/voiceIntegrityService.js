/**
 * Voice Integrity Service
 * Privacy-Preserving Acoustic Telemetry Analyzer
 * Modes: 'DISABLED', 'RULE_BASED', 'ML_ASSISTED'
 */

const MODES = {
  DISABLED: 'DISABLED',
  RULE_BASED: 'RULE_BASED',
  ML_ASSISTED: 'ML_ASSISTED',
};

class VoiceIntegrityService {
  constructor(mode = process.env.VOICE_INTEGRITY_MODE || MODES.RULE_BASED) {
    this.mode = mode;
    this.speechThresholdDb = -32; // Decibel energy threshold for human speech
    this.speechDurationThresholdMs = 2500; // Continuous speech window
    this.minConfidence = 0.65;
  }

  /**
   * Process client acoustic telemetry features (RMS energy, spectral centroid, speech duration)
   * Note: Raw audio waveforms are never persisted or collected on the server.
   */
  analyzeAcousticTelemetry({
    rmsEnergy = -60,
    durationMs = 0,
    spectralCentroid = 0,
    zeroCrossingRate = 0,
  }) {
    if (this.mode === MODES.DISABLED) {
      return {
        detected: false,
        type: 'NONE',
        confidence: 0,
        mode: this.mode,
      };
    }

    if (this.mode === MODES.RULE_BASED) {
      // Heuristic: Human vocal speech typically has spectral centroid 300Hz-3400Hz,
      // RMS energy above threshold, and lasts longer than ambient instantaneous clicks.
      const isVoiceBand = spectralCentroid >= 300 && spectralCentroid <= 3400;
      const isAudibleEnergy = rmsEnergy > this.speechThresholdDb;
      const isSustained = durationMs >= this.speechDurationThresholdMs;

      if (isAudibleEnergy && isSustained && isVoiceBand) {
        return {
          detected: true,
          type: 'SPEECH_DETECTED',
          confidence: 0.82,
          details: {
            durationMs,
            rmsEnergy,
            classification: 'Sustained Candidate Speech Signal',
          },
        };
      }

      // Short transient or ambient background noise
      if (isAudibleEnergy && !isSustained) {
        return {
          detected: false,
          type: 'BACKGROUND_NOISE',
          confidence: 0.45,
          details: {
            durationMs,
            rmsEnergy,
            classification: 'Transient Ambient/Mechanical Noise',
          },
        };
      }

      return {
        detected: false,
        type: 'SILENCE_OR_NORMAL',
        confidence: 0.95,
        details: { classification: 'Normal exam room environment' },
      };
    }

    if (this.mode === MODES.ML_ASSISTED) {
      // Future ML model integration boundary (e.g. VAD or Whisper feature embedding)
      // For now, falls back to enhanced rule-based acoustic profile
      const isLikelySpeech = rmsEnergy > this.speechThresholdDb && durationMs > 2000;
      return {
        detected: isLikelySpeech,
        type: isLikelySpeech ? 'SPEECH_DETECTED' : 'BACKGROUND_NOISE',
        confidence: isLikelySpeech ? 0.89 : 0.6,
        details: { mode: 'ML_ASSISTED_FALLBACK', durationMs },
      };
    }

    return { detected: false, type: 'UNKNOWN', confidence: 0 };
  }
}

const voiceIntegrityService = new VoiceIntegrityService();
module.exports = {
  voiceIntegrityService,
  VoiceIntegrityService,
  VOICE_MODES: MODES,
};
