'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface CADViewer3DProps {
  disassemblyProgress: number; // 0 to 100
  activeSubsystem: string;
  blueprintMode: 'cad' | 'exploded' | 'telemetry' | 'thermal';
  stressTemp: number;
  stressPressure: number;
  onSelectSubsystem?: (id: string) => void;
}

export default function CADViewer3D({
  disassemblyProgress,
  activeSubsystem,
  blueprintMode,
  stressTemp,
  stressPressure,
  onSelectSubsystem,
}: CADViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // References for live 3D updates without recreating scene
  const rotorRef = useRef<THREE.Group | null>(null);
  const layersRef = useRef<{
    casing: THREE.Group;
    manifold: THREE.Group;
    rotor: THREE.Group;
    bearings: THREE.Group;
    sensor: THREE.Group;
  } | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Update exploded offsets
  useEffect(() => {
    if (!layersRef.current) return;
    const offset = (disassemblyProgress / 100) * 2.8;

    layersRef.current.casing.position.z = -2 * offset;
    layersRef.current.manifold.position.z = -1 * offset;
    layersRef.current.rotor.position.z = 0;
    layersRef.current.bearings.position.z = 1 * offset;
    layersRef.current.sensor.position.z = 2 * offset;
  }, [disassemblyProgress]);

  // Update material styles based on mode & temperature
  useEffect(() => {
    if (materialsRef.current.length === 0) return;

    const isWireframe = blueprintMode === 'cad';
    const isThermal = blueprintMode === 'thermal';

    // Calculate thermal color
    const heatRatio = Math.min(1, Math.max(0, (stressTemp - 400) / 1400));
    const thermalColor = new THREE.Color().lerpColors(
      new THREE.Color(0x38bdf8), // cool blue
      new THREE.Color(0xf43f5e), // hot crimson
      heatRatio
    );

    materialsRef.current.forEach((mat) => {
      mat.wireframe = isWireframe;
      if (isThermal) {
        mat.color.copy(thermalColor);
        mat.emissive.copy(thermalColor).multiplyScalar(0.35);
      } else {
        mat.color.setHex(0xb0b8c4);
        mat.emissive.setHex(0x000000);
      }
    });
  }, [blueprintMode, stressTemp, stressPressure]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    materialsRef.current = [];

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);

    // 2. Camera setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.5, 3.2, 6.5);
    camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-6, -2, -4);
    scene.add(dirLight2);

    // Subtle technical floor grid
    const grid = new THREE.GridHelper(10, 20, 0x1e293b, 0x0f172a);
    grid.position.y = -1.6;
    scene.add(grid);

    // 5. Build 3D Mechanical Assembly
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Layer 1: Exterior Casing
    const casingGroup = new THREE.Group();
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });
    materialsRef.current.push(casingMat);

    const casingGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.9, 32, 1, true);
    const casingMesh = new THREE.Mesh(casingGeo, casingMat);
    casingMesh.rotation.x = Math.PI / 2;
    casingGroup.add(casingMesh);

    // Flange ring
    const flangeGeo = new THREE.TorusGeometry(1.6, 0.08, 12, 32);
    const flangeMesh = new THREE.Mesh(flangeGeo, casingMat);
    casingGroup.add(flangeMesh);

    // Layer 2: Manifold & Flange Intake
    const manifoldGroup = new THREE.Group();
    const manifoldMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2,
    });
    materialsRef.current.push(manifoldMat);

    const manifoldGeo = new THREE.TorusGeometry(1.3, 0.12, 16, 32);
    const manifoldMesh = new THREE.Mesh(manifoldGeo, manifoldMat);
    manifoldGroup.add(manifoldMesh);

    // Layer 3: Turbine Rotor Blades & Disc
    const rotorGroup = new THREE.Group();
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });
    materialsRef.current.push(rotorMat);

    const hubGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24);
    const hubMesh = new THREE.Mesh(hubGeo, rotorMat);
    hubMesh.rotation.x = Math.PI / 2;
    rotorGroup.add(hubMesh);

    // 16 Aerodynamic Turbine Blades
    const bladeGeo = new THREE.BoxGeometry(0.12, 0.8, 0.04);
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const blade = new THREE.Mesh(bladeGeo, rotorMat);
      blade.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0);
      blade.rotation.z = angle + 0.35;
      rotorGroup.add(blade);
    }
    rotorRef.current = rotorGroup;

    // Layer 4: Ceramic Bearings
    const bearingsGroup = new THREE.Group();
    const bearingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.95,
      roughness: 0.1,
    });
    materialsRef.current.push(bearingMat);

    const raceGeo = new THREE.TorusGeometry(0.7, 0.05, 12, 24);
    const raceMesh = new THREE.Mesh(raceGeo, bearingMat);
    bearingsGroup.add(raceMesh);

    // 8 Bearing balls
    const ballGeo = new THREE.SphereGeometry(0.08, 12, 12);
    for (let b = 0; b < 8; b++) {
      const bAngle = (b * Math.PI * 2) / 8;
      const ball = new THREE.Mesh(ballGeo, bearingMat);
      ball.position.set(Math.cos(bAngle) * 0.7, Math.sin(bAngle) * 0.7, 0);
      bearingsGroup.add(ball);
    }

    // Layer 5: Central Shaft & Optical Sensor Core
    const sensorGroup = new THREE.Group();
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.8,
      roughness: 0.15,
      emissive: new THREE.Color(0x2563eb),
      emissiveIntensity: 0.25,
    });
    materialsRef.current.push(shaftMat);

    const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.4, 24);
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.rotation.x = Math.PI / 2;
    sensorGroup.add(shaftMesh);

    // Add all layers to main assembly
    mainGroup.add(casingGroup);
    mainGroup.add(manifoldGroup);
    mainGroup.add(rotorGroup);
    mainGroup.add(bearingsGroup);
    mainGroup.add(sensorGroup);

    layersRef.current = {
      casing: casingGroup,
      manifold: manifoldGroup,
      rotor: rotorGroup,
      bearings: bearingsGroup,
      sensor: sensorGroup,
    };

    // 6. Interactive Mouse Orbit Controls (Zero-Dependency)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0.35;
    let targetRotationY = -0.65;
    let targetZoom = 6.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoom += e.deltaY * 0.005;
      targetZoom = Math.max(3.5, Math.min(10.5, targetZoom));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Touch support for mobile/tablets
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    container.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // 7. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera orbit
      camera.position.x += (Math.sin(targetRotationY) * Math.cos(targetRotationX) * targetZoom - camera.position.x) * 0.08;
      camera.position.y += (Math.sin(targetRotationX) * targetZoom - camera.position.y) * 0.08;
      camera.position.z += (Math.cos(targetRotationY) * Math.cos(targetRotationX) * targetZoom - camera.position.z) * 0.08;
      camera.lookAt(0, 0, 0);

      // Rotate rotor smoothly
      if (rotorRef.current) {
        rotorRef.current.rotation.z += 0.012;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '340px',
        position: 'relative',
        cursor: 'grab',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* 3D HUD Navigation Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          background: 'rgba(8, 10, 15, 0.75)',
          padding: '4px 8px',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        WEBGL 3D // ORBIT: DRAG · ZOOM: SCROLL
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 14,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--accent-cyan)',
          pointerEvents: 'none',
          background: 'rgba(8, 10, 15, 0.75)',
          padding: '4px 8px',
          borderRadius: 3,
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        RPM: 14,200 [SIMULATED]
      </div>
    </div>
  );
}
