// app/tools/polarization/poincare-three.tsx — Three.js 庞加莱球 3D 渲染

"use client";

import React, { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";

interface PointData {
  elementId: string;
  elementLabel: string;
  coords: { x: number; y: number; z: number };
  onSurface: boolean;
}

interface Props {
  points: PointData[];
  mode: 'single' | 'trajectory';
  selectedIndex?: number;
}

export default function PoincareThree({ points, mode, selectedIndex }: Props) {
  const [pixelRatio, setPixelRatio] = useState(2);
  useEffect(() => { setPixelRatio(Math.min(window.devicePixelRatio || 2, 2)); }, []);

  return (
    <Canvas camera={{ position: [1.6, 1.0, 1.8], fov: 45 }} dpr={pixelRatio}
      style={{ background: '#FAFBFC' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 5]} intensity={0.6} />
      <PoincareScene points={points} mode={mode} selectedIndex={selectedIndex} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={1.1} maxDistance={4} />
    </Canvas>
  );
}

function PoincareScene({ points, mode, selectedIndex }: Props) {
  const lastRender = useRef(0);
  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    if (now - lastRender.current < 1/30) return;
    lastRender.current = now;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 64, 32), []);

  // Grid lines
  const gridLineGeos = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    // Parallels
    for (let lat = -80; lat <= 80; lat += 10) {
      const phi = lat * Math.PI / 180;
      const r = Math.cos(phi);
      const y = Math.sin(phi);
      const pts: number[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * 2 * Math.PI;
        pts.push(r * Math.cos(theta), y, r * Math.sin(theta));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      geos.push(geo);
    }
    // Meridians
    for (let lon = 0; lon < 180; lon += 10) {
      const theta = lon * Math.PI / 180;
      const pts: number[] = [];
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        pts.push(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      geos.push(geo);
    }
    return geos;
  }, []);

  // Equator bold geometry
  const equatorGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * 2 * Math.PI;
      pts.push(Math.cos(theta), 0, Math.sin(theta));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  const trajectoryPts = useMemo(() => points.map(p => new THREE.Vector3(p.coords.x, p.coords.z, p.coords.y)), [points]);

  const pointColor = useCallback((p: PointData) => {
    const zAbs = Math.abs(p.coords.z);
    if (zAbs < 0.02) return '#2563EB';
    if (zAbs > 0.98) return '#DC2626';
    return '#F59E0B';
  }, []);

  // Single point data
  const singlePointData = mode === 'single' && selectedIndex !== undefined && selectedIndex < points.length
    ? { p: points[selectedIndex], col: pointColor(points[selectedIndex]) } : null;

  return (
    <group>
      {/* Transparent sphere */}
      <mesh geometry={sphereGeo}>
        <meshBasicMaterial color="#D1D5DB" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Grid lines — create positions arrays for drei Line */}
      {gridLineGeos.map((geo, i) => {
        const positions = (geo.attributes.position.array as Float32Array);
        const pts: THREE.Vector3[] = [];
        for (let j = 0; j < positions.length; j += 3) {
          pts.push(new THREE.Vector3(positions[j], positions[j+1], positions[j+2]));
        }
        const firstY = positions[1];
        const isEquatorLike = Math.abs(firstY) < 0.005;
        return <Line key={i} points={pts} color={isEquatorLike ? '#9CA3AF' : '#E5E7EB'} lineWidth={0.5} transparent opacity={isEquatorLike ? 0.6 : 0.2} />;
      })}

      {/* Equator bold */}
      {(() => {
        const positions = equatorGeo.attributes.position.array as Float32Array;
        const pts: THREE.Vector3[] = [];
        for (let j = 0; j < positions.length; j += 3) {
          pts.push(new THREE.Vector3(positions[j], positions[j+1], positions[j+2]));
        }
        return <Line points={pts} color="#6B7280" lineWidth={2} />;
      })()}

      {/* Axes */}
      <group>
        <ArrowHelper origin={[0,0,0]} dir={[1.35,0,0]} color="#EF4444" label="S1" />
        <ArrowHelper origin={[0,0,0]} dir={[0,0,1.35]} color="#10B981" label="S2" />
        <ArrowHelper origin={[0,0,0]} dir={[0,1.35,0]} color="#3B82F6" label="S3" />
      </group>

      {/* Poles */}
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshBasicMaterial color="#DC2626" />
      </mesh>
      <Html position={[0, 1.38, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#DC2626', fontSize: '14px', fontWeight: 700, textShadow: '0 0 3px white' }}>R</span>
      </Html>
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshBasicMaterial color="#2563EB" />
      </mesh>
      <Html position={[0, -1.38, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#2563EB', fontSize: '14px', fontWeight: 700, textShadow: '0 0 3px white' }}>L</span>
      </Html>

      {/* Equator labels */}
      <Html position={[1.22, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 600, textShadow: '0 0 3px white' }}>H</span>
      </Html>
      <Html position={[-1.22, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 600, textShadow: '0 0 3px white' }}>V</span>
      </Html>
      <Html position={[0, 0, 1.22]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 600, textShadow: '0 0 3px white' }}>D</span>
      </Html>
      <Html position={[0, 0, -1.22]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 600, textShadow: '0 0 3px white' }}>A</span>
      </Html>

      {/* Trajectory */}
      {mode === 'trajectory' && trajectoryPts.length >= 2 && (
        <Line points={trajectoryPts} color="#2563EB" lineWidth={2} />
      )}

      {/* Data points */}
      {mode === 'trajectory' && points.map((p, i) => {
        const col = i === 0 ? '#10B981' : i === points.length - 1 ? '#DC2626' : '#6B7280';
        const r = i === 0 || i === points.length - 1 ? 0.045 : 0.03;
        return (
          <mesh key={i} position={[p.coords.x, p.coords.z, p.coords.y]}>
            <sphereGeometry args={[r, 16]} />
            <meshBasicMaterial color={col} />
          </mesh>
        );
      })}

      {/* Single point */}
      {singlePointData && (
        <>
          <mesh position={[singlePointData.p.coords.x, singlePointData.p.coords.z, singlePointData.p.coords.y]}>
            <sphereGeometry args={[0.05, 20]} />
            <meshBasicMaterial color={singlePointData.col} />
          </mesh>
          <Line points={[new THREE.Vector3(0,0,0), new THREE.Vector3(singlePointData.p.coords.x, singlePointData.p.coords.z, singlePointData.p.coords.y)]}
            color={singlePointData.col} lineWidth={1} transparent opacity={0.5} />
        </>
      )}

    </group>
  );
}

function ArrowHelper({ origin, dir, color, label }: { origin: [number, number, number]; dir: [number, number, number]; color: string; label: string }) {
  const direction = useMemo(() => new THREE.Vector3(...dir).normalize(), [dir]);
  const length = new THREE.Vector3(...dir).length();
  return (
    <group position={origin}>
      <arrowHelper args={[direction, new THREE.Vector3(0,0,0), length, color, 0.08, 0.04]} />
      <Html position={[dir[0] * 1.18, dir[1] * 1.18, dir[2] * 1.18]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color, fontSize: '13px', fontWeight: 700, textShadow: '0 0 3px white', whiteSpace: 'nowrap' }}>{label}</span>
      </Html>
    </group>
  );
}
