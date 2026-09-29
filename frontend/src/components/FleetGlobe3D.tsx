'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface LocationPin {
  name: string;
  partId: string;
  lat: number;
  lng: number;
  status: string;
}

const LOCATIONS: LocationPin[] = [
  { name: 'Boeing EcoDemonstrator', partId: 'HP47291', lat: 47.6062, lng: -122.3321, status: 'active' },
  { name: 'Ariane 6 Space Gimbal', partId: 'HYDRO-ACT-9900', lat: 5.237, lng: -52.768, status: 'failed' },
  { name: 'Rolls-Royce Engine Bay', partId: 'TITAN-TURBINE-X1', lat: 52.9225, lng: -1.4746, status: 'active' },
  { name: 'Rigetti Quantum Cluster', partId: 'QC-CRYOPUMP-88', lat: 37.8715, lng: -122.273, status: 'active' },
  { name: 'Ferrari Hypercar Team', partId: 'CERAMIC-ROTOR-Z', lat: 44.5292, lng: 10.8654, status: 'retired' },
  { name: 'Gigafactory Fab-09', partId: 'SIC-INVERTER-800V', lat: 52.3906, lng: 13.7915, status: 'failed' },
  { name: 'DARPA Hypersonic Unit', partId: 'OPTICAL-GYRO-NAV', lat: 34.9055, lng: -117.8837, status: 'active' },
  { name: 'AESA Radar Array', partId: 'MAGNETRON-PULSE-X', lat: 41.5055, lng: -71.3128, status: 'active' },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export default function FleetGlobe3D({ onSelectPart }: { onSelectPart?: (partId: string) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 5.8);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    // 5. Globe Meshes
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const radius = 2.0;

    // Inner dark sphere
    const sphereGeo = new THREE.SphereGeometry(radius, 48, 48);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0c111a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(globeMesh);

    // Wireframe atmosphere shell
    const wireGeo = new THREE.SphereGeometry(radius * 1.008, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Equator & longitude rings
    const ringGeo = new THREE.RingGeometry(radius * 1.25, radius * 1.27, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    globeGroup.add(orbitRing);

    // Add Location Beacons
    LOCATIONS.forEach(loc => {
      const pos = latLngToVector3(loc.lat, loc.lng, radius * 1.02);

      // Pin head
      const pinGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const isFailed = loc.status === 'failed';
      const pinMat = new THREE.MeshBasicMaterial({
        color: isFailed ? 0xf43f5e : 0x10b981,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      globeGroup.add(pinMesh);

      // Pin stem to surface
      const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8);
      const stemMesh = new THREE.Mesh(stemGeo, pinMat);
      stemMesh.position.copy(pos.clone().multiplyScalar(0.97));
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      globeGroup.add(stemMesh);
    });

    // 6. Mouse Interaction & Orbit
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotX = 0.2;
    let rotY = 0.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;
      rotY += deltaX * 0.006;
      rotX += deltaY * 0.006;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 7. Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Auto slow rotation if not dragging
      if (!isDragging) {
        rotY += 0.002;
      }

      globeGroup.rotation.y = rotY;
      globeGroup.rotation.x = rotX;

      renderer.render(scene, camera);
    };

    animate();

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
        height: '520px',
        position: 'relative',
        cursor: 'grab',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-pure)',
          pointerEvents: 'none',
        }}
      >
        3D GLOBAL ASSET FLEET GLOBE // ORBIT: DRAG TO ROTATE
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 20,
          display: 'flex',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          pointerEvents: 'none',
        }}
      >
        <span style={{ color: '#10b981' }}>● ACTIVE DEPLOYMENTS (8)</span>
        <span style={{ color: '#f43f5e' }}>● CRITICAL ANOMALIES (2)</span>
        <span style={{ color: '#f59e0b' }}>● RETIRED / SCHEDULED (1)</span>
      </div>
    </div>
  );
}
