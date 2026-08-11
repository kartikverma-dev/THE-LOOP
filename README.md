# 👁️ THE LOOP // Mind Trap

> A subterranean 3D liminal psychological horror escape game inspired by *Exit 8*, *The Stanley Parable*, and liminal space horror.

![WebGL](https://img.shields.io/badge/Engine-Three.js_WebGL-00b7ff?style=for-the-badge)
![Audio](https://img.shields.io/badge/Audio-Web_Audio_API_Synthesizer-ff2a4b?style=for-the-badge)
![License](https://img.shields.io/badge/License-Source--Available-00b7ff?style=for-the-badge)

---

## 🎮 Game Overview

You are trapped in **Sector 08**, a subterranean liminal hallway loop that repeats endlessly. To break out and reach the surface, you must observe your environment with extreme precision:

- **If everything is NORMAL**: Walk forward and click **PROCEED NORMAL ↗**.
- **If you spot ANY ANOMALY**: Turn back immediately and click **⚠️ TURN BACK - ANOMALY!**.
- Reach **Floor 8** to break the loop and escape! A single mistake resets you back to **Floor 0**.

---

## 🌟 Key Features

- **🎨 High-Fidelity 3D WebGL Graphics**: Built with Three.js featuring ACES Filmic tone mapping, SRGB color space, dynamic lighting, reflections, wet floor tiles, and 2D canvas procedural posters and signs.
- **👁️ 25 Handcrafted Anomalies**: Includes eye-tracking posters, backwards exit signs, SOS Morse code light flickering, featureless doors, wall silhouette shadows, bloody handprint window smudges, and shifted hazard floor grids.
- **👻 Proximity Jumpscare & Mannequin Chase**: A shadowy mannequin stands at the far end of the corridor. Getting too close causes its eyes to burn blood-red as it charges toward the player at full speed!
- **🔊 Web Audio API Sound Synthesizer**: High-pressure steam pipe hiss noise loops, sub-bass subterranean drones, fluorescent light buzzes, success chimes, glitch resets, and screeching horror jumpscare audio stings.
- **🎮 Universal Controller & Gamepad Support**: Full plug-and-play support for Xbox, PS5 DualSense, PS4 DualShock, Nintendo Switch Pro, and legacy PS2 USB controllers.
- **📱 Dual-Layer Haptic Engine**: Synchronized mobile device vibration (`navigator.vibrate`) and gamepad dual-motor force feedback rumble with intensity controls.
- **📱 Mobile Touch D-Pad Walk Controller**: On-screen 4-way D-Pad controls (`▲ WALK`, `▼ BACK`, `◄`, `►` turn camera) designed for mobile devices.
- **📖 Anomaly Archive Gallery**: Built-in modal tracking discovered anomalies with custom cyan scrollbar controls.
- **⚠️ Safety Features**: Photosensitivity warning screen with a Reduced Flashing Mode toggle for safe gaming.

---

## 🛠️ Technology Stack

- **Core**: HTML5, JavaScript (ES6+ Modules), Three.js (WebGL 3D Engine)
- **Audio Engine**: Web Audio API (Procedural Noise & Frequency Synthesizers)
- **Styling**: Vanilla CSS3 (Electric Neon Blue `#00b7ff` Design Tokens)
- **Build Tool**: Vite v5

---

## 🚀 Local Development Setup

Clone the repository and start the development server:

```bash
# Clone the repository
git clone https://github.com/kartikverma-dev/THE-LOOP.git

# Navigate into the project folder
cd THE-LOOP

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📜 License & Rights Notice

**THE-LOOP is source-available, not open-source.**

- **Source-Available**: The codebase is public for viewing, inspecting, learning, and testing.
- **Contributions**: Contributions and pull requests are welcome! By submitting a pull request, you grant the project maintainer permission to incorporate your contributions.
- **Copyright & Commercial Rights**: All copyright, trademark, and commercial rights remain strictly with the original author (**Kartik Verma**). Commercial re-distribution, re-branding, or selling of this software or its assets without written consent is prohibited.

Copyright (c) 2026 Kartik Verma. All Rights Reserved.
