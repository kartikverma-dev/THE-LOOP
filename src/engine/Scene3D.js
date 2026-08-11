/* ==========================================================================
   LOOP 8 // THREE.JS 3D SCENE & SUBTERRANEAN CORRIDOR RENDERER
   ========================================================================== */

import * as THREE from 'three';

export class Scene3D {
  constructor(canvasElement, audioEngine) {
    this.canvas = canvasElement;
    this.audioEngine = audioEngine;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Core Three.js Objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Lights
    this.ambientLight = null;
    this.ceilingLights = [];
    this.neonLight = null;
    this.backNeonLight = null;

    // Meshes & Textures for Props & Anomalies
    this.exitSignMesh = null;
    this.exitSignMat = null;
    this.backSignMesh = null;
    this.doorHandleMesh = null;
    this.backDoorMesh = null;
    this.backDoorHandleMesh = null;
    this.posterMesh = null;
    this.posterMat = null;
    this.posterCanvas = null;
    this.posterTexture = null;
    this.ghostShadowMesh = null;
    this.doorSmearMesh = null;
    this.cameraGroup = null;
    this.cameraHead = null;
    this.graffitiMesh = null;
    this.floorMesh = null;
    this.floorTexture = null;

    // Mannequin Jumpscare Chaser
    this.mannequinGroup = null;
    this.mannequinEyeMat = null;
    this.enableMannequinChase = false;
    this.isMannequinChasing = false;
    this.onMannequinCaughtPlayer = null;

    // Anomaly State Flags
    this.enablePosterEyeTracking = false;
    this.enableCameraTracking = false;
    this.lightFlickerMode = 'normal';
    this.enableSteamParticles = false;
    this.rotateFloorTiles = false;

    // Player Camera & Controls State
    this.playerPos = new THREE.Vector3(0, 1.6, 10);
    this.cameraRotation = { yaw: 0, pitch: 0 };
    this.moveSpeed = 4.0;
    this.lookSensitivity = 0.0025;

    // Particle System
    this.steamParticles = null;

    this.init();
  }

  init() {
    // 1. Scene & Softer Fog Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1018);
    this.scene.fog = new THREE.FogExp2(0x0c1018, 0.02);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 50);
    this.camera.position.copy(this.playerPos);

    // 3. WebGL Renderer with Tone Mapping & Exposure Boost
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.75;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Build Environment & Objects
    this.setupLighting();
    this.buildSubterraneanHallway();
    this.buildProps();
    this.setupSteamParticles();

    // 5. Window Resize Listener
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x3d4f66, 1.6);
    this.scene.add(this.ambientLight);

    // Main Electric Neon Blue Fluorescent Ceiling Tubes
    for (let z = 8; z >= -8; z -= 5) {
      const light = new THREE.PointLight(0x00b7ff, 2.8, 18);
      light.position.set(0, 2.8, z);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      this.scene.add(light);
      this.ceilingLights.push(light);
    }

    // Front Neon Accent Door Light
    this.neonLight = new THREE.PointLight(0x00b7ff, 1.8, 12);
    this.neonLight.position.set(1.8, 2.2, -10);
    this.scene.add(this.neonLight);

    // Back Entrance Accent Light
    this.backNeonLight = new THREE.PointLight(0x00b7ff, 1.5, 10);
    this.backNeonLight.position.set(-1.8, 2.2, 10);
    this.scene.add(this.backNeonLight);
  }

  setCrimsonNeonMode(enable) {
    if (enable) {
      this.ambientLight.color.setHex(0xaa1122);
      this.scene.fog.color.setHex(0x330005);
      this.scene.background.setHex(0x330005);
      this.ceilingLights.forEach(light => light.color.setHex(0xff0033));
      if (this.neonLight) this.neonLight.color.setHex(0xff0033);
      if (this.backNeonLight) this.backNeonLight.color.setHex(0xff0033);
      if (this.exitSignMat) this.exitSignMat.emissive.setHex(0xff0033);
    } else {
      this.ambientLight.color.setHex(0x3d4f66);
      this.scene.fog.color.setHex(0x0c1018);
      this.scene.background.setHex(0x0c1018);
      this.ceilingLights.forEach(light => light.color.setHex(0x00b7ff));
      if (this.neonLight) this.neonLight.color.setHex(0x00b7ff);
      if (this.backNeonLight) this.backNeonLight.color.setHex(0x00b7ff);
      if (this.exitSignMat) this.exitSignMat.emissive.setHex(0x00b7ff);
    }
  }

  buildSubterraneanHallway() {
    const width = 4;
    const height = 3.2;
    const length = 24;

    this.floorTexture = this.generateTileTexture();
    this.floorTexture.wrapS = THREE.RepeatWrapping;
    this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.repeat.set(4, 20);

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: this.floorTexture,
      roughness: 0.35,
      metalness: 0.2
    });

    // Floor (Wet Tiles)
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.floorTexture,
      roughness: 0.2,
      metalness: 0.4,
      color: 0xffffff
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 0);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.7 });
    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, height, 0);
    this.scene.add(ceiling);

    // Left & Right Walls
    const wallGeo = new THREE.PlaneGeometry(length, height);

    const leftWall = new THREE.Mesh(wallGeo, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width / 2, height / 2, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(width / 2, height / 2, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Ceiling Pipes
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 16);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x4a586c, metalness: 0.8, roughness: 0.3 });
    const pipe1 = new THREE.Mesh(pipeGeo, pipeMat);
    pipe1.rotation.x = Math.PI / 2;
    pipe1.position.set(-1.6, height - 0.2, 0);
    this.scene.add(pipe1);

    const pipe2 = new THREE.Mesh(pipeGeo, pipeMat);
    pipe2.rotation.x = Math.PI / 2;
    pipe2.position.set(-1.4, height - 0.15, 0);
    this.scene.add(pipe2);
  }

  buildProps() {
    // 1. Front Exit Sign with Illuminated Canvas Texture
    const signTexture = this.generateExitSignTexture(false);
    const signGeo = new THREE.BoxGeometry(0.9, 0.35, 0.06);
    this.exitSignMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      emissive: 0x00b7ff,
      emissiveMap: signTexture,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    this.exitSignMesh = new THREE.Mesh(signGeo, this.exitSignMat);
    this.exitSignMesh.position.set(0, 2.65, -11.8);
    this.scene.add(this.exitSignMesh);

    // Back Entrance Sign
    const backSignTexture = this.generateEntranceSignTexture();
    const backSignMat = new THREE.MeshStandardMaterial({
      map: backSignTexture,
      emissive: 0x00b7ff,
      emissiveMap: backSignTexture,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    this.backSignMesh = new THREE.Mesh(signGeo, backSignMat);
    this.backSignMesh.position.set(0, 2.65, 11.8);
    this.backSignMesh.rotation.y = Math.PI;
    this.scene.add(this.backSignMesh);

    // 2. Front Exit Door with Glass Window & Handle
    const doorGeo = new THREE.BoxGeometry(1.4, 2.4, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x242d3c, metalness: 0.5, roughness: 0.4 });
    const frontDoor = new THREE.Mesh(doorGeo, doorMat);
    frontDoor.position.set(0, 1.2, -11.9);
    this.scene.add(frontDoor);

    const windowFrameGeo = new THREE.BoxGeometry(0.7, 0.5, 0.12);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const frontWindowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    frontWindowFrame.position.set(0, 1.6, -11.88);
    this.scene.add(frontWindowFrame);

    const glassPaneGeo = new THREE.PlaneGeometry(0.6, 0.4);
    const glassPaneMat = new THREE.MeshStandardMaterial({
      color: 0x00b7ff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.9
    });
    const frontGlassPane = new THREE.Mesh(glassPaneGeo, glassPaneMat);
    frontGlassPane.position.set(0, 1.6, -11.82);
    this.scene.add(frontGlassPane);

    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });
    this.doorHandleMesh = new THREE.Mesh(handleGeo, handleMat);
    this.doorHandleMesh.rotation.z = Math.PI / 2;
    this.doorHandleMesh.position.set(0.5, 1.1, -11.8);
    this.scene.add(this.doorHandleMesh);

    // Back Entrance Door with Glass Window Frame
    this.backDoorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.backDoorMesh.position.set(0, 1.2, 11.9);
    this.scene.add(this.backDoorMesh);

    const backWindowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    backWindowFrame.position.set(0, 1.6, 11.88);
    this.scene.add(backWindowFrame);

    const backGlassPane = new THREE.Mesh(glassPaneGeo, glassPaneMat);
    backGlassPane.position.set(0, 1.6, 11.82);
    backGlassPane.rotation.y = Math.PI;
    this.scene.add(backGlassPane);

    this.backDoorHandleMesh = new THREE.Mesh(handleGeo, handleMat);
    this.backDoorHandleMesh.rotation.z = Math.PI / 2;
    this.backDoorHandleMesh.position.set(-0.5, 1.1, 11.8);
    this.scene.add(this.backDoorHandleMesh);

    // Door Smear Handprint Mesh
    const handprintTexture = this.generateHandprintTexture();
    const smearGeo = new THREE.PlaneGeometry(0.35, 0.35);
    const smearMat = new THREE.MeshBasicMaterial({ map: handprintTexture, transparent: true, opacity: 0.95 });
    this.doorSmearMesh = new THREE.Mesh(smearGeo, smearMat);
    this.doorSmearMesh.position.set(0.05, 1.6, -11.81);
    this.doorSmearMesh.visible = false;
    this.scene.add(this.doorSmearMesh);

    // 3. Wall Security Poster with Detailed Canvas Graphic
    this.posterTexture = this.generatePosterTexture(0);
    const posterGeo = new THREE.PlaneGeometry(1.0, 1.4);
    this.posterMat = new THREE.MeshStandardMaterial({
      map: this.posterTexture,
      roughness: 0.3,
      metalness: 0.1
    });
    this.posterMesh = new THREE.Mesh(posterGeo, this.posterMat);
    this.posterMesh.position.set(-1.98, 1.6, 0);
    this.posterMesh.rotation.y = Math.PI / 2;
    this.scene.add(this.posterMesh);

    // 4. Wall Spray Graffiti ("MIND TRAP")
    const graffitiTexture = this.generateGraffitiTexture("MIND TRAP");
    const graffitiGeo = new THREE.PlaneGeometry(2.2, 0.8);
    const graffitiMat = new THREE.MeshBasicMaterial({ map: graffitiTexture, transparent: true, opacity: 0.9 });
    this.graffitiMesh = new THREE.Mesh(graffitiGeo, graffitiMat);
    this.graffitiMesh.position.set(1.98, 1.6, 2);
    this.graffitiMesh.rotation.y = -Math.PI / 2;
    this.scene.add(this.graffitiMesh);

    // 5. Ghost Shadow Silhouette
    const shadowGeo = new THREE.PlaneGeometry(0.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85 });
    this.ghostShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.ghostShadowMesh.position.set(1.99, 1.0, -2);
    this.ghostShadowMesh.rotation.y = -Math.PI / 2;
    this.ghostShadowMesh.visible = false;
    this.scene.add(this.ghostShadowMesh);

    // 6. DETAILED 3D SURVEILLANCE CAMERA MODEL
    this.cameraGroup = new THREE.Group();
    this.cameraGroup.position.set(1.85, 2.5, 2.0);

    const baseGeo = new THREE.BoxGeometry(0.08, 0.2, 0.2);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    this.cameraGroup.add(baseMesh);

    const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 12);
    const armMesh = new THREE.Mesh(armGeo, metalMat);
    armMesh.rotation.z = Math.PI / 3;
    armMesh.position.set(-0.1, -0.08, 0);
    this.cameraGroup.add(armMesh);

    this.cameraHead = new THREE.Group();
    this.cameraHead.position.set(-0.2, -0.15, 0);

    const bodyGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.35, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.5 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.rotation.z = Math.PI / 2;
    this.cameraHead.add(bodyMesh);

    const lensGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.rotation.z = Math.PI / 2;
    lensMesh.position.set(-0.18, 0, 0);
    this.cameraHead.add(lensMesh);

    const ledGeo = new THREE.SphereGeometry(0.015, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(-0.19, 0.06, 0.04);
    this.cameraHead.add(ledMesh);

    this.cameraGroup.add(this.cameraHead);
    this.scene.add(this.cameraGroup);
    this.cameraHead.rotation.set(0, 0, 0);

    // 7. DETAILED LIMINAL MANNEQUIN FIGURE WITH CHASE MECHANIC
    this.mannequinGroup = new THREE.Group();
    this.mannequinGroup.position.set(0, 0, -8.0);

    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const mannequinBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const headMesh = new THREE.Mesh(headGeo, mannequinBodyMat);
    headMesh.position.set(0, 1.6, 0);
    this.mannequinGroup.add(headMesh);

    const eyeGeo = new THREE.SphereGeometry(0.02, 12, 12);
    this.mannequinEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(eyeGeo, this.mannequinEyeMat);
    leftEye.position.set(0.06, 1.62, 0.16);
    const rightEye = new THREE.Mesh(eyeGeo, this.mannequinEyeMat);
    rightEye.position.set(-0.06, 1.62, 0.16);
    this.mannequinGroup.add(leftEye);
    this.mannequinGroup.add(rightEye);

    const torsoGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.9, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, mannequinBodyMat);
    torsoMesh.position.set(0, 1.05, 0);
    this.mannequinGroup.add(torsoMesh);

    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.7, 12);
    const leftLeg = new THREE.Mesh(legGeo, mannequinBodyMat);
    leftLeg.position.set(0.1, 0.35, 0);
    const rightLeg = new THREE.Mesh(legGeo, mannequinBodyMat);
    rightLeg.position.set(-0.1, 0.35, 0);
    this.mannequinGroup.add(leftLeg);
    this.mannequinGroup.add(rightLeg);

    this.mannequinGroup.visible = false;
    this.scene.add(this.mannequinGroup);
  }

  setFloorTileDistortion(isDistorted) {
    if (this.floorMesh && this.floorTexture) {
      if (isDistorted) {
        this.floorMesh.material.color.setHex(0xffaa00);
        this.floorTexture.repeat.set(16, 50);
      } else {
        this.floorMesh.material.color.setHex(0xffffff);
        this.floorTexture.repeat.set(4, 20);
      }
      this.floorTexture.needsUpdate = true;
      this.floorMesh.material.needsUpdate = true;
    }
  }

  generateHandprintTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#880000';

    ctx.beginPath();
    ctx.ellipse(128, 145, 38, 48, -0.1, 0, Math.PI * 2);
    ctx.fill();

    const drawFinger = (x, y, w, h, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawFinger(75, 120, 10, 28, -0.6);
    drawFinger(98, 75, 11, 40, -0.2);
    drawFinger(128, 65, 12, 44, 0);
    drawFinger(158, 75, 11, 38, 0.2);
    drawFinger(180, 95, 9, 30, 0.4);

    ctx.strokeStyle = '#880000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(110, 185); ctx.lineTo(105, 230);
    ctx.moveTo(135, 190); ctx.lineTo(138, 245);
    ctx.moveTo(155, 180); ctx.lineTo(160, 220);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  generatePosterTexture(eyeOffset = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 712;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 712);

    ctx.strokeStyle = '#00b7ff';
    ctx.lineWidth = 12;
    ctx.strokeRect(12, 12, 488, 688);

    ctx.fillStyle = '#00b7ff';
    ctx.fillRect(20, 20, 472, 80);
    ctx.fillStyle = '#07090e';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SECURITY PROTOCOL', 256, 70);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SUBTERRANEAN SECTOR 08', 256, 130);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(256, 250, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(215, 240, 24, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(297, 240, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00b7ff';
    ctx.beginPath();
    ctx.arc(215 + eyeOffset, 240, 8, 0, Math.PI * 2);
    ctx.arc(297 + eyeOffset, 240, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('1. OBSERVE ALL ANOMALIES', 40, 400);
    ctx.fillText('2. TURN BACK IF TRICKED', 40, 450);
    ctx.fillText('3. DO NOT TRUST SOUNDS', 40, 500);

    ctx.fillStyle = '#ff2a4b';
    ctx.fillRect(40, 550, 432, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUTHORITY NOTICE // LEVEL 08', 256, 590);

    return new THREE.CanvasTexture(canvas);
  }

  generateExitSignTexture(isReversed = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#02182b';
    ctx.fillRect(0, 0, 512, 200);

    ctx.strokeStyle = '#00b7ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 184);

    ctx.fillStyle = '#00b7ff';
    ctx.font = 'bold 70px monospace';
    ctx.textAlign = 'center';

    if (isReversed) {
      ctx.fillText('◀  TIXE  8', 256, 125);
    } else {
      ctx.fillText('8  EXIT  ▶', 256, 125);
    }

    return new THREE.CanvasTexture(canvas);
  }

  generateEntranceSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#02182b';
    ctx.fillRect(0, 0, 512, 200);

    ctx.strokeStyle = '#00b7ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 184);

    ctx.fillStyle = '#00b7ff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◀ ENTRANCE 0', 256, 125);

    return new THREE.CanvasTexture(canvas);
  }

  generateGraffitiTexture(text = "MIND TRAP") {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 200);

    ctx.fillStyle = '#ff2a4b';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 12;
    ctx.fillText(text, 256, 120);

    return new THREE.CanvasTexture(canvas);
  }

  setGraffitiText(text) {
    if (this.graffitiMesh) {
      this.graffitiMesh.material.map = this.generateGraffitiTexture(text);
      this.graffitiMesh.material.needsUpdate = true;
    }
  }

  setupSteamParticles() {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = -1.5 + (Math.random() - 0.5) * 0.5;
      positions[i + 1] = 2.8 + (Math.random() - 0.5) * 0.4;
      positions[i + 2] = -2 + (Math.random() - 0.5) * 3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x00b7ff,
      size: 0.15,
      transparent: true,
      opacity: 0.5
    });

    this.steamParticles = new THREE.Points(geometry, material);
    this.steamParticles.visible = false;
    this.scene.add(this.steamParticles);
  }

  generateTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1d2636';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#0a0d14';
    ctx.lineWidth = 4;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  resetHallway() {
    if (this.audioEngine) {
      this.audioEngine.stopSteamHissLoop();
    }

    if (this.exitSignMesh) {
      this.exitSignMesh.scale.x = 1;
      this.exitSignMesh.material.map = this.generateExitSignTexture(false);
      this.exitSignMesh.material.needsUpdate = true;
    }
    if (this.doorHandleMesh) {
      this.doorHandleMesh.visible = true;
      this.doorHandleMesh.position.x = 0.5;
    }
    if (this.posterMesh) {
      this.posterMesh.rotation.z = 0;
      this.posterMesh.material.map = this.generatePosterTexture(0);
      this.posterMesh.material.needsUpdate = true;
    }
    if (this.graffitiMesh) {
      this.setGraffitiText("MIND TRAP");
    }
    if (this.cameraHead) {
      this.cameraHead.rotation.set(0, 0, 0);
    }
    if (this.ghostShadowMesh) this.ghostShadowMesh.visible = false;

    // Reset Mannequin
    if (this.mannequinGroup) {
      this.mannequinGroup.visible = false;
      this.mannequinGroup.position.set(0, 0, -8.0);
      if (this.mannequinEyeMat) this.mannequinEyeMat.color.setHex(0xffffff);
    }
    this.enableMannequinChase = false;
    this.isMannequinChasing = false;

    if (this.doorSmearMesh) this.doorSmearMesh.visible = false;

    // Reset Crimson Neon Mode
    this.setCrimsonNeonMode(false);

    if (this.steamParticles) this.steamParticles.visible = false;

    this.ceilingLights.forEach(light => light.intensity = 2.8);

    // Reset Floor Tile Distortion
    this.setFloorTileDistortion(false);

    this.enablePosterEyeTracking = false;
    this.enableCameraTracking = false;
    this.lightFlickerMode = 'normal';

    // Reset player position to start of hallway
    this.playerPos.set(0, 1.6, 9);
    this.cameraRotation.yaw = 0;
    this.cameraRotation.pitch = 0;
  }

  update(delta) {
    // 1. Update Camera Position & Rotation
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.cameraRotation.yaw;
    this.camera.rotation.x = this.cameraRotation.pitch;

    // 2. Tracking Eye Anomaly Update
    if (this.enablePosterEyeTracking && this.posterMesh) {
      const eyeOffset = Math.sin(Date.now() * 0.003) * 12;
      this.posterMesh.material.map = this.generatePosterTexture(eyeOffset);
      this.posterMesh.material.needsUpdate = true;
    }

    // 3. Light Flickering Effect
    if (this.lightFlickerMode === 'morse') {
      const time = Date.now() * 0.005;
      const intensity = Math.sin(time) > 0.2 ? 2.8 : 0.4;
      this.ceilingLights.forEach(light => light.intensity = intensity);
    }

    // 4. Tracking Security Camera Anomaly
    if (this.enableCameraTracking && this.cameraHead) {
      this.cameraHead.lookAt(this.camera.position);
    }

    // 5. MANNEQUIN PROXIMITY CHASE & CATCH MECHANIC
    if (this.enableMannequinChase && this.mannequinGroup) {
      if (!this.isMannequinChasing && this.playerPos.z <= -3.5) {
        this.isMannequinChasing = true;
        if (this.mannequinEyeMat) this.mannequinEyeMat.color.setHex(0xff0000);
        if (this.audioEngine) this.audioEngine.playJumpscareSting();
      }

      if (this.isMannequinChasing) {
        this.mannequinGroup.position.z += delta * 14.0;

        if (this.mannequinGroup.position.z >= this.playerPos.z - 0.8) {
          if (this.onMannequinCaughtPlayer) {
            this.onMannequinCaughtPlayer();
          }
        }
      }
    }

    // 6. Steam Particles Movement
    if (this.enableSteamParticles && this.steamParticles) {
      const positions = this.steamParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 0.5;
        if (positions[i] < 0) positions[i] = 2.8;
      }
      this.steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
