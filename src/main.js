/* ==========================================================================
   LOOP 8 // MAIN APPLICATION BOOTSTRAP & INPUT BINDINGS
   ========================================================================== */

import { Scene3D } from './engine/Scene3D.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { HapticsManager } from './engine/HapticsManager.js';
import { GamepadManager } from './engine/GamepadManager.js';
import { GameLoop } from './game/GameLoop.js';
import { HUD } from './ui/HUD.js';

// Global Instances
let scene3D, audioEngine, hapticsManager, gamepadManager, hudUI, gameLoop;

// Input State
const keysPressed = {};
let dpadState = { up: false, down: false, left: false, right: false };
let touchLookDelta = { x: 0, y: 0 };
let isTouchingLook = false;
let lastTouchPos = { x: 0, y: 0 };
let isAutoWalking = false;

function init() {
  const canvas = document.getElementById('game-canvas');

  // 1. Instantiation (AudioEngine first so Scene3D can reference it)
  audioEngine = new AudioEngine();
  scene3D = new Scene3D(canvas, audioEngine);
  hapticsManager = new HapticsManager();
  gamepadManager = new GamepadManager();
  hudUI = new HUD(audioEngine, hapticsManager, gamepadManager);
  gameLoop = new GameLoop(scene3D, audioEngine, hapticsManager, hudUI);
  window.gameLoop = gameLoop;

  // Audio Context Resume Listener on any user click/touch
  const unlockAudio = () => {
    if (audioEngine) audioEngine.resume();
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  // 2. Decision Button Callbacks (Onscreen Buttons)
  hudUI.onDecisionCallback = (choseAnomaly) => {
    triggerDecisionWalk(choseAnomaly);
  };

  // 3. Controller Callbacks
  gamepadManager.onConnectCallback = (gp) => {
    hudUI.updateControllerStatus(gamepadManager.getGamepadName());
    hapticsManager.triggerSuccess(gp);
  };

  gamepadManager.onDisconnectCallback = () => {
    hudUI.updateControllerStatus('Touch / Keyboard');
  };

  // 4. PointerLock for Mouse Camera Look
  canvas.addEventListener('click', () => {
    if (!document.querySelector('.modal-backdrop.modal-active')) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      scene3D.cameraRotation.yaw -= e.movementX * 0.0025;
      scene3D.cameraRotation.pitch -= e.movementY * 0.0025;
      scene3D.cameraRotation.pitch = Math.max(-1.2, Math.min(1.2, scene3D.cameraRotation.pitch));
    }
  });

  // 5. Keyboard Event Listeners
  window.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal-backdrop.modal-active')) return;

    keysPressed[e.code] = true;

    if (e.code === 'Digit1') {
      triggerDecisionWalk(false);
    } else if (e.code === 'Digit2') {
      triggerDecisionWalk(true);
    }
  });

  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  // 6. Mobile Touch D-Pad Controls Setup
  setupTouchDPad();
  setupTouchControls();

  // 7. Start Game Loop & Render Animation Loop
  gameLoop.startNewGame();
  requestAnimationFrame(animate);
}

function setupTouchDPad() {
  const bindDPadBtn = (id, direction) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const startHandler = (e) => {
      e.preventDefault();
      if (audioEngine) audioEngine.resume();
      dpadState[direction] = true;
      hapticsManager.triggerFootstep();
    };

    const endHandler = (e) => {
      e.preventDefault();
      dpadState[direction] = false;
    };

    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
  };

  bindDPadBtn('btn-dpad-up', 'up');
  bindDPadBtn('btn-dpad-down', 'down');
  bindDPadBtn('btn-dpad-left', 'left');
  bindDPadBtn('btn-dpad-right', 'right');
}

function triggerDecisionWalk(choseAnomaly) {
  if (isAutoWalking || document.querySelector('.modal-backdrop.modal-active')) return;
  if (audioEngine) audioEngine.resume();
  isAutoWalking = true;

  if (!choseAnomaly) {
    // Walk forward down corridor to door
    let walkInterval = setInterval(() => {
      scene3D.playerPos.z -= 0.35;
      audioEngine.playFootstep();
      hapticsManager.triggerFootstep();

      if (scene3D.playerPos.z <= -10.5) {
        clearInterval(walkInterval);
        isAutoWalking = false;
        gameLoop.submitDecision(false);
      }
    }, 40);
  } else {
    // Turn around and walk back to start door
    scene3D.cameraRotation.yaw = Math.PI;
    let walkInterval = setInterval(() => {
      scene3D.playerPos.z += 0.35;
      audioEngine.playFootstep();
      hapticsManager.triggerFootstep();

      if (scene3D.playerPos.z >= 9.5) {
        clearInterval(walkInterval);
        isAutoWalking = false;
        gameLoop.submitDecision(true);
      }
    }, 40);
  }
}

function setupTouchControls() {
  const lookZone = document.getElementById('touch-look-zone');
  if (!lookZone) return;

  lookZone.addEventListener('touchstart', (e) => {
    if (audioEngine) audioEngine.resume();
    if (e.touches.length > 0) {
      isTouchingLook = true;
      lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  lookZone.addEventListener('touchmove', (e) => {
    if (isTouchingLook && e.touches.length > 0) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      touchLookDelta.x = (curX - lastTouchPos.x) * 0.005;
      touchLookDelta.y = (curY - lastTouchPos.y) * 0.005;
      lastTouchPos = { x: curX, y: curY };
    }
  });

  lookZone.addEventListener('touchend', () => {
    isTouchingLook = false;
    touchLookDelta = { x: 0, y: 0 };
  });
}

function animate(time) {
  requestAnimationFrame(animate);
  const delta = 0.016; // ~60fps step

  if (!document.querySelector('.modal-backdrop.modal-active') && !isAutoWalking) {
    // 1. Poll Gamepad Input
    const padInput = gamepadManager.poll();
    if (padInput) {
      scene3D.cameraRotation.yaw -= padInput.lookX * 0.03;
      scene3D.cameraRotation.pitch -= padInput.lookY * 0.03;
      scene3D.cameraRotation.pitch = Math.max(-1.2, Math.min(1.2, scene3D.cameraRotation.pitch));

      if (Math.abs(padInput.moveY) > 0.25) {
        scene3D.playerPos.z -= padInput.moveY * delta * scene3D.moveSpeed;
        audioEngine.playFootstep();
        hapticsManager.triggerFootstep(padInput.rawGamepad);
      }

      if (padInput.btnProceed) triggerDecisionWalk(false);
      if (padInput.btnAnomaly) triggerDecisionWalk(true);
    }

    // 2. WASD, Arrow Key & Mobile D-Pad Movement down the corridor
    let isMoving = false;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp'] || dpadState.up) {
      scene3D.playerPos.z -= delta * scene3D.moveSpeed;
      isMoving = true;
    }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown'] || dpadState.down) {
      scene3D.playerPos.z += delta * scene3D.moveSpeed;
      isMoving = true;
    }
    if (keysPressed['KeyA'] || dpadState.left) scene3D.cameraRotation.yaw += 0.03;
    if (keysPressed['KeyD'] || dpadState.right) scene3D.cameraRotation.yaw -= 0.03;

    // Clamp player within hallway bounds
    scene3D.playerPos.z = Math.max(-11.0, Math.min(10.0, scene3D.playerPos.z));

    if (isMoving && Math.random() < 0.15) {
      audioEngine.playFootstep();
      hapticsManager.triggerFootstep();
    }

    // Automatic Level Threshold Evaluation when walking to doors
    if (scene3D.playerPos.z <= -10.5) {
      gameLoop.submitDecision(false); // Walked to exit door -> Proceed Normal
    } else if (scene3D.playerPos.z >= 9.8 && scene3D.cameraRotation.yaw > Math.PI * 0.5) {
      gameLoop.submitDecision(true); // Turned back to start door -> Anomaly
    }

    // 3. Touch Drag Rotation
    if (isTouchingLook) {
      scene3D.cameraRotation.yaw -= touchLookDelta.x;
      scene3D.cameraRotation.pitch -= touchLookDelta.y;
      scene3D.cameraRotation.pitch = Math.max(-1.2, Math.min(1.2, scene3D.cameraRotation.pitch));
      touchLookDelta = { x: 0, y: 0 };
    }
  }

  // Update Engine Subsystems
  scene3D.update(delta);
  gameLoop.update(delta);
}

// Bootstrap on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
