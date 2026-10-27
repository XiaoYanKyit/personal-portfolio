import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PORTFOLIO_DATA, PortfolioProject } from '../data/portfolioData';
import { interpolateSceneWaypoints } from '../utils/portfolioLogic';

export interface ThreeStageProps {
  scrollProgress: number;
  activeProjectId: string;
  activeCapabilityId: string;
  reducedMotion: boolean;
  cameraMode: 'story' | 'inspection';
  onSceneReady?: () => void;
}

// Pre-allocated module-scope scratch objects to guarantee zero GC in the render loop
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 0.8, 0);
const _tempVec = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _accentColor = new THREE.Color();

function createProceduralGridTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle brushed grain lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 8) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Architectural major grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 128; i < 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(28, 48);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createBrushedBumpTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      const shade = 115 + Math.floor(Math.sin(y * 0.7) * 20);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export const ThreeStage: React.FC<ThreeStageProps> = ({
  scrollProgress,
  activeProjectId,
  activeCapabilityId,
  reducedMotion,
  cameraMode,
  onSceneReady
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFallback, setWebglFallback] = useState(false);

  // Store mutable props in a ref so React updates never tear down or recreate the WebGL canvas
  const stateRef = useRef({
    scrollProgress,
    activeProjectId,
    activeCapabilityId,
    reducedMotion,
    cameraMode,
    pointerX: 0,
    pointerY: 0
  });

  useEffect(() => {
    stateRef.current.scrollProgress = scrollProgress;
    stateRef.current.activeProjectId = activeProjectId;
    stateRef.current.activeCapabilityId = activeCapabilityId;
    stateRef.current.reducedMotion = reducedMotion;
    stateRef.current.cameraMode = cameraMode;
  }, [scrollProgress, activeProjectId, activeCapabilityId, reducedMotion, cameraMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false
      });
    } catch {
      setWebglFallback(true);
      onSceneReady?.();
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    renderer.domElement.setAttribute('data-testid', 'portfolio-3d-canvas');
    renderer.domElement.className = 'block w-full h-full';
    container.appendChild(renderer.domElement);

    // WebGL context loss safety
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFallback(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // 2. Scene, Fog & Studio Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080a);
    scene.fog = new THREE.FogExp2(0x07080a, 0.026);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 2.2, 13.5);

    // 3. Studio 3-Point Lighting Rig + Horizon Rim Lights
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090c10, 0.65);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.2);
    keyLight.position.set(8, 14, 10);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 45;
      const d = 14;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLightCyan = new THREE.PointLight(0x38bdf8, 18, 28, 1.8);
    rimLightCyan.position.set(-5, 4, 2);
    scene.add(rimLightCyan);

    const rimLightAmber = new THREE.PointLight(0xf59e0b, 14, 28, 1.8);
    rimLightAmber.position.set(6, 3.5, -10);
    scene.add(rimLightAmber);

    const horizonLight = new THREE.PointLight(0x38bdf8, 24, 40, 1.5);
    horizonLight.position.set(0, 4, -29);
    scene.add(horizonLight);

    // 4. Shared PBR Materials (Roughness varied by >= 0.25 across adjacent parts)
    const gridTexture = createProceduralGridTexture(renderer);
    const bumpTexture = createBrushedBumpTexture(renderer);

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: gridTexture,
      roughness: 0.35,
      metalness: 0.75
    });

    const obsidianMatteMaterial = new THREE.MeshStandardMaterial({
      color: 0x11141c,
      roughness: 0.78,
      metalness: 0.25,
      bumpMap: bumpTexture,
      bumpScale: 0.015
    });

    const brushedTitaniumMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x262d3d,
      roughness: 0.22,
      metalness: 0.92,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      bumpMap: bumpTexture,
      bumpScale: 0.01
    });

    const polishedChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dee9,
      roughness: 0.12,
      metalness: 0.96
    });

    const cyanEmissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.5
    });

    const amberEmissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
      roughness: 0.25,
      metalness: 0.5
    });

    const wireframeAccentMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });

    // 5. Ground Plane & Contact Shadows (disjoint Y offsets to prevent Z-fighting)
    const floorGeo = new THREE.PlaneGeometry(56, 96);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -1.6, -14);
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const contactShadowGeo = new THREE.CircleGeometry(3.8, 32);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const heroContactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    heroContactShadow.rotation.x = -Math.PI / 2;
    heroContactShadow.position.set(0, -1.58, 0);
    scene.add(heroContactShadow);

    // 6. SCENE 01 HERO ARCHITECTURAL MONOLITH (Composite 9-part THREE.Group)
    const heroMonumentGroup = new THREE.Group();
    heroMonumentGroup.position.set(0, 0.8, 0);
    scene.add(heroMonumentGroup);

    // Part 1: Beveled Extruded Architectural Portal Frame
    const frameShape = new THREE.Shape();
    frameShape.moveTo(-2.2, -2.2);
    frameShape.lineTo(2.2, -2.2);
    frameShape.lineTo(2.2, 2.2);
    frameShape.lineTo(-2.2, 2.2);
    frameShape.closePath();

    const holePath = new THREE.Path();
    holePath.moveTo(-1.65, -1.65);
    holePath.lineTo(1.65, -1.65);
    holePath.lineTo(1.65, 1.65);
    holePath.lineTo(-1.65, 1.65);
    holePath.closePath();
    frameShape.holes.push(holePath);

    const extrudeSettings = {
      steps: 1,
      depth: 0.38,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2
    };
    const portalGeo = new THREE.ExtrudeGeometry(frameShape, extrudeSettings);
    portalGeo.center();
    const outerPortal = new THREE.Mesh(portalGeo, obsidianMatteMaterial);
    outerPortal.castShadow = !isSoftwareGl;
    outerPortal.receiveShadow = !isSoftwareGl;
    heroMonumentGroup.add(outerPortal);

    // Part 2 & 3: Counter-Rotating Precision Gimbal Rings
    const outerRingGeo = new THREE.TorusGeometry(1.42, 0.045, 16, 64);
    const outerGimbal = new THREE.Mesh(outerRingGeo, brushedTitaniumMaterial);
    heroMonumentGroup.add(outerGimbal);

    const innerRingGeo = new THREE.TorusGeometry(1.05, 0.03, 16, 48);
    const innerGimbal = new THREE.Mesh(innerRingGeo, polishedChromeMaterial);
    heroMonumentGroup.add(innerGimbal);

    // Part 4: Central Sculptural Data Core (Octahedron + Wireframe Cage)
    const coreGeo = new THREE.OctahedronGeometry(0.62, 0);
    const coreMesh = new THREE.Mesh(coreGeo, brushedTitaniumMaterial);
    const coreWire = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 1), wireframeAccentMaterial);
    coreMesh.add(coreWire);
    heroMonumentGroup.add(coreMesh);

    // Part 5-8: Four Cantilevered Architectural Fins
    const finGeo = new THREE.BoxGeometry(0.16, 2.8, 0.42);
    const finOffsets: [number, number, number][] = [
      [-2.55, 0, 0.25],
      [2.55, 0, 0.25],
      [-2.55, 0, -0.25],
      [2.55, 0, -0.25]
    ];
    finOffsets.forEach(([fx, fy, fz], idx) => {
      const fin = new THREE.Mesh(finGeo, idx % 2 === 0 ? brushedTitaniumMaterial : obsidianMatteMaterial);
      fin.position.set(fx, fy, fz);
      heroMonumentGroup.add(fin);
    });

    // Part 9: Illuminated Rim Horizon Bar inside Portal
    const lightBarGeo = new THREE.BoxGeometry(3.2, 0.035, 0.04);
    const lightBar = new THREE.Mesh(lightBarGeo, cyanEmissiveMaterial);
    lightBar.position.set(0, -1.62, 0.22);
    heroMonumentGroup.add(lightBar);

    // 7. CORRIDOR ARCHITECTURAL COLONNADE (InstancedMesh of 36 Monolith Columns)
    const pillarGeo = new THREE.BoxGeometry(0.65, 7.5, 0.65);
    const pillarCount = 36;
    const pillarInstanced = new THREE.InstancedMesh(pillarGeo, obsidianMatteMaterial, pillarCount);
    pillarInstanced.receiveShadow = !isSoftwareGl;

    for (let i = 0; i < pillarCount; i++) {
      const row = Math.floor(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      const zPos = 8 - row * 2.4;
      const xPos = side * (6.2 + (row % 3) * 0.9);
      const scaleY = 0.75 + ((row * 7) % 5) * 0.14;

      _dummyObj.position.set(xPos, -1.6 + (7.5 * scaleY) / 2, zPos);
      _dummyObj.scale.set(1, scaleY, 1);
      _dummyObj.rotation.set(0, (row % 2) * 0.12 * side, 0);
      _dummyObj.updateMatrix();
      pillarInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
    pillarInstanced.instanceMatrix.needsUpdate = true;
    pillarInstanced.computeBoundingSphere();
    scene.add(pillarInstanced);

    // 8. SCENE 02 ABOUT SCULPTURE (Enterprise Operations Bridge at z = -4.5)
    const aboutGroup = new THREE.Group();
    aboutGroup.position.set(-2.4, 0.9, -4.5);
    scene.add(aboutGroup);

    const bridgePillarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.2, 0.55), obsidianMatteMaterial);
    bridgePillarLeft.position.set(-1.3, 0, 0);
    aboutGroup.add(bridgePillarLeft);

    const bridgePillarRight = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.2, 0.55), brushedTitaniumMaterial);
    bridgePillarRight.position.set(1.3, 0, 0);
    aboutGroup.add(bridgePillarRight);

    const bridgeSpan = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.24, 0.42), polishedChromeMaterial);
    bridgeSpan.position.set(0, 0.6, 0);
    aboutGroup.add(bridgeSpan);

    const bridgeSignalBeam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 0.08), cyanEmissiveMaterial);
    bridgeSignalBeam.position.set(0, 0.6, 0.24);
    aboutGroup.add(bridgeSignalBeam);

    // 9. SCENE 03 INTERACTIVE PROJECT DIORAMAS (5 Distinct Multi-Part 3D Assemblies at z = -10.5)
    const projectStageGroup = new THREE.Group();
    projectStageGroup.position.set(1.8, 0.6, -10.5);
    scene.add(projectStageGroup);

    // Pedestal Base for Project Portal
    const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.22, 32), obsidianMatteMaterial);
    pedestalBase.position.set(0, -1.65, 0);
    projectStageGroup.add(pedestalBase);

    const pedestalRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.025, 12, 64), cyanEmissiveMaterial);
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.set(0, -1.54, 0);
    projectStageGroup.add(pedestalRing);

    // 9A. Diorama 01: Warehouse Stock Counting System (Shelving racks + pallets + laser scan plane)
    const warehouseDiorama = new THREE.Group();
    const rackPostGeo = new THREE.BoxGeometry(0.08, 2.6, 0.08);
    const shelfBeamGeo = new THREE.BoxGeometry(2.4, 0.06, 0.9);
    [-1.1, 1.1].forEach((rx) => {
      [-0.4, 0.4].forEach((rz) => {
        const post = new THREE.Mesh(rackPostGeo, brushedTitaniumMaterial);
        post.position.set(rx, 0, rz);
        warehouseDiorama.add(post);
      });
    });
    [-0.9, 0, 0.9].forEach((sy) => {
      const shelf = new THREE.Mesh(shelfBeamGeo, obsidianMatteMaterial);
      shelf.position.set(0, sy, 0);
      warehouseDiorama.add(shelf);
    });
    const palletGeo = new THREE.BoxGeometry(0.46, 0.36, 0.52);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const box = new THREE.Mesh(
          palletGeo,
          (row + col) % 2 === 0 ? brushedTitaniumMaterial : polishedChromeMaterial
        );
        box.position.set(-0.7 + col * 0.7, -0.68 + row * 0.9, 0);
        warehouseDiorama.add(box);
      }
    }
    const scanBeamGeo = new THREE.BoxGeometry(2.65, 0.03, 1.15);
    const scanBeamMesh = new THREE.Mesh(scanBeamGeo, cyanEmissiveMaterial);
    warehouseDiorama.add(scanBeamMesh);
    projectStageGroup.add(warehouseDiorama);

    // 9B. Diorama 02: GPS Cancel / Remove Outlet Operations Tool (Coordinate globe ring + beacons)
    const gpsDiorama = new THREE.Group();
    const coordRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.035, 16, 64), brushedTitaniumMaterial);
    const coordRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.025, 16, 64), amberEmissiveMaterial);
    coordRing2.rotation.x = Math.PI / 3;
    const coordRing3 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.02, 16, 48), polishedChromeMaterial);
    coordRing3.rotation.y = Math.PI / 4;
    gpsDiorama.add(coordRing1, coordRing2, coordRing3);

    const pinGeo = new THREE.ConeGeometry(0.14, 0.45, 16);
    const pinPositions: [number, number, number][] = [
      [0.7, 0.5, 0.4],
      [-0.8, -0.3, 0.5],
      [0.2, 0.85, -0.5],
      [-0.4, -0.75, -0.4]
    ];
    pinPositions.forEach(([px, py, pz], idx) => {
      const pin = new THREE.Mesh(pinGeo, idx === 0 ? amberEmissiveMaterial : cyanEmissiveMaterial);
      pin.position.set(px, py, pz);
      gpsDiorama.add(pin);
    });
    projectStageGroup.add(gpsDiorama);

    // 9C. Diorama 03: SAP Data Dashboard (Analytical stepped monolith bars + orbital ring)
    const sapDiorama = new THREE.Group();
    const barHeights = [0.7, 1.2, 1.65, 2.15, 1.45, 1.9, 2.4];
    barHeights.forEach((h, idx) => {
      const barGeo = new THREE.BoxGeometry(0.24, h, 0.24);
      const bar = new THREE.Mesh(
        barGeo,
        idx === 3 || idx === 6 ? cyanEmissiveMaterial : brushedTitaniumMaterial
      );
      bar.position.set(-1.05 + idx * 0.35, -1.1 + h / 2, 0);
      sapDiorama.add(bar);
    });
    const chartFrame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.9, 0.04), wireframeAccentMaterial);
    chartFrame.position.set(0, 0.1, -0.25);
    sapDiorama.add(chartFrame);
    projectStageGroup.add(sapDiorama);

    // 9D. Diorama 04: Inventory Management System (Modular stock vault matrix)
    const inventoryDiorama = new THREE.Group();
    const stockCubes: THREE.Mesh[] = [];
    const cubeGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const cube = new THREE.Mesh(
          cubeGeo,
          (x + y) % 2 === 0 ? brushedTitaniumMaterial : obsidianMatteMaterial
        );
        cube.position.set(x * 0.68, y * 0.68, 0);
        stockCubes.push(cube);
        inventoryDiorama.add(cube);
      }
    }
    projectStageGroup.add(inventoryDiorama);

    // 9E. Diorama 05: Task Management System (Cantilevered shifting architectural layers)
    const tasksDiorama = new THREE.Group();
    const taskSlabs: THREE.Mesh[] = [];
    const slabGeo = new THREE.BoxGeometry(1.9, 0.22, 0.85);
    for (let i = 0; i < 5; i++) {
      const slab = new THREE.Mesh(
        slabGeo,
        i === 2 ? cyanEmissiveMaterial : i % 2 === 0 ? brushedTitaniumMaterial : obsidianMatteMaterial
      );
      slab.position.set(0, -0.88 + i * 0.44, 0);
      taskSlabs.push(slab);
      tasksDiorama.add(slab);
    }
    projectStageGroup.add(tasksDiorama);

    // 10. SCENE 04 TECHNICAL CAPABILITIES CONSTELLATION (z = -16.5)
    const capabilitiesGroup = new THREE.Group();
    capabilitiesGroup.position.set(0, 1.4, -16.5);
    scene.add(capabilitiesGroup);

    const capNodeMeshes = new Map<string, THREE.Mesh>();
    const nodeGeo = new THREE.OctahedronGeometry(0.26, 0);

    PORTFOLIO_DATA.capabilities.forEach((cap) => {
      const nodeMesh = new THREE.Mesh(nodeGeo, brushedTitaniumMaterial.clone());
      nodeMesh.position.set(cap.coordinates.x, cap.coordinates.y, cap.coordinates.z);
      capabilitiesGroup.add(nodeMesh);
      capNodeMeshes.set(cap.id, nodeMesh);
    });

    // Connect related capabilities with structural lines
    const linePoints: THREE.Vector3[] = [];
    PORTFOLIO_DATA.capabilities.forEach((cap) => {
      cap.connectedCapabilities.forEach((targetId) => {
        const target = PORTFOLIO_DATA.capabilities.find((c) => c.id === targetId);
        if (target) {
          linePoints.push(
            new THREE.Vector3(cap.coordinates.x, cap.coordinates.y, cap.coordinates.z),
            new THREE.Vector3(target.coordinates.x, target.coordinates.y, target.coordinates.z)
          );
        }
      });
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28
    });
    const networkLines = new THREE.LineSegments(lineGeo, lineMat);
    capabilitiesGroup.add(networkLines);

    // 11. SCENE 05 & 06 HORIZON SANCTUARY GATE (z = -28)
    const sanctuaryGroup = new THREE.Group();
    sanctuaryGroup.position.set(0, 1.4, -28.5);
    scene.add(sanctuaryGroup);

    const sanctuaryArch = new THREE.Mesh(portalGeo, brushedTitaniumMaterial);
    sanctuaryArch.scale.set(1.45, 1.45, 1.2);
    sanctuaryGroup.add(sanctuaryArch);

    const horizonBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.2, 0.18), cyanEmissiveMaterial);
    horizonBeacon.position.set(0, 0, -1.2);
    sanctuaryGroup.add(horizonBeacon);

    // 12. ATMOSPHERIC DEPTH PARTICLES (360 spatial dust motes)
    const particleCount = 360;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 26;
      particlePositions[i * 3 + 1] = -1.2 + Math.random() * 9;
      particlePositions[i * 3 + 2] = 12 - Math.random() * 44;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.055,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Pre-warm shaders on hardware WebGL
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    onSceneReady?.();

    // Pointer move listener for subtle 3D parallax
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      stateRef.current.pointerX = nx;
      stateRef.current.pointerY = ny;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Software WebGL GPU command sync helper (prevents headless Chromium screenshot starvation)
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const clock = new THREE.Clock();

    function tick() {
      if (isDisposed) return;
      const rawDelta = clock.getDelta();
      const dt = Math.min(rawDelta, 0.1);
      const elapsed = clock.getElapsedTime();

      const {
        scrollProgress: prog,
        activeProjectId: projId,
        activeCapabilityId: capId,
        reducedMotion: isReduced,
        cameraMode: mode,
        pointerX,
        pointerY
      } = stateRef.current;

      const motionScale = isReduced ? 0.08 : 1.0;

      // 1. Interpolate camera along the 6-scene spatial trajectory
      const camWaypoints = interpolateSceneWaypoints(prog);

      const parallaxX = isReduced ? 0 : pointerX * 0.55;
      const parallaxY = isReduced ? 0 : pointerY * 0.32;

      if (mode === 'inspection') {
        const orbitAngle = elapsed * 0.25 * motionScale + pointerX * 1.1;
        _targetCamPos.set(
          camWaypoints.lookAt[0] + Math.sin(orbitAngle) * 6.5,
          camWaypoints.lookAt[1] + 2.0 + parallaxY,
          camWaypoints.lookAt[2] + Math.cos(orbitAngle) * 6.5
        );
      } else {
        _targetCamPos.set(
          camWaypoints.position[0] + parallaxX,
          camWaypoints.position[1] + parallaxY,
          camWaypoints.position[2]
        );
      }

      _targetLookAt.set(
        camWaypoints.lookAt[0] + parallaxX * 0.35,
        camWaypoints.lookAt[1] + parallaxY * 0.25,
        camWaypoints.lookAt[2]
      );

      const dampLambda = isReduced ? 12 : 4.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, dampLambda, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, dampLambda, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, dampLambda, dt);

      _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _targetLookAt.x, dampLambda, dt);
      _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _targetLookAt.y, dampLambda, dt);
      _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _targetLookAt.z, dampLambda, dt);
      camera.lookAt(_currentLookAt);

      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = THREE.MathUtils.damp(scene.fog.density, camWaypoints.fogDensity, 3, dt);
      }

      // 2. Hero Architectural Monolith continuous choreography
      outerGimbal.rotation.z = elapsed * 0.18 * motionScale;
      outerGimbal.rotation.y = Math.sin(elapsed * 0.35 * motionScale) * 0.22;
      innerGimbal.rotation.x = -elapsed * 0.26 * motionScale;
      innerGimbal.rotation.y = elapsed * 0.22 * motionScale;
      coreMesh.rotation.y = elapsed * 0.35 * motionScale;
      coreMesh.rotation.x = Math.cos(elapsed * 0.25 * motionScale) * 0.3;
      heroMonumentGroup.position.y = 0.8 + Math.sin(elapsed * 0.8 * motionScale) * 0.08;

      // 3. About Sculpture subtle balance motion
      bridgeSpan.rotation.z = Math.sin(elapsed * 0.6 * motionScale) * 0.04;

      // 4. Selected Work Active Project Diorama Switching & Animation
      const activeProj: PortfolioProject =
        PORTFOLIO_DATA.projects.find((p) => p.id === projId) || PORTFOLIO_DATA.projects[0];

      warehouseDiorama.visible = activeProj.dioramaType === 'warehouse';
      gpsDiorama.visible = activeProj.dioramaType === 'gps';
      sapDiorama.visible = activeProj.dioramaType === 'sap';
      inventoryDiorama.visible = activeProj.dioramaType === 'inventory';
      tasksDiorama.visible = activeProj.dioramaType === 'tasks';

      projectStageGroup.rotation.y = elapsed * 0.22 * motionScale + pointerX * 0.25;

      if (warehouseDiorama.visible) {
        scanBeamMesh.position.y = Math.sin(elapsed * 1.6 * motionScale) * 1.05;
      } else if (gpsDiorama.visible) {
        coordRing2.rotation.z = elapsed * 0.45 * motionScale;
        coordRing3.rotation.x = -elapsed * 0.35 * motionScale;
      } else if ( inventoryDiorama.visible) {
        stockCubes.forEach((cube, idx) => {
          cube.position.z = Math.sin(elapsed * 1.4 * motionScale + idx) * 0.28;
        });
      } else if (tasksDiorama.visible) {
        taskSlabs.forEach((slab, idx) => {
          slab.position.x = Math.sin(elapsed * 1.1 * motionScale + idx * 0.9) * 0.35;
        });
      }

      // 5. Capabilities Constellation Highlighting
      const selectedCap = PORTFOLIO_DATA.capabilities.find((c) => c.id === capId);
      const connectedSet = new Set(
        selectedCap ? [selectedCap.id, ...selectedCap.connectedCapabilities] : []
      );

      capNodeMeshes.forEach((mesh, id) => {
        const isHighlighted = connectedSet.has(id);
        const targetScale = isHighlighted ? 1.38 : 0.85;
        const nextScale = THREE.MathUtils.damp(mesh.scale.x, targetScale, 6, dt);
        mesh.scale.setScalar(nextScale);
        mesh.rotation.y = elapsed * 0.5 * motionScale;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        _accentColor.setHex(id === capId ? 0xf59e0b : isHighlighted ? 0x38bdf8 : 0x334155);
        mat.emissive.lerp(_accentColor, 0.15);
        mat.emissiveIntensity = isHighlighted ? 0.9 : 0.15;
      });

      // 6. Sanctuary Horizon subtle breathing
      sanctuaryArch.rotation.z = Math.sin(elapsed * 0.2 * motionScale) * 0.05;
      particleSystem.rotation.y = elapsed * 0.015 * motionScale;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      gridTexture.dispose();
      bumpTexture.dispose();
      floorMaterial.dispose();
      obsidianMatteMaterial.dispose();
      brushedTitaniumMaterial.dispose();
      polishedChromeMaterial.dispose();
      cyanEmissiveMaterial.dispose();
      amberEmissiveMaterial.dispose();
      wireframeAccentMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#07080a]">
      <div ref={mountRef} className="w-full h-full" />

      {/* Graceful fallback if WebGL context is unavailable or lost */}
      {webglFallback && (
        <div
          data-testid="webgl-fallback-view"
          className="absolute inset-0 flex items-center justify-center bg-[#07080a] arch-grid-bg"
        >
          <div className="w-[520px] h-[520px] border border-white/10 rotate-45 flex items-center justify-center">
            <div className="w-[340px] h-[340px] border border-[#38bdf8]/30 -rotate-12" />
          </div>
        </div>
      )}

      {/* Subtle vignette & contrast scrim so editorial typography always maintains WCAG AA legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#07080a]/75 via-[#07080a]/35 to-[#07080a]/85"
      />
    </div>
  );
};
