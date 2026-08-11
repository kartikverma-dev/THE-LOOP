/* ==========================================================================
   LOOP 8 // HUD UI INTERFACE & EVENT BINDINGS
   ========================================================================== */

import { ANOMALIES_DATABASE } from '../engine/Anomalies.js';

export class HUD {
  constructor(audioEngine, hapticsManager, gamepadManager) {
    this.audio = audioEngine;
    this.haptics = hapticsManager;
    this.gamepad = gamepadManager;

    // DOM Elements
    this.elHud = document.getElementById('hud');
    this.elLevelCounter = document.getElementById('level-counter');
    this.elLevelProgressBar = document.getElementById('level-progress-bar');
    this.elSanityValue = document.getElementById('sanity-value');
    this.elSanityBarFill = document.getElementById('sanity-bar-fill');
    this.elGlitchFlash = document.getElementById('glitch-flash-overlay');
    this.elControllerName = document.getElementById('controller-name');
    this.elArchiveBadge = document.getElementById('archive-badge');
    this.elArchiveCountText = document.getElementById('archive-count-text');
    this.elArchiveProgressFill = document.getElementById('archive-progress-fill');
    this.elArchiveGrid = document.getElementById('archive-grid');

    // Decision Buttons
    this.btnProceed = document.getElementById('btn-proceed-normal');
    this.btnAnomaly = document.getElementById('btn-report-anomaly');

    // Modals
    this.modalWarning = document.getElementById('modal-warning');
    this.modalSettings = document.getElementById('modal-settings');
    this.modalArchive = document.getElementById('modal-archive');
    this.modalVictory = document.getElementById('modal-victory');
    this.modalDevDebug = document.getElementById('modal-dev-debugger');

    // Dev Debugger State
    this.devAnomalyIndex = 0;

    // Waveform Animation
    this.wavePath = document.getElementById('wave-path');
    this.wavePhase = 0;

    this.onDecisionCallback = null;
    this.initEventListeners();
    this.startWaveformAnimation();
  }

  initEventListeners() {
    // 1. Startup Photosensitivity Warning
    const btnAccept = document.getElementById('btn-accept-warning');
    if (btnAccept) {
      btnAccept.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.closeModal(this.modalWarning);
        this.elHud.classList.remove('hud-hidden');
        this.audio.init();

        if (document.getElementById('chk-reduced-flashing').checked) {
          document.getElementById('crt-overlay').classList.remove('crt-active');
        }
      });
    }

    // 2. Decision Button Triggers
    this.btnProceed.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.onDecisionCallback) this.onDecisionCallback(false);
    });

    this.btnAnomaly.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.onDecisionCallback) this.onDecisionCallback(true);
    });

    // 3. Modal Toggles
    document.getElementById('btn-open-settings').addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal(this.modalSettings);
    });

    document.getElementById('btn-close-settings').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal(this.modalSettings);
    });

    document.getElementById('btn-open-archive').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderArchiveGallery();
      this.openModal(this.modalArchive);
    });

    document.getElementById('btn-close-archive').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal(this.modalArchive);
    });

    document.getElementById('btn-toggle-fullscreen').addEventListener('click', (e) => {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // 4. Dev Debugger Modal Toggle
    document.getElementById('btn-open-dev-debug').addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal(this.modalDevDebug);
    });

    document.getElementById('btn-close-dev-debug').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal(this.modalDevDebug);
    });

    // Hotkey ` (Tilde / Backtick) to toggle Dev Debugger
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        if (this.modalDevDebug.classList.contains('modal-active')) {
          this.closeModal(this.modalDevDebug);
        } else {
          this.openModal(this.modalDevDebug);
        }
      }
    });

    // 5. Offline Game Download Button
    document.getElementById('btn-offline-download').addEventListener('click', (e) => {
      e.preventDefault();
      this.downloadStandaloneGame();
    });

    // 6. Settings Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        e.target.classList.add('active');
        const tabId = e.target.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });

    // 7. Test Vibration Button
    document.getElementById('btn-test-vibration').addEventListener('click', (e) => {
      e.preventDefault();
      this.haptics.triggerHeartbeat();
    });

    // Vibration Toggle & Strength Slider
    document.getElementById('chk-vibration-enable').addEventListener('change', (e) => {
      this.haptics.setEnabled(e.target.checked);
    });

    document.getElementById('rng-vibration-strength').addEventListener('input', (e) => {
      this.haptics.setIntensity(parseFloat(e.target.value) / 10);
    });

    // Restart & Share Victory Buttons
    document.getElementById('btn-restart-game').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal(this.modalVictory);
      if (window.gameLoop) window.gameLoop.startNewGame();
    });

    document.getElementById('btn-share-stats').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const time = document.getElementById('victory-time').innerText;
      const resets = document.getElementById('victory-resets').innerText;
      const text = `🏆 I Escaped LOOP 8 // MIND TRAP in ${time} with ${resets} resets! Can you spot the anomalies?`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
      
      const btn = document.getElementById('btn-share-stats');
      btn.innerText = '✓ COPIED TO CLIPBOARD!';
      setTimeout(() => {
        btn.innerText = '📋 COPY RESULTS';
      }, 2500);
    });
  }

  setupDevDebugger(scene3D) {
    const select = document.getElementById('select-dev-anomaly');
    if (!select) return;

    select.innerHTML = '';
    ANOMALIES_DATABASE.forEach((a, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.innerText = `${(i + 1).toString().padStart(2, '0')}. ${a.name} [${a.difficulty}]`;
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

    // APPLY ANOMALY Button
    document.getElementById('btn-dev-apply').addEventListener('click', () => {
      const anomaly = ANOMALIES_DATABASE[this.devAnomalyIndex];
      if (anomaly && scene3D) {
        scene3D.resetHallway();
        anomaly.apply(scene3D);
        this.closeModal(this.modalDevDebug);
      }
    });

    // RESET TO NORMAL Button
    document.getElementById('btn-dev-reset').addEventListener('click', () => {
      if (scene3D) {
        scene3D.resetHallway();
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
    modalEl.style.display = 'none';
  }

  updateLevel(levelNum) {
    const formatted = levelNum.toString().padStart(2, '0');
    this.elLevelCounter.innerHTML = `${formatted} <span class="level-total">/ 08</span>`;
    const pct = (levelNum / 8) * 100;
    this.elLevelProgressBar.style.width = `${pct}%`;
  }

  updateSanity(val) {
    const rounded = Math.round(val);
    this.elSanityValue.innerText = `${rounded}%`;
    this.elSanityBarFill.style.width = `${rounded}%`;
  }

  updateControllerStatus(name) {
    this.elControllerName.innerText = name;
  }

  updateArchiveCount(discoveredCount, totalCount) {
    this.elArchiveBadge.innerText = discoveredCount.toString();
    this.elArchiveCountText.innerText = `${discoveredCount} / ${totalCount}`;
    const pct = (discoveredCount / totalCount) * 100;
    this.elArchiveProgressFill.style.width = `${pct}%`;
  }

  triggerGlitchFlash() {
    this.elGlitchFlash.classList.add('flash-active');
    setTimeout(() => {
      this.elGlitchFlash.classList.remove('flash-active');
    }, 450);
  }

  renderArchiveGallery() {
    this.elArchiveGrid.innerHTML = '';
    const discovered = new Set(JSON.parse(localStorage.getItem('loop8_discovered') || '[]'));

    ANOMALIES_DATABASE.forEach(anomaly => {
      const isDiscovered = discovered.has(anomaly.id);
      const card = document.createElement('div');
      card.className = `archive-card ${isDiscovered ? 'discovered' : ''}`;

      if (isDiscovered) {
        card.innerHTML = `
          <div class="archive-title">👁️ ${anomaly.name}</div>
          <div class="archive-desc">${anomaly.description}</div>
          <span class="badge" style="background:#00f3ff; color:#000; align-self:flex-start;">${anomaly.difficulty}</span>
        `;
      } else {
        card.innerHTML = `
          <div class="archive-title" style="color:var(--color-text-muted)">❓ UNDISCOVERED ANOMALY</div>
          <div class="archive-desc">Play more runs to catalog this hidden trick.</div>
        `;
      }
      this.elArchiveGrid.appendChild(card);
    });
  }

  showVictoryModal(stats) {
    document.getElementById('victory-time').innerText = stats.time;
    document.getElementById('victory-resets').innerText = stats.resets;
    document.getElementById('victory-precision').innerText = stats.precision;
    this.openModal(this.modalVictory);
  }

  downloadStandaloneGame() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Loop8_MindTrap_OfflineGame.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  startWaveformAnimation() {
    const animate = () => {
      this.wavePhase += 0.1;
      let d = 'M 0 12';
      for (let x = 0; x <= 100; x += 10) {
        const y = 12 + Math.sin(this.wavePhase + x * 0.2) * 5;
        d += ` Q ${x + 5} ${y} ${x + 10} 12`;
      }
      if (this.wavePath) this.wavePath.setAttribute('d', d);
      requestAnimationFrame(animate);
    };
    animate();
  }
}
