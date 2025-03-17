'use client';

import { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import Card3D from './Card3D';
import DynamicCanvas from './DynamicCanvas';
import { useGame } from '../context/GameContext';
import { calculateGrid } from '../utils/helpers';
import * as THREE from 'three';

// Simple Pan Controls component
function PanControls({ maxDistance = 30, minDistance = 2 }) {
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
      <div className="w-full h-[500px] flex items-center justify-center bg-[#463A38] rounded-lg">
        <p className="text-xl text-white">Loading game...</p>
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
  
  // Calculate container height based on difficulty
  const getContainerHeight = () => {
    const cardCount = gameState.cards.length;
    
    // Base heights for desktop
    let heightClass = '';
    if (cardCount <= 36) heightClass = 'h-[500px]'; // Medium and below
    if (cardCount <= 64) heightClass = 'h-[600px]'; // Hard
    if (cardCount <= 100) heightClass = 'h-[700px]'; // Tough
    if (cardCount > 100) heightClass = 'h-[800px]'; // Genius
    
    // Make it responsive by adding smaller heights for mobile
    return `${heightClass} sm:${heightClass} h-[450px]`;
  };
  
  // Calculate camera position based on grid size with better scaling
  const getCameraPosition = () => {
    const maxDimension = Math.max(rows, cols);
    
    // Scale distance based on difficulty level
    let distanceScale = 1.0;
    const cardCount = gameState.cards.length;
    
    if (cardCount > 36 && cardCount <= 64) distanceScale = 1.2; // Hard
    if (cardCount > 64 && cardCount <= 100) distanceScale = 1.5; // Tough
    if (cardCount > 100) distanceScale = 1.8; // Genius
    
    // Add additional distance for large grids
    const baseDistance = maxDimension * 0.9;
    const distance = baseDistance * distanceScale;
    
    return [0, 0, distance + 2] as [number, number, number];
  };
  
  // Calculate camera FOV based on grid size
  const getCameraFOV = () => {
    const cardCount = gameState.cards.length;
    if (cardCount <= 36) return 65; // Medium and below
    if (cardCount <= 64) return 70; // Hard
    if (cardCount <= 100) return 75; // Tough
    return 80; // Genius
  };
  
  // Calculate card positions in the grid
  const getCardPosition = (index: number): [number, number, number] => {
    const cardWidth = 1;
    const cardHeight = 1.3;
    
    // Increase spacing for higher difficulty levels
    const spacing = gameState.cards.length > 64 ? 0.3 : 0.2;
    
    const totalWidth = cols * (cardWidth + spacing);
    const totalHeight = rows * (cardHeight + spacing);
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const x = col * (cardWidth + spacing) - totalWidth / 2 + cardWidth / 2;
    const y = -row * (cardHeight + spacing) + totalHeight / 2 - cardHeight / 2;
    
    return [x, y, 0];
  };
  
  const renderGameContent = () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
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
    <div className={`w-full ${getContainerHeight()} bg-[#463A38] rounded-lg overflow-hidden relative`}>
      {isOffline && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
          Offline
        </div>
      )}
      
      {isMobile && (
        <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
          Pinch to zoom, drag to move
        </div>
      )}
      
      <DynamicCanvas key={renderKey} className="w-full h-full">
        {renderGameContent()}
      </DynamicCanvas>
    </div>
  );
}