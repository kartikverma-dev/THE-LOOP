/* ==========================================================================
   LOOP 8 // HAPTICS MANAGER (Mobile Vibrate API + Gamepad Rumble)
   ========================================================================== */

export class HapticsManager {
  constructor() {
    this.enabled = true;
    this.intensity = 0.8; // 0.1 to 1.0
  }

  setEnabled(val) {
    this.enabled = val;
  }

  setIntensity(val) {
    this.intensity = Math.max(0.1, Math.min(1.0, val));
  }

  vibrate(pattern, gamepad = null) {
    if (!this.enabled) return;

    // 1. Mobile & Tablet Touch Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        const scaledPattern = Array.isArray(pattern)
          ? pattern.map(ms => typeof ms === 'number' ? Math.round(ms * this.intensity) : ms)
          : Math.round(pattern * this.intensity);
        navigator.vibrate(scaledPattern);
      } catch (e) {
        // Suppress browser security restriction if un-interacted
      }
    }

    // 2. Gamepad Dual-Rumble Vibration Actuator
    if (gamepad && gamepad.vibrationActuator && typeof gamepad.vibrationActuator.playEffect === 'function') {
      try {
        const duration = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
        gamepad.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: Math.min(duration, 1000),
          weakMagnitude: 0.5 * this.intensity,
          strongMagnitude: 0.8 * this.intensity
        });
      } catch (e) {
        // Fallback for non-supported actuators
      }
    }
  }

  triggerFootstep(gamepad = null) {
    this.vibrate(15, gamepad);
  }

  triggerHeartbeat(gamepad = null) {
    this.vibrate([40, 80, 40], gamepad);
  }

  triggerGlitchReset(gamepad = null) {
    this.vibrate([150, 50, 250, 50, 350], gamepad);
  }

  triggerSuccess(gamepad = null) {
    this.vibrate([80, 40, 120, 40, 200], gamepad);
  }
}
