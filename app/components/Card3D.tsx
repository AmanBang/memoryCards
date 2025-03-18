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

// Create linen texture using canvas
function createLinenTexture() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  canvas.width = 256;
  canvas.height = 256;
  
  // Background color
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw subtle linen pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  // Horizontal lines
  for (let i = 0; i < canvas.height; i += 4) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  
  // Vertical lines
  for (let i = 0; i < canvas.width; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  
  return canvas;
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
  const fontSizePx = Math.floor(fontSize * 120); // Increased font size for emojis
  // Use a font that has good emoji support
  ctx.font = `${fontSizePx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`;
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
  const [linenTexture, setLinenTexture] = useState<HTMLCanvasElement | null>(null);
  
  // Create linen texture on mount
  useEffect(() => {
    setLinenTexture(createLinenTexture());
    setIsMounted(true);
  }, []);
  
  // Set rotation based on card state
  useEffect(() => {
    setTargetRotation(card.isFlipped ? Math.PI : 0);
  }, [card.isFlipped]);
  
  // Get card scale based on difficulty
  const getCardScale = (): [number, number, number] => {
    switch (difficulty) {
      case 'tough':
        return [0.85, 0.85, 1];
      case 'genius':
        return [0.8, 0.8, 1];
      default:
        return [1, 1, 1];
    }
  };
  
  // Handle animation and interaction
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Smooth rotation animation
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotation,
      delta * 5
    );
    
    // Hover effect - only apply on non-mobile devices
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
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
    }
    
    // Pulsing/glowing effect for matched cards
    if (card.isMatched && meshRef.current) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
      meshRef.current.scale.x = getCardScale()[0] * pulse;
      meshRef.current.scale.y = getCardScale()[1] * pulse;
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
    
    // For other difficulties, use emojis grouped by category
    const emojis = [
      // Animals
      '🐶', '🐱', '🐭', '🦊', '🐻', '🐼', '🦁', '🐯', '🦄', '🐝', 
      '🦋', '🐢', '🐙', '🦈', '🦜', '🦉', '🦧', '🐘', '🦒', '🦏',
      // Fruits & Food
      '🍎', '🍌', '🍉', '🍇', '🍓', '🍍', '🥑', '🍔', '🍕', '🍦',
      '🌮', '🍣', '🥨', '🍩', '🥐', '🧁', '🍭', '🍫', '🥥', '🍪',
      // Vehicles & Travel
      '🚗', '🚕', '🚙', '🚌', '🚑', '🏎️', '🚂', '🚀', '✈️', '🛸',
      '🚁', '⛵', '🚤', '🚲', '🛴', '🏍️', '🚄', '🚞', '🚠', '🚇',
      // Objects & Activities
      '⚽', '🏀', '🏈', '⚾', '🎾', '🎮', '🎲', '🧩', '🎸', '🎺',
      '🔮', '💎', '🔑', '🧸', '🎁', '💼', '📱', '⌚', '🔋', '💡'
    ];
    
    return emojis[card.value % emojis.length];
  };
  
  // Handle card matched state
  useEffect(() => {
    if (card.isMatched && meshRef.current) {
      // Add a slight delay before starting the matched effect
      setTimeout(() => {
        if (!meshRef.current) return;
        meshRef.current.position.z = -0.1;
      }, 300);
    }
  }, [card.isMatched]);
  
  // Get glow intensity for matched cards
  const getGlowIntensity = () => {
    if (!card.isMatched) return 0;
    
    // Create pulsing glow effect
    return Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
  };
  
  return (
    <group>
      {/* Drop shadow - only rendered when the card is flipped */}
      {card.isFlipped && (
        <mesh
          position={[position[0], position[1] - 0.05, position[2] - 0.1]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.9, 1.2]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Glow effect for matched cards */}
      {card.isMatched && (
        <mesh
          position={position}
          scale={[1.1, 1.4, 1]}
        >
          <boxGeometry args={[0.9, 1.2, 0.05]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={getGlowIntensity() * 0.3}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Main card mesh */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          // Prevent event propagation to avoid triggering OrbitControls
          e.stopPropagation();
          if (!card.isMatched && !card.isFlipped) {
            onClick();
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={getCardScale()}
      >
        {/* Slightly rounded card geometry */}
        <boxGeometry args={[0.9, 1.2, 0.05]} />
        
        {/* Card back with linen texture */}
        <meshStandardMaterial 
          attach="material-0" 
          color={new THREE.Color(0.15, 0.15, 0.15)} 
          roughness={0.7}
          metalness={0.1}
        >
          {linenTexture && (
            <canvasTexture 
              attach="map" 
              image={linenTexture}
              wrapS={THREE.RepeatWrapping}
              wrapT={THREE.RepeatWrapping}
            />
          )}
        </meshStandardMaterial>
        
        {/* Card front */}
        <meshStandardMaterial 
          attach="material-1" 
          color={getCardColor()} 
          roughness={0.2}
          metalness={0.2}
          transparent={card.isMatched}
          opacity={card.isMatched ? 0.8 : 1}
        />
        
        {/* Card edges */}
        <meshStandardMaterial attach="material-2" color="#222222" />
        <meshStandardMaterial attach="material-3" color="#222222" />
        <meshStandardMaterial attach="material-4" color="#222222" />
        <meshStandardMaterial attach="material-5" color="#222222" />
        
        {/* Card symbol/value (only visible when card is flipped) */}
        {isMounted && card.isFlipped && (
          <SimpleText
            position={[0, 0, 0.03]}
            rotation={[0, Math.PI, 0]}
            fontSize={1}
            color="#ffffff"
          >
            {getCardSymbol()}
          </SimpleText>
        )}
      </mesh>
    </group>
  );
}