'use client';

import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import Card3D from './Card3D';
import DynamicCanvas from './DynamicCanvas';
import { useGame } from '../context/GameContext';
import { calculateGrid } from '../utils/helpers';
import * as THREE from 'three';

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
  
  // Calculate camera position based on grid size
  const getCameraPosition = () => {
    const maxDimension = Math.max(rows, cols);
    const distance = maxDimension * 0.8;
    return [0, 0, distance + 2] as [number, number, number];
  };
  
  // Calculate card positions in the grid
  const getCardPosition = (index: number): [number, number, number] => {
    const cardWidth = 1;
    const cardHeight = 1.3;
    const spacing = 0.2;
    
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
      <Camera position={getCameraPosition()} fov={65} />
      
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
    <div className="w-full h-[500px] bg-[#463A38] rounded-lg overflow-hidden relative">
      {isOffline && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
          Offline
        </div>
      )}
      
      <DynamicCanvas key={renderKey} className="w-full h-full">
        {renderGameContent()}
      </DynamicCanvas>
    </div>
  );
}