import React, { useState, useEffect } from 'react';
import { RevolverCanvas } from './components/Revolver3D';
import { GunStats } from './types';
import { playSound } from './services/audio';

const MAX_AMMO = 6;

export default function App() {
  // Gun State
  const [rotationStep, setRotationStep] = useState(0);
  const [chambers, setChambers] = useState<boolean[]>([true, true, true, true, true, true]); // true = bullet, false = spent
  const [lastShotLive, setLastShotLive] = useState(false);
  
  const [isReloading, setIsReloading] = useState(false);
  const [isCylinderOpen, setIsCylinderOpen] = useState(false);
  
  // Derived Stats
  const ammoCount = chambers.filter(Boolean).length;
  const stats: GunStats = { ammo: ammoCount, capacity: MAX_AMMO, condition: 100 };

  const handleFire = () => {
    if (isReloading || isCylinderOpen) return;
    
    // Logic:
    // 1. Rotate to next chamber.
    // 2. Check if that chamber has a bullet.
    // 3. If yes, fire (mark empty) and bang.
    // 4. If no, click.
    
    const nextStep = rotationStep + 1;
    // We rotate first. The chamber that ends up at the TOP is the one that fires.
    // Based on our rotation logic (-60 deg per step), the index at top matches (step % 6).
    const currentChamberIndex = nextStep % 6;
    
    const isLive = chambers[currentChamberIndex];
    
    setRotationStep(nextStep);
    setLastShotLive(isLive);
    
    // Play Sound
    playSound(isLive ? 'bang' : 'click');
    
    if (isLive) {
        const newChambers = [...chambers];
        newChambers[currentChamberIndex] = false;
        setChambers(newChambers);
    }
  };

  const handleReload = () => {
    if (isReloading || ammoCount === MAX_AMMO) return;
    setIsCylinderOpen(true);
    setIsReloading(true);
    
    playSound('open');
    
    setTimeout(() => {
        playSound('reload');
        // Simulate rapid loading sounds
        setTimeout(() => playSound('reload'), 200);
        setTimeout(() => playSound('reload'), 400);
    }, 1000);
    
    setTimeout(() => {
      setChambers([true, true, true, true, true, true]);
      setIsReloading(false);
      setIsCylinderOpen(false);
      playSound('open'); // Closing sound (reuse open)
    }, 2500);
  };

  const handleRandomLoad = () => {
    if (isReloading) return;
    setIsCylinderOpen(true);
    setIsReloading(true);
    playSound('open');
    
    setTimeout(() => {
      playSound('reload');
    }, 1000);
    
    setTimeout(() => {
      // Create empty cylinder
      const newChambers = [false, false, false, false, false, false];
      // Load one random chamber
      const randomIndex = Math.floor(Math.random() * 6);
      newChambers[randomIndex] = true;
      
      setChambers(newChambers);
      setIsReloading(false);
      setIsCylinderOpen(false);
      playSound('open');
    }, 2500);
  };

  const toggleCylinder = () => {
      if (isReloading) return;
      playSound('open');
      setIsCylinderOpen(!isCylinderOpen);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') handleFire();
        if (e.code === 'KeyR') handleReload();
        if (e.code === 'KeyF') toggleCylinder();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotationStep, chambers, isReloading, isCylinderOpen]);

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      
      {/* Full Screen 3D Viewport */}
      <div className="relative w-full h-full">
        <RevolverCanvas 
          rotationStep={rotationStep}
          chambers={chambers}
          isReloading={isReloading} 
          isCylinderOpen={isCylinderOpen}
          lastShotLive={lastShotLive}
          onFireComplete={() => {}} 
        />
        
        {/* HUD Overlay */}
        <div className="absolute bottom-8 left-8 p-4 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 select-none pointer-events-none">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-mono font-bold ${stats.ammo === 0 ? 'text-red-500' : 'text-white'}`}>
              {stats.ammo} <span className="text-xl text-gray-400">/ {stats.capacity}</span>
            </div>
            <div className="h-12 w-px bg-white/20"></div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Caliber</div>
              <div className="text-lg font-bold">.357 MAG</div>
            </div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-8 right-8 flex gap-4 pointer-events-auto items-center">
            {/* Toggle Cylinder Button */}
            <button 
                onClick={toggleCylinder}
                title="Toggle Cylinder (F)"
                className={`flex items-center justify-center w-14 h-14 rounded-full border border-white/20 backdrop-blur-sm transition-all
                    ${isCylinderOpen ? 'bg-blue-500/40 border-blue-400/50' : 'bg-black/40 hover:bg-white/10 active:scale-95'}
                `}
            >
                <i className={`fas ${isCylinderOpen ? 'fa-folder-open' : 'fa-folder'} text-lg`}></i>
            </button>

            {/* Random Load Button (Russian Roulette) */}
            <button 
                onClick={handleRandomLoad}
                disabled={isReloading}
                title="Load One Random Round"
                className={`flex items-center justify-center w-14 h-14 rounded-full border border-white/20 backdrop-blur-sm transition-all
                    ${isReloading ? 'opacity-30 cursor-not-allowed' : 'bg-black/40 hover:bg-purple-500/20 active:scale-95 border-purple-500/30'}
                `}
            >
                <i className="fas fa-dice text-lg text-purple-400"></i>
            </button>

            {/* Reload Button */}
             <button 
                onClick={handleReload}
                disabled={isReloading || stats.ammo === MAX_AMMO}
                title="Full Reload (R)"
                className={`flex items-center justify-center w-16 h-16 rounded-full border border-white/20 backdrop-blur-sm transition-all
                    ${isReloading ? 'bg-yellow-500/20 animate-spin' : 'bg-black/40 hover:bg-white/10 active:scale-95'}
                `}
            >
                <i className="fas fa-rotate text-xl"></i>
            </button>

            {/* Fire Button */}
            <button 
                onClick={handleFire}
                disabled={isCylinderOpen}
                title="Fire (Space)"
                className={`flex items-center justify-center w-20 h-20 rounded-full transition-all active:scale-90 shadow-2xl
                    ${isCylinderOpen ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)]'}
                `}
            >
                <i className="fas fa-crosshairs text-2xl text-white"></i>
            </button>
        </div>
        
        {/* Instructions */}
        <div className="absolute top-4 right-4 text-[10px] text-white/30 text-right pointer-events-none hidden md:block leading-tight">
            <p>[SPACE] to Fire</p>
            <p>[R] to Fast Reload</p>
            <p>[F] to Open Cylinder</p>
            <p>[Drag] to Rotate</p>
        </div>
      </div>
    </div>
  );
}