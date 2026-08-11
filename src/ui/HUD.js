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
    this.levelDisplay = document.getElementById('level-counter') || document.getElementById('level-display');
    this.sanityBar = document.getElementById('sanity-bar-fill') || document.getElementById('sanity-bar');
    this.sanityText = document.getElementById('sanity-value') || document.getElementById('sanity-text');
    this.archiveBadge = document.getElementById('archive-badge') || document.getElementById('archive-count');

    // Decision & Action Buttons
    this.btnNormal = document.getElementById('btn-proceed-normal') || document.getElementById('btn-decision-normal');
    this.btnAnomaly = document.getElementById('btn-report-anomaly') || document.getElementById('btn-decision-anomaly');
    this.btnSettings = document.getElementById('btn-open-settings') || document.getElementById('btn-settings');
    this.btnDevDebug = document.getElementById('btn-open-dev-debug') || document.getElementById('btn-dev-debug');
    this.btnArchive = document.getElementById('btn-open-archive') || document.getElementById('btn-archive');
    this.btnFullscreen = document.getElementById('btn-toggle-fullscreen') || document.getElementById('btn-fullscreen');

    // Modals
    this.modalWarning = document.getElementById('modal-warning');
    this.modalSettings = document.getElementById('modal-settings');
    this.modalArchive = document.getElementById('modal-archive');
    this.modalDevDebug = document.getElementById('modal-dev-debugger');
    this.modalVictory = document.getElementById('modal-victory');
    this.modalDefeat = document.getElementById('modal-defeat');
    this.glitchOverlay = document.getElementById('glitch-flash-overlay') || document.getElementById('glitch-overlay');

    // Settings Inputs
    this.volMaster = document.getElementById('rng-master-volume') || document.getElementById('vol-master');
    this.volSfx = document.getElementById('vol-sfx');
    this.volAmbient = document.getElementById('vol-ambient');
    this.toggleHaptics = document.getElementById('chk-vibration-enable') || document.getElementById('toggle-haptics');
    this.sensitivityRange = document.getElementById('sensitivity-range');

    // Dev Debugger Index & Secret Counter
    this.devAnomalyIndex = 0;
    this.badgeTapCount = 0;
    this.lastTapTime = 0;

    // Callback handlers
    this.onDecision = null;
    this.onDecisionCallback = null;

    this.initListeners();
  }

  initListeners() {
    // 0. START GAME / Warning Modal Accept Button
    const btnAcceptWarning = document.getElementById('btn-accept-warning');
    if (btnAcceptWarning && this.modalWarning) {
      btnAcceptWarning.addEventListener('click', () => {
        this.closeModal(this.modalWarning);
        const hudEl = document.getElementById('hud');
        if (hudEl) {
          hudEl.classList.remove('hud-hidden');
          hudEl.style.display = 'block';
        }
        if (this.audio) {
          this.audio.resume();
          this.audio.startAmbientDrone();
        }
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
          canvas.requestPointerLock();
        }
      });
    }

    // Decision Buttons
    if (this.btnNormal) {
      this.btnNormal.addEventListener('click', () => {
        const cb = this.onDecisionCallback || this.onDecision;
        if (cb) cb(false);
      });
    }
    if (this.btnAnomaly) {
      this.btnAnomaly.addEventListener('click', () => {
        const cb = this.onDecisionCallback || this.onDecision;
        if (cb) cb(true);
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

    // Close Buttons for Modals (support .close-btn, .modal-close)
    document.querySelectorAll('.close-btn, .modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop, .modal-overlay');
        this.closeModal(modal);
      });
    });

    // Settings Sliders & Toggles
    if (this.volMaster) {
      this.volMaster.addEventListener('input', (e) => this.audio.setMasterVolume(parseFloat(e.target.value) / 100));
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

    // SECRET KEYBOARD COMBO: Shift + D (or ~ / `) to toggle Dev Debugger
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal(this.modalSettings);
        this.closeModal(this.modalArchive);
        this.closeModal(this.modalDevDebug);
      }
      
      const isShiftD = e.shiftKey && (e.key === 'D' || e.key === 'd');
      const isTilde = e.key === '`' || e.key === '~';

      if (isShiftD || isTilde) {
        e.preventDefault();
        if (this.modalDevDebug) {
          if (this.modalDevDebug.style.display === 'flex' || this.modalDevDebug.classList.contains('modal-active')) {
            this.closeModal(this.modalDevDebug);
          } else {
            this.openModal(this.modalDevDebug);
          }
        }
      }
    });

    // SECRET MOBILE TRIPLE TAP: Triple tap top-left FLOOR badge to open Dev Debugger
    const topLeftPanel = document.querySelector('.hud-top-left');
    if (topLeftPanel) {
      topLeftPanel.addEventListener('click', () => {
        const now = Date.now();
        if (now - this.lastTapTime < 500) {
          this.badgeTapCount++;
        } else {
          this.badgeTapCount = 1;
        }
        this.lastTapTime = now;

        if (this.badgeTapCount >= 3) {
          this.badgeTapCount = 0;
          this.openModal(this.modalDevDebug);
          if (this.haptics) this.haptics.triggerSuccess();
        }
      });
    }
  }

  setupDevDebugger(scene3D, gameLoop) {
    const select = document.getElementById('select-dev-anomaly') || document.getElementById('dev-anomaly-select');
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
    const btnPrev = document.getElementById('btn-dev-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        let idx = (this.devAnomalyIndex - 1 + ANOMALIES_DATABASE.length) % ANOMALIES_DATABASE.length;
        select.value = idx;
        updateDevInfo();
      });
    }

    const btnNext = document.getElementById('btn-dev-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        let idx = (this.devAnomalyIndex + 1) % ANOMALIES_DATABASE.length;
        select.value = idx;
        updateDevInfo();
      });
    }

    // APPLY ANOMALY Button
    const btnApply = document.getElementById('btn-dev-apply');
    if (btnApply) {
      btnApply.addEventListener('click', () => {
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
    }

    // RESET TO NORMAL Button
    const btnReset = document.getElementById('btn-dev-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
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
      this.levelDisplay.innerHTML = `${level.toString().padStart(2, '0')} <span class="level-total">/ 08</span>`;
    }
    const progressBar = document.getElementById('level-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${(level / 8) * 100}%`;
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
    if (this.archiveBadge) {
      this.archiveBadge.innerText = `${discovered}/${total}`;
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
