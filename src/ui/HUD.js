/* ==========================================================================
   LOOP 8 // HEADS-UP DISPLAY (HUD) & INTERACTIVE MODAL OVERLAYS
   ========================================================================== */

import { ANOMALIES_DATABASE } from '../engine/Anomalies.js';

export class HUD {
  constructor(audioEngine, hapticsManager, gamepadManager) {
    this.audio = audioEngine;
    this.haptics = hapticsManager;
    this.gamepad = gamepadManager;

    // DOM Elements
    this.levelDisplay = document.getElementById('level-display');
    this.sanityBar = document.getElementById('sanity-bar');
    this.sanityText = document.getElementById('sanity-text');
    this.hudHeader = document.querySelector('.hud-header');
    this.hudFooter = document.querySelector('.hud-footer');

    // Controls Info Badges
    this.badgeControlMode = document.getElementById('badge-control-mode');

    // Buttons
    this.btnNormal = document.getElementById('btn-decision-normal');
    this.btnAnomaly = document.getElementById('btn-decision-anomaly');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnDevDebug = document.getElementById('btn-dev-debug');
    this.btnArchive = document.getElementById('btn-archive');
    this.btnFullscreen = document.getElementById('btn-fullscreen');

    // Modals
    this.modalSettings = document.getElementById('modal-settings');
    this.modalArchive = document.getElementById('modal-archive');
    this.modalDevDebug = document.getElementById('modal-dev-debugger');
    this.modalVictory = document.getElementById('modal-victory');
    this.modalDefeat = document.getElementById('modal-defeat');
    this.glitchOverlay = document.getElementById('glitch-overlay');

    // Settings Inputs
    this.volMaster = document.getElementById('vol-master');
    this.volSfx = document.getElementById('vol-sfx');
    this.volAmbient = document.getElementById('vol-ambient');
    this.toggleHaptics = document.getElementById('toggle-haptics');
    this.sensitivityRange = document.getElementById('sensitivity-range');

    // Dev Debugger Index
    this.devAnomalyIndex = 0;

    this.initListeners();
  }

  initListeners() {
    // Decision Buttons
    if (this.btnNormal) {
      this.btnNormal.addEventListener('click', () => {
        if (this.onDecision) this.onDecision(false);
      });
    }
    if (this.btnAnomaly) {
      this.btnAnomaly.addEventListener('click', () => {
        if (this.onDecision) this.onDecision(true);
      });
    }

    // Modal Trigger Buttons
    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', () => this.openModal(this.modalSettings));
    }
    if (this.btnArchive) {
      this.btnArchive.addEventListener('click', () => this.openModal(this.modalArchive));
    }
    if (this.btnDevDebug) {
      this.btnDevDebug.addEventListener('click', () => this.openModal(this.modalDevDebug));
    }
    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', () => this.toggleFullscreenMode());
    }

    // Close Buttons for Modals
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        this.closeModal(modal);
      });
    });

    // Settings Sliders & Toggles
    if (this.volMaster) {
      this.volMaster.addEventListener('input', (e) => this.audio.setMasterVolume(parseFloat(e.target.value)));
    }
    if (this.volSfx) {
      this.volSfx.addEventListener('input', (e) => this.audio.setSFXVolume(parseFloat(e.target.value)));
    }
    if (this.volAmbient) {
      this.volAmbient.addEventListener('input', (e) => this.audio.setAmbientVolume(parseFloat(e.target.value)));
    }
    if (this.toggleHaptics) {
      this.toggleHaptics.addEventListener('change', (e) => this.haptics.setEnabled(e.target.checked));
    }

    // Keyboard Hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal(this.modalSettings);
        this.closeModal(this.modalArchive);
        this.closeModal(this.modalDevDebug);
      }
      if (e.key === '`' || e.key === '~') {
        if (this.modalDevDebug) {
          if (this.modalDevDebug.style.display === 'flex') {
            this.closeModal(this.modalDevDebug);
          } else {
            this.openModal(this.modalDevDebug);
          }
        }
      }
    });
  }

  setupDevDebugger(scene3D, gameLoop) {
    const select = document.getElementById('dev-anomaly-select');
    if (!select) return;

    select.innerHTML = '';
    ANOMALIES_DATABASE.forEach((anomaly, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.innerText = `${(index + 1).toString().padStart(2, '0')}. ${anomaly.name} (${anomaly.difficulty})`;
      select.appendChild(opt);
    });

    const updateDevInfo = () => {
      const idx = parseInt(select.value, 10);
      this.devAnomalyIndex = idx;
      const anomaly = ANOMALIES_DATABASE[idx];

      if (anomaly) {
        document.getElementById('dev-info-title').innerText = `👁️ ${anomaly.name}`;
        document.getElementById('dev-info-desc').innerText = anomaly.description;
        document.getElementById('dev-info-type').innerText = `Type: ${anomaly.type}`;
        document.getElementById('dev-info-diff').innerText = `Difficulty: ${anomaly.difficulty}`;
        document.getElementById('dev-info-id').innerText = `ID: ${anomaly.id}`;
      }
    };

    select.addEventListener('change', updateDevInfo);
    updateDevInfo();

    // PREV / NEXT Buttons
    document.getElementById('btn-dev-prev').addEventListener('click', () => {
      let idx = (this.devAnomalyIndex - 1 + ANOMALIES_DATABASE.length) % ANOMALIES_DATABASE.length;
      select.value = idx;
      updateDevInfo();
    });

    document.getElementById('btn-dev-next').addEventListener('click', () => {
      let idx = (this.devAnomalyIndex + 1) % ANOMALIES_DATABASE.length;
      select.value = idx;
      updateDevInfo();
    });

    // APPLY ANOMALY Button (Now sets gameLoop.hasAnomalyThisTurn = true)
    document.getElementById('btn-dev-apply').addEventListener('click', () => {
      const anomaly = ANOMALIES_DATABASE[this.devAnomalyIndex];
      if (anomaly && scene3D) {
        scene3D.resetHallway();
        anomaly.apply(scene3D);
        if (gameLoop) {
          gameLoop.hasAnomalyThisTurn = true;
          gameLoop.currentAnomaly = anomaly;
        }
        this.closeModal(this.modalDevDebug);
      }
    });

    // RESET TO NORMAL Button (Now sets gameLoop.hasAnomalyThisTurn = false)
    document.getElementById('btn-dev-reset').addEventListener('click', () => {
      if (scene3D) {
        scene3D.resetHallway();
        if (gameLoop) {
          gameLoop.hasAnomalyThisTurn = false;
          gameLoop.currentAnomaly = null;
        }
        this.closeModal(this.modalDevDebug);
      }
    });
  }

  openModal(modalEl) {
    if (!modalEl) return;
    modalEl.style.display = 'flex';
    requestAnimationFrame(() => {
      modalEl.classList.add('modal-active');
    });
  }

  closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('modal-active');
    setTimeout(() => {
      modalEl.style.display = 'none';
    }, 200);
  }

  updateLevel(level) {
    if (this.levelDisplay) {
      this.levelDisplay.innerText = `${level.toString().padStart(2, '0')} / 08`;
    }
  }

  updateSanity(sanity) {
    if (this.sanityBar) {
      this.sanityBar.style.width = `${sanity}%`;
    }
    if (this.sanityText) {
      this.sanityText.innerText = `${sanity}%`;
    }
  }

  updateArchiveCount(discovered, total) {
    const archiveBadge = document.getElementById('archive-count');
    if (archiveBadge) {
      archiveBadge.innerText = `${discovered}/${total}`;
    }
  }

  triggerGlitchFlash() {
    if (!this.glitchOverlay) return;
    this.glitchOverlay.style.opacity = '1';
    setTimeout(() => {
      this.glitchOverlay.style.opacity = '0';
    }, 400);
  }

  toggleFullscreenMode() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}
