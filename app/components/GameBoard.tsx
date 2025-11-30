'use client';

import { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import Card3D from './Card3D';
import DynamicCanvas from './DynamicCanvas';
import { useGame } from '../context/GameContext';
import { calculateGrid } from '../utils/helpers';
import * as THREE from 'three';
import VoiceChat from './VoiceChat';

// Simple Pan Controls component
function PanControls({ maxDistance = 30, minDistance = 1 }) {
  const { camera, gl } = useThree();
  const domElement = gl.domElement;
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      setIsDragging(true);
      lastPosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - lastPosition.current.x) * 0.01;
        const deltaY = (e.clientY - lastPosition.current.y) * 0.01;

        // Move camera target (not the camera itself)
        targetPosition.current.x -= deltaX;
        targetPosition.current.y += deltaY;

        lastPosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.005;

      // Adjust camera distance
      if (camera instanceof THREE.PerspectiveCamera) {
        let newZ = camera.position.z + delta;
        newZ = Math.max(minDistance, Math.min(maxDistance, newZ));
        camera.position.z = newZ;
      }
    };

    // Touch controls for pinch zoom
    let initialTouchDistance = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setIsDragging(true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      // Handle pinch to zoom with two fingers
      if (e.touches.length === 2) {
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = (initialTouchDistance - currentDistance) * 0.01;
        initialTouchDistance = currentDistance;

        if (camera instanceof THREE.PerspectiveCamera) {
          let newZ = camera.position.z + delta;
          newZ = Math.max(minDistance, Math.min(maxDistance, newZ));
          camera.position.z = newZ;
        }
      }
      // Handle drag with one finger
      else if (e.touches.length === 1 && isDragging) {
        const deltaX = (e.touches[0].clientX - lastPosition.current.x) * 0.01;
        const deltaY = (e.touches[0].clientY - lastPosition.current.y) * 0.01;

        targetPosition.current.x -= deltaX;
        targetPosition.current.y += deltaY;

        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    // Add all event listeners
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch events
    domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    domElement.addEventListener('touchend', onTouchEnd);

    return () => {
      // Remove all event listeners
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('wheel', onWheel);

      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
    };
  }, [domElement, isDragging, camera, maxDistance, minDistance]);

  useFrame(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // Smoothly transition the camera to the target position
      camera.position.x += (targetPosition.current.x - camera.position.x) * 0.1;
      camera.position.y += (targetPosition.current.y - camera.position.y) * 0.1;
    }
  });

  return null;
}

// Custom Camera component
function Camera(props: { position: [number, number, number], fov: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(...props.position);
      camera.fov = props.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, props.position, props.fov]);

  return null;
}

// Grid Floor Component
function GridFloor() {
  return (
    <gridHelper
      args={[100, 100, 0x00f3ff, 0x1a1a1a]}
      position={[0, 0, -0.5]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}

export default function GameBoard() {
  const { gameState, flipCard, isOffline } = useGame();
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [renderKey, setRenderKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force re-render every 30 seconds to keep the timer updated
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set up global error handler for WebGL context loss
    const handleError = () => {
      console.error('WebGL context error detected');
      setRenderKey(prev => prev + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('webglcontextlost', handleError);

      return () => {
        window.removeEventListener('webglcontextlost', handleError);
      };
    }
  }, []);

  if (!gameState) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-black/50 rounded-lg border border-[var(--neon-cyan)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-[var(--neon-cyan)] font-['Orbitron']">LOADING ASSETS...</p>
        </div>
      </div>
    );
  }

  const handleCardClick = (cardId: number) => {
    if (isOffline) {
      console.log('Cannot flip card while offline');
      return;
    }
    flipCard(cardId);
  };

  // Calculate grid dimensions
  const { rows, cols } = calculateGrid(gameState.cards.length);

  // Make container take full available viewport height
  const getContainerHeight = () => {
    return 'h-full w-full min-h-[500px]';
  };

  // Dynamically adjust camera position based on screen size and card count
  const getCameraPosition = () => {
    const maxDimension = Math.max(rows, cols);
    const aspectRatio = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.5;

    // Adjust distance based on screen aspect ratio and card count
    let distanceScale = 0.85;
    const cardCount = gameState.cards.length;

    // Use multiplier for different aspect ratios
    if (aspectRatio < 0.8) { // Portrait phone
      distanceScale *= 1.3;
    } else if (aspectRatio > 2) { // Ultra-wide
      distanceScale *= 0.8;
    }

    // Add scaling based on card count
    if (cardCount > 36 && cardCount <= 64) distanceScale *= 1.15;
    if (cardCount > 64 && cardCount <= 100) distanceScale *= 1.25;
    if (cardCount > 100) distanceScale *= 1.35;

    const baseDistance = maxDimension * 0.85; // Increased from 0.65
    const distance = baseDistance * distanceScale;

    // Return adjusted camera position
    return [0, 0, distance] as [number, number, number];
  };

  // Calculate camera FOV based on screen size and card count
  const getCameraFOV = () => {
    const aspectRatio = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.5;
    const cardCount = gameState.cards.length;

    // Base FOV depends on aspect ratio
    let baseFOV = 65;

    // Adjust for extreme aspect ratios
    if (aspectRatio < 0.8) baseFOV = 75; // More vertical space for portrait
    if (aspectRatio > 2) baseFOV = 55;   // Less vertical space for ultrawide

    // Adjust FOV based on card count
    if (cardCount <= 16) return baseFOV - 5;  // Smaller FOV for few cards
    if (cardCount <= 36) return baseFOV;      // Base FOV for medium count
    if (cardCount <= 64) return baseFOV + 5;  // Larger FOV for more cards
    if (cardCount <= 100) return baseFOV + 10;
    return baseFOV + 15; // Maximum FOV for highest difficulty
  };

  // Calculate card positions to fit all cards on screen
  const getCardPosition = (index: number): [number, number, number] => {
    const cardWidth = 1;
    const cardHeight = 1.2; // Slightly shorter cards
    const aspectRatio = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.5;

    // Determine spacing based on screen dimensions and card count
    let baseSpacing = 0.2;

    // Adjust spacing based on aspect ratio
    if (aspectRatio < 0.8) baseSpacing = 0.15; // Tighter spacing for portrait
    if (aspectRatio > 2) baseSpacing = 0.25;   // More spacing for ultrawide

    // Adjust spacing based on number of cards
    let spacing = baseSpacing;
    if (gameState.cards.length > 36) spacing *= 0.9;
    if (gameState.cards.length > 64) spacing *= 0.85;
    if (gameState.cards.length > 100) spacing *= 0.75;

    // Calculate total dimensions
    const totalWidth = cols * (cardWidth + spacing);
    const totalHeight = rows * (cardHeight + spacing);

    const row = Math.floor(index / cols);
    const col = index % cols;

    // Calculate positions with adjusted spacing
    const x = col * (cardWidth + spacing) - totalWidth / 2 + cardWidth / 2;
    const y = -row * (cardHeight + spacing) + totalHeight / 2 - cardHeight / 2;

    return [x, y, 0];
  };

  const renderGameContent = () => (
    <>
      {/* Dark background with fog for depth */}
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 40]} />

      {/* Grid Floor for cyber aesthetic */}
      <GridFloor />

      {/* Lighting setup */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#ff00ff" />
      <spotLight position={[0, 0, 20]} angle={0.5} penumbra={1} intensity={1} castShadow />

      <Camera position={getCameraPosition()} fov={getCameraFOV()} />

      {/* Add OrbitControls to allow panning and zooming */}
      <PanControls />

      {gameState.cards.map((card, index) => (
        <Card3D
          key={`card-${card.id}`}
          card={card}
          position={getCardPosition(index)}
          onClick={() => handleCardClick(card.id)}
          difficulty={gameState.difficulty || "medium"}
        />
      ))}
    </>
  );

  return (
    <div className={`${getContainerHeight()} bg-black rounded-lg overflow-hidden relative`}>
      {isOffline && (
        <div className="absolute top-2 right-2 z-10 bg-red-900/80 border border-red-500 text-red-200 px-3 py-1 rounded-full text-xs font-mono animate-pulse">
          OFFLINE MODE
        </div>
      )}

      {isMobile && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 border border-[var(--neon-cyan)] text-[var(--neon-cyan)] px-3 py-2 rounded-lg text-xs max-w-[170px] backdrop-blur-sm">
          <p className="mb-1">PINCH TO ZOOM</p>
          <p>DRAG TO PAN</p>
        </div>
      )}

      {/* Voice Chat Controls */}
      <div className="absolute bottom-4 right-4 z-10">
        <VoiceChat />
      </div>

      <DynamicCanvas key={renderKey} className="w-full h-full">
        {renderGameContent()}
      </DynamicCanvas>
    </div>
  );
}