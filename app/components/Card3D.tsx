'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Card } from '../context/GameContext';

// Simple text component that doesn't use troika-three-text
function SimpleText({ children, position, rotation, fontSize, color }: any) {
  const mesh = useRef<THREE.Mesh>(null);
  
  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={1}
        depthTest={false}
      >
        <canvasTexture 
          attach="map" 
          image={createTextCanvas(String(children), fontSize, color)}
        />
      </meshBasicMaterial>
    </mesh>
  );
}

// Helper function to create text on canvas
function createTextCanvas(text: string, fontSize: number, color: string) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  // Set canvas dimensions
  canvas.width = 256;
  canvas.height = 256;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  const fontSizePx = Math.floor(fontSize * 100);
  ctx.font = `bold ${fontSizePx}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  return canvas;
}

interface Card3DProps {
  card: Card;
  onClick: () => void;
  position: [number, number, number];
  difficulty: string;
}

export default function Card3D({ card, onClick, position, difficulty }: Card3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Set rotation based on card state
  useEffect(() => {
    setTargetRotation(card.isFlipped ? Math.PI : 0);
  }, [card.isFlipped]);
  
  // Handle animation and interaction
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Smooth rotation animation
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotation,
      delta * 5
    );
    
    // Hover effect
    if (hovered && !card.isMatched && !card.isFlipped) {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        position[1] + 0.1,
        delta * 5
      );
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        position[1],
        delta * 5
      );
    }
  });
  
  // Get card color based on difficulty
  const getCardColor = () => {
    switch (difficulty) {
      case 'easy':
        return new THREE.Color(0.1, 0.5, 0.8);
      case 'medium':
        return new THREE.Color(0.1, 0.7, 0.3);
      case 'hard':
        return new THREE.Color(0.8, 0.2, 0.2);
      case 'tough':
        return new THREE.Color(0.8, 0.5, 0.1);
      case 'genius':
        // For genius level, create very subtle color variations
        const baseColor = 0.5;
        const variation = (card.value % 10) * 0.02;
        return new THREE.Color(
          baseColor + variation,
          baseColor - variation,
          baseColor + (variation / 2)
        );
      default:
        return new THREE.Color(0.1, 0.5, 0.8);
    }
  };
  
  // Get card symbol or value
  const getCardSymbol = () => {
    if (difficulty === 'genius') {
      // For genius level, don't show symbols, just rely on subtle color differences
      return '';
    }
    
    // For other difficulties, use symbols or numbers
    const symbols = ['♠', '♥', '♦', '♣', '★', '✿', '✦', '♛', '♞', '☼'];
    return symbols[card.value % symbols.length];
  };
  
  // Handle card matched state
  useEffect(() => {
    if (card.isMatched && meshRef.current) {
      // Fade out matched cards
      const fadeOut = () => {
        if (!meshRef.current) return;
        
        meshRef.current.scale.set(0.9, 0.9, 0.9);
        meshRef.current.position.z = -0.5;
      };
      
      setTimeout(fadeOut, 500);
    }
  }, [card.isMatched]);
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => !card.isMatched && !card.isFlipped && onClick()}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.9, 1.2, 0.05]} />
      
      {/* Card back */}
      <meshStandardMaterial 
        attach="material-0" 
        color={new THREE.Color(0.2, 0.2, 0.2)} 
        roughness={0.5}
      />
      
      {/* Card front */}
      <meshStandardMaterial 
        attach="material-1" 
        color={getCardColor()} 
        roughness={0.2}
        transparent={card.isMatched}
        opacity={card.isMatched ? 0.5 : 1}
      />
      
      {/* Card edges */}
      <meshStandardMaterial attach="material-2" color="#ffffff" />
      <meshStandardMaterial attach="material-3" color="#ffffff" />
      <meshStandardMaterial attach="material-4" color="#ffffff" />
      <meshStandardMaterial attach="material-5" color="#ffffff" />
      
      {/* Card symbol/value (only visible when card is flipped) */}
      {isMounted && card.isFlipped && (
        <SimpleText
          position={[0, 0, 0.03]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.4}
          color="#ffffff"
        >
          {getCardSymbol()}
        </SimpleText>
      )}
    </mesh>
  );
}