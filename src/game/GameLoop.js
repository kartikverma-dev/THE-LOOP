/* ==========================================================================
   LOOP 8 // GAME LOOP & ANOMALY EVALUATION ENGINE
   ========================================================================== */

import { ANOMALIES_DATABASE } from '../engine/Anomalies.js';

export class GameLoop {
  constructor(scene3D, audioEngine, hapticsManager, hudUI) {
    this.scene = scene3D;
    this.audio = audioEngine;
    this.haptics = hapticsManager;
    this.hud = hudUI;

    // Game Progress State
    this.currentLevel = 0;
    this.maxLevel = 8;
    this.totalResets = 0;
    this.totalAttempts = 0;
    this.correctDecisions = 0;
    this.startTime = Date.now();
    this.sanity = 100;

    // Turn Anomaly State
    this.hasAnomalyThisTurn = false;
    this.currentAnomaly = null;
    this.discoveredAnomalies = new Set(JSON.parse(localStorage.getItem('loop8_discovered') || '[]'));

    // Audio Footstep Timer
    this.lastStepTime = 0;

    // Mannequin Catch Callback
    this.scene.onMannequinCaughtPlayer = () => this.handleMannequinCaughtPlayer();
  }

  startNewGame() {
    this.currentLevel = 0;
    this.totalResets = 0;
    this.totalAttempts = 0;
    this.correctDecisions = 0;
    this.startTime = Date.now();
    this.sanity = 100;

    this.hud.updateLevel(this.currentLevel);
    this.hud.updateSanity(this.sanity);
    this.hud.updateArchiveCount(this.discoveredAnomalies.size, ANOMALIES_DATABASE.length);

    this.setupTurn();
  }

  setupTurn() {
    this.scene.resetHallway();

    // 75% Chance of Anomaly on Level 1-7 (High action rate like Exit 8; Level 0 is clean baseline)
    if (this.currentLevel > 0 && Math.random() < 0.75) {
      this.hasAnomalyThisTurn = true;
      const unspotted = ANOMALIES_DATABASE.filter(a => !this.discoveredAnomalies.has(a.id));
      const pool = unspotted.length > 0 ? unspotted : ANOMALIES_DATABASE;
      this.currentAnomaly = pool[Math.floor(Math.random() * pool.length)];

      // Apply anomaly modification to 3D scene
      this.currentAnomaly.apply(this.scene);
    } else {
      this.hasAnomalyThisTurn = false;
      this.currentAnomaly = null;
    }
  }

  handleMannequinCaughtPlayer() {
    // Player came too close to the Mannequin and got caught!
    this.totalResets++;
    this.sanity = Math.max(10, this.sanity - 25);
    this.audio.playJumpscareSting();
    this.haptics.triggerGlitchReset();
    this.hud.triggerGlitchFlash();

    this.markAnomalyDiscovered('mannequin-standing');

    this.currentLevel = 0;
    this.hud.updateLevel(this.currentLevel);
    this.hud.updateSanity(this.sanity);

    // Reset hallway
    this.setupTurn();
  }

  submitDecision(choseAnomaly) {
    this.totalAttempts++;

    const isCorrect = choseAnomaly ? this.hasAnomalyThisTurn : !this.hasAnomalyThisTurn;

    if (isCorrect) {
      this.correctDecisions++;
      this.currentLevel++;
      this.audio.playSuccessChime();
      this.haptics.triggerSuccess();

      if (this.hasAnomalyThisTurn && this.currentAnomaly) {
        this.markAnomalyDiscovered(this.currentAnomaly.id);
      }

      this.hud.updateLevel(this.currentLevel);

      if (this.currentLevel >= this.maxLevel) {
        // VICTORY ESCAPE!
        this.triggerVictory();
        return;
      }
    } else {
      // TRAP TRIGGERED / MISSED ANOMALY -> RESET TO LEVEL 0!
      this.totalResets++;
      this.sanity = Math.max(20, this.sanity - 15);
      this.audio.playGlitchReset();
      this.haptics.triggerGlitchReset();
      this.hud.triggerGlitchFlash();

      if (this.hasAnomalyThisTurn && this.currentAnomaly) {
        this.markAnomalyDiscovered(this.currentAnomaly.id);
      }

      this.currentLevel = 0;
      this.hud.updateLevel(this.currentLevel);
      this.hud.updateSanity(this.sanity);
    }

    // Prepare next hallway turn
    this.setupTurn();
  }

  markAnomalyDiscovered(id) {
    this.discoveredAnomalies.add(id);
    localStorage.setItem('loop8_discovered', JSON.stringify(Array.from(this.discoveredAnomalies)));
    this.hud.updateArchiveCount(this.discoveredAnomalies.size, ANOMALIES_DATABASE.length);
  }

  triggerVictory() {
    const timeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(timeSec / 60).toString().padStart(2, '0');
    const secs = (timeSec % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const precision = this.totalAttempts > 0
      ? Math.round((this.correctDecisions / this.totalAttempts) * 100)
      : 100;

    this.hud.showVictoryModal({
      time: timeStr,
      resets: this.totalResets,
      precision: `${precision}%`
    });
  }

  update(delta) {
    // Sanity passive recharge
    if (this.sanity < 100) {
      this.sanity = Math.min(100, this.sanity + delta * 2);
      this.hud.updateSanity(this.sanity);
    }
  }
}
