/* ==========================================================================
   LOOP 8 // ANOMALY DATABASE (25 Handcrafted Visual, Spatial & Audio Tricks)
   ========================================================================== */

export const ANOMALIES_DATABASE = [
  {
    id: 'reversed-exit-sign',
    name: 'Reversed Exit Sign',
    description: 'The overhead corridor Exit sign is printed backwards (◀ TIXE 8).',
    difficulty: 'Easy',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.exitSignMesh) {
        const revTex = scene3D.generateExitSignTexture(true);
        scene3D.exitSignMesh.material.map = revTex;
        scene3D.exitSignMesh.material.emissiveMap = revTex;
        scene3D.exitSignMesh.material.needsUpdate = true;
      }
    }
  },
  {
    id: 'poster-tracking-eyes',
    name: 'Tracking Eye Poster',
    description: 'The eyes on the poster alter position to follow your camera view.',
    difficulty: 'Medium',
    type: 'visual',
    apply: (scene3D) => {
      scene3D.enablePosterEyeTracking = true;
    }
  },
  {
    id: 'ghost-shadow',
    name: 'Unaccompanied Wall Shadow',
    description: 'A silhouette human shadow is cast on the tile wall without any person present.',
    difficulty: 'Medium',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.ghostShadowMesh) {
        scene3D.ghostShadowMesh.visible = true;
      }
    }
  },
  {
    id: 'flickering-morse-code',
    name: 'SOS Morse Code Lights',
    description: 'Ceiling fluorescent light fixture flashes in an SOS rhythm.',
    difficulty: 'Medium',
    type: 'auditory_visual',
    apply: (scene3D) => {
      scene3D.lightFlickerMode = 'morse';
    }
  },
  {
    id: 'missing-door-handle',
    name: 'Featureless Exit Door',
    description: 'The exit door frame is completely smooth with no handle or knob.',
    difficulty: 'Easy',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.doorHandleMesh) {
        scene3D.doorHandleMesh.visible = false;
      }
    }
  },
  {
    id: 'security-camera-stare',
    name: 'Tracking Security Camera',
    description: 'The wall security camera swivels directly toward your player camera.',
    difficulty: 'Hard',
    type: 'visual',
    apply: (scene3D) => {
      scene3D.enableCameraTracking = true;
    }
  },
  {
    id: 'red-neon-warning',
    name: 'Ominous Crimson Neon',
    description: 'The entire corridor lights, fog, ambient glow, and signs turn bright blood red.',
    difficulty: 'Easy',
    type: 'visual',
    apply: (scene3D) => {
      scene3D.setCrimsonNeonMode(true);
    }
  },
  {
    id: 'inverted-gravity-poster',
    name: 'Inverted Wall Poster',
    description: 'The warning poster on the left corridor wall is hung upside down.',
    difficulty: 'Easy',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.posterMesh) {
        scene3D.posterMesh.rotation.z = Math.PI;
      }
    }
  },
  {
    id: 'wall-graffiti-change',
    name: 'Altered Wall Graffiti',
    description: 'The wall graffiti changed from "MIND TRAP" to "DON\'T LOOK BACK".',
    difficulty: 'Medium',
    type: 'visual',
    apply: (scene3D) => {
      scene3D.setGraffitiText("DON'T LOOK BACK");
    }
  },
  {
    id: 'mannequin-standing',
    name: 'Liminal Mannequin Figure',
    description: 'A shadowy mannequin figure stands at the far end of the corridor. If you walk too close, it charges to catch you!',
    difficulty: 'Easy',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.mannequinGroup) {
        scene3D.mannequinGroup.visible = true;
        scene3D.enableMannequinChase = true;
      }
    }
  },
  {
    id: 'missing-ceiling-light',
    name: 'Severed Ceiling Light',
    description: 'One ceiling fluorescent light fixture is completely blacked out.',
    difficulty: 'Medium',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.ceilingLights[2]) {
        scene3D.ceilingLights[2].intensity = 0;
      }
    }
  },
  {
    id: 'steam-pipe-leak',
    name: 'Hissing Ceiling Pipe Steam',
    description: 'Steam particle mist escapes aggressively from ceiling pipes with high-pressure hiss sound.',
    difficulty: 'Easy',
    type: 'auditory_visual',
    apply: (scene3D) => {
      scene3D.enableSteamParticles = true;
      if (scene3D.audioEngine) {
        scene3D.audioEngine.startSteamHissLoop();
      }
    }
  },
  {
    id: 'inverted-floor-tiles',
    name: 'Shifted Tile Floor Grid',
    description: 'Floor tile grid turns into glowing hazard orange distorted micro-tiles.',
    difficulty: 'Hard',
    type: 'visual',
    apply: (scene3D) => {
      scene3D.setFloorTileDistortion(true);
    }
  },
  {
    id: 'door-knob-wrong-side',
    name: 'Hinge-Side Door Knob',
    description: 'The door knob is installed on the hinge side of the exit door.',
    difficulty: 'Hard',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.doorHandleMesh) {
        scene3D.doorHandleMesh.position.x = -scene3D.doorHandleMesh.position.x;
      }
    }
  },
  {
    id: 'blood-smear-door',
    name: 'Window Smudge Handprint',
    description: 'A dark handprint smudge appears on the exit door glass window.',
    difficulty: 'Medium',
    type: 'visual',
    apply: (scene3D) => {
      if (scene3D.doorSmearMesh) {
        scene3D.doorSmearMesh.visible = true;
      }
    }
  }
];
