/* ==========================================================================
   LOOP 8 // GAMEPAD MANAGER (Universal Controller Engine with Edge Triggers)
   ========================================================================== */

export class GamepadManager {
  constructor() {
    this.activeGamepad = null;
    this.gamepadIndex = null;
    this.deadzone = 0.25;
    this.onConnectCallback = null;
    this.onDisconnectCallback = null;

    // Last state for edge-trigger detection
    this.lastButtonStates = {};

    // Controller button defaults (Standard Gamepad Mapping)
    this.padMap = {
      proceed: 0, // A / Cross
      anomaly: 1, // B / Circle
      inspect: 2, // X / Square
      menu: 9     // Start / Options
    };

    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.activeGamepad = e.gamepad;
      if (this.onConnectCallback) this.onConnectCallback(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.activeGamepad = null;
        if (this.onDisconnectCallback) this.onDisconnectCallback();
      }
    });
  }

  poll() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return null;

    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        this.activeGamepad = gamepads[i];
        this.gamepadIndex = i;
        return this.parseInputs(gamepads[i]);
      }
    }
    return null;
  }

  parseInputs(gp) {
    const axes = gp.axes || [];
    const buttons = gp.buttons || [];

    const applyDeadzone = (val) => Math.abs(val) > this.deadzone ? val : 0;

    // Standard Dual Analog Sticks
    const moveX = applyDeadzone(axes[0] || 0); // Left stick X
    const moveY = applyDeadzone(axes[1] || 0); // Left stick Y
    const lookX = applyDeadzone(axes[2] || axes[3] || 0); // Right stick X
    const lookY = applyDeadzone(axes[3] || axes[4] || 0); // Right stick Y

    // Helper for button edge-detection (just pressed this frame)
    const isJustPressed = (idx) => {
      const pressedNow = buttons[idx] && (buttons[idx].pressed || buttons[idx].value > 0.6);
      const pressedBefore = !!this.lastButtonStates[idx];
      this.lastButtonStates[idx] = pressedNow;
      return pressedNow && !pressedBefore;
    };

    const btnProceed = isJustPressed(this.padMap.proceed);
    const btnAnomaly = isJustPressed(this.padMap.anomaly);

    return {
      name: gp.id || 'Generic USB Gamepad',
      moveX,
      moveY,
      lookX,
      lookY,
      btnProceed,
      btnAnomaly,
      rawGamepad: gp
    };
  }

  getGamepadName() {
    if (!this.activeGamepad) return 'Touch / Keyboard';
    const id = this.activeGamepad.id.toLowerCase();
    if (id.includes('dualsense') || id.includes('dualshock') || id.includes('054c')) return 'PlayStation Controller';
    if (id.includes('xbox') || id.includes('045e')) return 'Xbox Controller';
    if (id.includes('switch') || id.includes('057e')) return 'Switch Pro Controller';
    return 'USB Gamepad Connected';
  }
}
