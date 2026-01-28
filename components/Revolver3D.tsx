import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';

/* 
   Removed incorrect global JSX declaration. 
   @react-three/fiber automatically augments JSX.IntrinsicElements. 
   Manually overwriting it was breaking standard HTML tags (div, button, etc.) 
   and potentially conflicting with R3F types.
*/

import { 
  PresentationControls, 
  Environment, 
  ContactShadows, 
  Float,
  PerspectiveCamera,
  RoundedBox,
  Cylinder,
  Box,
  Torus
} from '@react-three/drei';
import * as THREE from 'three';

// --- Materials ---
const STEEL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#2a2a2a",
  metalness: 0.95,
  roughness: 0.2,
});

const BRUSHED_STEEL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#333333",
  metalness: 0.9,
  roughness: 0.35,
});

const CHROME_ACCENT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#aaaaaa",
  metalness: 1.0,
  roughness: 0.1,
});

const WOOD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#4a2512",
  roughness: 0.55,
  metalness: 0.05,
});

const BLACK_MATTE_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#050505",
  roughness: 1.0,
  metalness: 0.0,
});

const BRASS_MATERIAL = new THREE.MeshStandardMaterial({
    color: "#d4af37",
    metalness: 1.0,
    roughness: 0.15,
});

const COPPER_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#b87333",
  metalness: 0.8,
  roughness: 0.2,
});

const CHAMBER_INTERIOR_MATERIAL = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    metalness: 0.6,
    roughness: 0.7,
    side: THREE.DoubleSide
});

const FLASH_MATERIAL = new THREE.MeshBasicMaterial({
    color: "#ffaa00",
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});

const SMOKE_MATERIAL = new THREE.MeshStandardMaterial({
    color: "#cccccc",
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    roughness: 1,
});

// Detailed 3D Cartridge (.357 Magnum style)
const Cartridge = ({ spent }: { spent: boolean }) => {
  // If spent, return null to show a completely empty chamber (as per user request for clear counting)
  if (spent) return null;

  return (
    <group rotation={[0, 0, -Math.PI / 2]}>
        {/* Brass Case Walls */}
        <Cylinder args={[0.155, 0.155, 1.29, 24]} material={BRASS_MATERIAL} />

        {/* Extractor Groove */}
        <Cylinder args={[0.14, 0.14, 0.05, 24]} position={[0, -0.6, 0]} material={BRASS_MATERIAL} />
        
        {/* Base Rim */}
        <Cylinder args={[0.18, 0.18, 0.06, 24]} position={[0, -0.66, 0]} material={BRASS_MATERIAL} />
        
        {/* Primer */}
        <group position={[0, -0.691, 0]}>
             <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.055, 24]} />
                <meshStandardMaterial 
                    color="#eebb44"
                    metalness={1.0}
                    roughness={0.2} 
                />
             </mesh>
        </group>

        {/* Slug (Projectile) */}
        <group position={[0, 0.645, 0]}>
            {/* Copper Jacketed Bullet */}
            <Cylinder args={[0.13, 0.155, 0.15, 24]} position={[0, 0.075, 0]} material={COPPER_MATERIAL} />
            <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#333" roughness={0.6} /> {/* Flat nose tip */}
            </mesh>
        </group>
    </group>
  );
};

// Procedural Revolver Component
const RevolverModel = ({ 
  rotationStep, 
  chambers,
  isReloading,
  isCylinderOpen,
  lastShotLive
}: { 
  rotationStep: number, 
  chambers: boolean[],
  isReloading: boolean,
  isCylinderOpen: boolean,
  lastShotLive: boolean
}) => {
  const group = useRef<THREE.Group>(null);
  const cylinderAssemblyRef = useRef<THREE.Group>(null);
  const hammerRef = useRef<THREE.Group>(null);
  const triggerRef = useRef<THREE.Group>(null);
  const craneRef = useRef<THREE.Group>(null);
  
  // Visual Effect Refs
  const flashGroupRef = useRef<THREE.Group>(null);
  const tracerMeshRef = useRef<THREE.Mesh>(null);
  const smokeParticlesRef = useRef<THREE.Group>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  
  // Logic Refs
  const lastRotationStep = useRef(rotationStep);
  
  // Physics Refs (Spring System)
  const recoilState = useRef({ angle: 0, velocity: 0 });
  const flashTimer = useRef(0);
  const currentGunTilt = useRef(0); // Track tilt independently to avoid conflicts

  // Dimensions
  const CYLINDER_X_OFFSET = 0.45;
  const CYLINDER_Y = 0.0; 
  const CHAMBER_RADIUS = 0.42; 
  const BARREL_Y = CYLINDER_Y + CHAMBER_RADIUS; 
  
  useFrame((state, delta) => {
    if (!group.current || !cylinderAssemblyRef.current || !hammerRef.current || !triggerRef.current || !craneRef.current) return;

    // --- 1. Recoil Physics ---
    const k = 200; 
    const c = 14;  
    
    const accel = -k * recoilState.current.angle - c * recoilState.current.velocity;
    recoilState.current.velocity += accel * delta;
    recoilState.current.angle += recoilState.current.velocity * delta;
    
    if (recoilState.current.angle < 0) {
        recoilState.current.angle = 0;
        if (Math.abs(recoilState.current.velocity) < 0.1) recoilState.current.velocity = 0;
    }

    // --- 2. VFX ---
    if (flashTimer.current > 0) {
        flashTimer.current -= delta;
        if (flashGroupRef.current) {
            flashGroupRef.current.visible = true;
            const s = THREE.MathUtils.randFloat(0.8, 1.4);
            flashGroupRef.current.scale.set(s, s, THREE.MathUtils.randFloat(0.9, 1.2));
            flashGroupRef.current.rotation.z = Math.random() * Math.PI * 2;
            if (flashLightRef.current) flashLightRef.current.intensity = 200 * (flashTimer.current / 0.08);
        }
        if (tracerMeshRef.current) tracerMeshRef.current.visible = true;
    } else {
        if (flashGroupRef.current) flashGroupRef.current.visible = false;
        if (tracerMeshRef.current) tracerMeshRef.current.visible = false;
    }

    if (smokeParticlesRef.current) {
        smokeParticlesRef.current.children.forEach((child: any) => {
            if (child.visible) {
                child.userData.life -= delta;
                const vel = child.userData.velocity as THREE.Vector3;
                child.position.add(vel.clone().multiplyScalar(delta));
                vel.y += delta * 0.8;
                vel.multiplyScalar(0.96);
                child.scale.multiplyScalar(1 + delta * 1.2); 
                child.rotation.z += delta * 0.5;
                if (child.material) child.material.opacity = Math.max(0, child.userData.life * 0.4);
                if (child.userData.life <= 0) child.visible = false;
            }
        });
    }

    // --- 3. Fire Logic ---
    if (rotationStep > lastRotationStep.current && !isReloading && !isCylinderOpen) {
        lastRotationStep.current = rotationStep;
        hammerRef.current.rotation.z = -0.95;

        if (lastShotLive) {
            recoilState.current.velocity += 18; 
            flashTimer.current = 0.08;
            if (smokeParticlesRef.current) {
                let spawned = 0;
                smokeParticlesRef.current.children.forEach((child: any) => {
                    if (!child.visible && spawned < 4) {
                        spawned++;
                        child.visible = true;
                        child.position.set(2.3, BARREL_Y, 0);
                        child.scale.setScalar(THREE.MathUtils.randFloat(0.2, 0.4));
                        child.rotation.z = Math.random() * Math.PI;
                        child.userData = {
                            life: 1.0 + Math.random(),
                            velocity: new THREE.Vector3(2.0 + Math.random() * 2, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)
                        };
                        if (child.material) child.material.opacity = 0.5;
                    }
                });
            }
        } else {
            recoilState.current.velocity += 0.5; 
        }
    } else if (rotationStep < lastRotationStep.current) {
        lastRotationStep.current = rotationStep;
    }

    // --- 4. Animation ---
    const targetRot = -rotationStep * (Math.PI / 3);
    
    if (!isCylinderOpen) {
         // Smooth rotation when closed
         cylinderAssemblyRef.current.rotation.x = THREE.MathUtils.lerp(cylinderAssemblyRef.current.rotation.x, targetRot, delta * 15);
    } else {
         // When open, only spin if reloading. Otherwise, stop spinning to allow inspection.
         if (isReloading) {
            cylinderAssemblyRef.current.rotation.x += delta * 12;
         } else {
            // Slight drift to feel physical but lively
             cylinderAssemblyRef.current.rotation.x += delta * 0.8;
         }
    }

    if (recoilState.current.angle < 0.2) {
        hammerRef.current.rotation.z = THREE.MathUtils.lerp(hammerRef.current.rotation.z, 0, delta * 6);
    }
    
    const targetTriggerRot = (recoilState.current.angle > 0.1) ? -0.55 : 0;
    triggerRef.current.rotation.z = THREE.MathUtils.lerp(triggerRef.current.rotation.z, targetTriggerRot, delta * 18);

    const targetCraneAngle = isCylinderOpen ? 0.75 : 0;
    const targetGunTilt = isCylinderOpen ? -0.35 : 0;
    
    // Crane opening animation
    craneRef.current.rotation.x = THREE.MathUtils.lerp(craneRef.current.rotation.x, targetCraneAngle, delta * 20);
    
    // Tilt Animation State Update
    currentGunTilt.current = THREE.MathUtils.lerp(currentGunTilt.current, targetGunTilt, delta * 12);
    
    // Apply Combined Transforms to Main Group
    // 1. Recoil moves gun back (X) and up (Y)
    group.current.position.x = -recoilState.current.angle * 1.5; 
    group.current.position.y = recoilState.current.angle * 0.5;
    
    // 2. Rotation Z is sum of Recoil (muzzle climb) and Tilt (opening cylinder)
    // Recoil Angle is > 0 (climb), Tilt is < 0 (rotate left)
    group.current.rotation.z = Math.min(1.2, recoilState.current.angle) + currentGunTilt.current;
  });

  return (
    <group ref={group} dispose={null}>
      {/* FRAME */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[1.9, 1.35, 0.46]} radius={0.06} smoothness={4} material={STEEL_MATERIAL} />
        <RoundedBox args={[1.65, 0.22, 0.46]} radius={0.02} smoothness={4} position={[0.55, 0.78, 0]} material={STEEL_MATERIAL} />
        
        {/* Recoil Shield (Frame Plate behind cylinder) */}
        <mesh position={[-0.38, 0, 0]} rotation={[0, 0, Math.PI/2]}>
             <cylinderGeometry args={[0.72, 0.72, 0.05, 32]} />
             <meshStandardMaterial color="#2a2a2a" metalness={0.95} roughness={0.2} />
        </mesh>

        <group position={[-0.45, 0.95, 0]}>
            <Box args={[0.65, 0.12, 0.28]} material={BLACK_MATTE_MATERIAL} />
            <Box args={[0.08, 0.18, 0.28]} position={[-0.3, 0.05, 0]} material={BLACK_MATTE_MATERIAL} />
        </group>
        <RoundedBox args={[0.2, 1.05, 0.58]} radius={0.12} position={[-0.85, 0.05, 0]} material={STEEL_MATERIAL} />
        <mesh position={[-0.74, BARREL_Y, 0]} rotation={[0, Math.PI/2, 0]}>
            <circleGeometry args={[0.04, 16]} />
            <meshBasicMaterial color="#000" />
        </mesh>
        <RoundedBox args={[0.55, 0.55, 0.42]} radius={0.12} position={[-1.05, 0.5, 0]} material={STEEL_MATERIAL} />
      </group>

      {/* BARREL */}
      <group position={[2.2, BARREL_Y, 0]}>
        <Cylinder args={[0.2, 0.24, 3.0, 48]} rotation={[0, 0, -Math.PI / 2]} material={STEEL_MATERIAL} />
        <Cylinder args={[0.095, 0.095, 0.04, 32]} rotation={[0, 0, -Math.PI / 2]} position={[1.501, 0, 0]} material={BLACK_MATTE_MATERIAL} />
        <RoundedBox args={[3.0, 0.38, 0.3]} radius={0.06} position={[0, -0.26, 0]} material={STEEL_MATERIAL} />
        <Box args={[3.0, 0.16, 0.25]} position={[0, 0.24, 0]} material={STEEL_MATERIAL} />
        <Box args={[0.45, 0.28, 0.05]} position={[1.25, 0.42, 0]} material={BLACK_MATTE_MATERIAL}>
             <Box args={[0.12, 0.18, 0.052]} position={[0.1, 0.06, 0]} material={new THREE.MeshBasicMaterial({color: "#ff3300"})} />
        </Box>
        
        {/* VISUAL EFFECTS */}
        <group ref={flashGroupRef} position={[1.6, 0, 0]} visible={false}>
            <pointLight ref={flashLightRef} distance={10} color="#ffaa00" decay={2} />
            <mesh rotation={[0, 0, -Math.PI/2]}>
                <cylinderGeometry args={[0.1, 0.3, 1.2, 8, 1, true]} />
                <primitive object={FLASH_MATERIAL} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI/2]} position={[0,0.1,0]}>
                <planeGeometry args={[0.8, 0.8]} />
                <primitive object={FLASH_MATERIAL} />
            </mesh>
            <mesh rotation={[Math.PI/2, 0, -Math.PI/2]} position={[0,-0.1,0]}>
                <planeGeometry args={[0.8, 0.8]} />
                <primitive object={FLASH_MATERIAL} />
            </mesh>
        </group>
        
        <group ref={smokeParticlesRef}>
            {Array.from({ length: 12 }).map((_, i) => (
                <mesh key={i} visible={false}>
                    <sphereGeometry args={[0.4, 16, 16]} />
                    <primitive object={SMOKE_MATERIAL.clone()} />
                </mesh>
            ))}
        </group>

        <mesh ref={tracerMeshRef} position={[12, 0, 0]} rotation={[0, 0, -Math.PI/2]} visible={false}>
            <cylinderGeometry args={[0.03, 0.03, 25, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* GRIP */}
      <group position={[-1.4, -0.7, 0]} rotation={[0, 0, -0.22]}>
         <RoundedBox args={[1.1, 1.9, 0.54]} radius={0.3} smoothness={8} position={[0, -0.45, 0]} material={WOOD_MATERIAL} />
         <Cylinder args={[0.08, 0.08, 0.55, 16]} rotation={[Math.PI/2, 0, 0]} position={[0, -0.35, 0]} material={BRASS_MATERIAL} />
         <Box args={[0.45, 1.95, 0.5]} position={[0.32, -0.45, 0]} material={STEEL_MATERIAL} />
      </group>

      {/* CRANE & CYLINDER */}
      <group ref={craneRef} position={[CYLINDER_X_OFFSET - 0.5, CYLINDER_Y - 0.4, 0]}>
          <group position={[0.2, 0.4, 0]}>
              <RoundedBox args={[0.7, 0.2, 0.22]} radius={0.05} position={[-0.1, 0, 0]} material={STEEL_MATERIAL} />
              
              <group ref={cylinderAssemblyRef} position={[0.3, 0, 0]}>
                <Cylinder args={[0.67, 0.67, 1.6, 64]} rotation={[0, 0, Math.PI / 2]} material={STEEL_MATERIAL} />
                
                {/* Cylinder Chambers (Holes) */}
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                     <group key={`hole-${i}`} rotation={[THREE.MathUtils.degToRad(deg), 0, 0]}>
                         <mesh position={[0, CHAMBER_RADIUS, 0]} rotation={[0, 0, Math.PI / 2]}>
                            {/* Open-ended tube so we can see inside */}
                            <cylinderGeometry args={[0.165, 0.165, 1.605, 16, 1, true]} />
                            {/* Improved material: Dark gunmetal interior for realistic empty slot look */}
                            <primitive object={CHAMBER_INTERIOR_MATERIAL} />
                         </mesh>
                     </group>
                ))}

                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <group key={`flute-${i}`} rotation={[THREE.MathUtils.degToRad(deg + 30), 0, 0]}>
                         <Cylinder 
                            args={[0.2, 0.2, 1.3, 16]} 
                            rotation={[0, 0, Math.PI / 2]} 
                            position={[0, 0.65, 0]} 
                            material={BRUSHED_STEEL_MATERIAL} 
                         />
                    </group>
                ))}

                <group position={[-0.801, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <Cylinder args={[0.25, 0.25, 0.02, 6]} material={CHROME_ACCENT_MATERIAL} />
                </group>

                {/* Render Cartridges */}
                {chambers.map((hasBullet, i) => {
                    const deg = i * 60;
                    return (
                        <group key={`bullet-${i}`} rotation={[THREE.MathUtils.degToRad(deg), 0, 0]}>
                            {/* Adjusted position X: -0.16 to make rims protrude slightly at the back */}
                            <group position={[-0.16, CHAMBER_RADIUS, 0]}>
                                <Cartridge spent={!hasBullet} />
                            </group>
                        </group>
                    );
                })}

                <Cylinder args={[0.05, 0.05, 2.3, 16]} rotation={[0, 0, Math.PI / 2]} position={[0.25, 0, 0]} material={STEEL_MATERIAL} />
                <Cylinder args={[0.08, 0.08, 0.25, 16]} rotation={[0, 0, Math.PI / 2]} position={[-0.72, 0, 0]} material={CHROME_ACCENT_MATERIAL} />
              </group>
          </group>
      </group>

      {/* HAMMER */}
      <group position={[-1.1, 0.55, 0]}>
          <group ref={hammerRef}>
            <RoundedBox args={[0.22, 0.65, 0.14]} radius={0.04} position={[0, 0.22, 0]} material={STEEL_MATERIAL} />
            <Box args={[0.38, 0.09, 0.16]} position={[-0.2, 0.55, 0]} rotation={[0, 0, -0.3]} material={STEEL_MATERIAL} />
            <Box args={[0.12, 0.09, 0.17]} position={[-0.35, 0.6, 0]} material={BLACK_MATTE_MATERIAL} />
          </group>
      </group>

      {/* TRIGGER */}
      <group position={[0.15, -0.68, 0]}>
         <Torus args={[0.48, 0.065, 12, 32, Math.PI]} rotation={[0, 0, Math.PI]} position={[0.1, -0.1, 0]} material={STEEL_MATERIAL} />
         <group ref={triggerRef} position={[0.22, 0, 0]}>
            <RoundedBox args={[0.12, 0.42, 0.11]} radius={0.03} position={[0, 0.06, 0]} rotation={[0, 0, 0.2]} material={CHROME_ACCENT_MATERIAL} />
         </group>
      </group>
    </group>
  );
};

interface RevolverCanvasProps {
  rotationStep: number;
  chambers: boolean[];
  isReloading: boolean;
  isCylinderOpen: boolean;
  lastShotLive: boolean;
  onFireComplete: () => void;
}

export const RevolverCanvas: React.FC<RevolverCanvasProps> = ({ 
  rotationStep, 
  chambers,
  isReloading,
  isCylinderOpen,
  lastShotLive,
  onFireComplete
}) => {
  return (
    <div className="w-full h-full relative bg-gradient-to-b from-[#0a0a0a] to-black">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={40} />
        
        <Environment preset="studio" />
        
        <group position={[-1.0, -0.5, 0]}>
          <PresentationControls 
            global 
            rotation={[0, -Math.PI / 4, 0]} 
            polar={[-Math.PI / 3, Math.PI / 3]} 
            azimuth={[-Infinity, Infinity]}
            snap={false}
            speed={1.2}
            cursor={true}
          >
            <Float rotationIntensity={0.2} floatIntensity={0.4} speed={1}>
              <RevolverModel 
                rotationStep={rotationStep} 
                chambers={chambers}
                isReloading={isReloading}
                isCylinderOpen={isCylinderOpen}
                lastShotLive={lastShotLive}
              />
            </Float>
          </PresentationControls>
        </group>

        <ContactShadows 
          position={[0, -2.8, 0]} 
          opacity={0.75} 
          scale={15} 
          blur={2.8} 
          far={5} 
          color="#000"
        />
        
        <ambientLight intensity={0.4} />
        <spotLight 
            position={[12, 12, 12]} 
            angle={0.35} 
            penumbra={0.6} 
            intensity={250} 
            color="#fff"
            castShadow 
            shadow-bias={-0.0001}
        />
        <spotLight 
            position={[-8, 6, -8]} 
            angle={0.5}
            intensity={150} 
            color="#bfdbfe" 
        />
        <pointLight position={[2, -4, 4]} intensity={50} color="#555" />
        <pointLight position={[-4, -2, 2]} intensity={30} color="#222" />

      </Canvas>
      
      <div className="absolute top-8 left-0 w-full text-center pointer-events-none opacity-30 select-none">
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-black uppercase tracking-[0.2em]" style={{ WebkitTextStroke: '1px #555' }}>
          PYTHON .357
        </h1>
      </div>
    </div>
  );
};