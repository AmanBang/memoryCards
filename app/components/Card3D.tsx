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

// Create cyber texture using canvas
function createCyberTexture() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  canvas.width = 256;
  canvas.height = 256;

  // Background color
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cyber pattern
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 2;

  // Hexagon pattern
  const drawHexagon = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(x + r * Math.cos(i * Math.PI / 3), y + r * Math.sin(i * Math.PI / 3));
    }
    ctx.closePath();
    ctx.stroke();
  };

  // Draw grid of hexagons
  for (let y = 0; y < canvas.height + 50; y += 40) {
    for (let x = 0; x < canvas.width + 50; x += 60) {
      drawHexagon(x, y, 15);
      drawHexagon(x + 30, y + 20, 15);
    }
  }

  // Add some random glowing nodes
  ctx.fillStyle = '#bc13fe';
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
    gradient.addColorStop(0, 'rgba(188, 19, 254, 0.8)');
    gradient.addColorStop(1, 'rgba(188, 19, 254, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// Helper function to create text on canvas
function createTextCanvas(text: string, fontSize: number, color: string) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Set canvas dimensions
  canvas.width = 512; // Doubled from 256 for higher resolution
  canvas.height = 512; // Doubled from 256 for higher resolution

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw text
  const fontSizePx = Math.floor(fontSize * 160); // Increased from 120 for larger emojis
  // Use a font that has good emoji support
  ctx.font = `${fontSizePx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add glow to text
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;

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
  const [cyberTexture, setCyberTexture] = useState<HTMLCanvasElement | null>(null);

  // Create cyber texture on mount
  useEffect(() => {
    setCyberTexture(createCyberTexture());
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
        return [1.0, 1.0, 1];
      case 'genius':
        return [0.95, 0.95, 1];
      case 'hard':
        return [1.1, 1.1, 1];
      case 'medium':
        return [1.2, 1.2, 1];
      case 'easy':
        return [1.3, 1.3, 1];
      default:
        return [1.1, 1.1, 1];
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
        // Add slight tilt on hover
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
          meshRef.current.rotation.z,
          0.05,
          delta * 5
        );
      } else {
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          position[1],
          delta * 5
        );
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
          meshRef.current.rotation.z,
          0,
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
        return new THREE.Color('#00f3ff'); // Cyan
      case 'medium':
        return new THREE.Color('#0aff00'); // Green
      case 'hard':
        return new THREE.Color('#ff00ff'); // Magenta
      case 'tough':
        return new THREE.Color('#bc13fe'); // Purple
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
        return new THREE.Color('#00f3ff');
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
            color="#00f3ff"
            transparent
            opacity={0.1}
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
          e.stopPropagation();
          if (!card.isMatched && !card.isFlipped) {
            onClick();
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={getCardScale()}
      >
        {/* Card geometry - slightly rounded by beveling edges */}
        <boxGeometry args={[0.9, 1.2, 0.05]} />

        {/* Materials mapping for BoxGeometry:
            0: Right (+x)
            1: Left (-x)
            2: Top (+y)
            3: Bottom (-y)
            4: Front (+z) - This is what we see initially (Card Back)
            5: Back (-z) - This is what we see when flipped (Card Front)
        */}

        {/* 0: Right Edge */}
        <meshStandardMaterial attach="material-0" color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />

        {/* 1: Left Edge */}
        <meshStandardMaterial attach="material-1" color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />

        {/* 2: Top Edge */}
        <meshStandardMaterial attach="material-2" color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />

        {/* 3: Bottom Edge */}
        <meshStandardMaterial attach="material-3" color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />

        {/* 4: Front Face (+Z) - Card Back (Cyber Texture) */}
        <meshStandardMaterial
          attach="material-4"
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.8}
          emissive="#00f3ff"
          emissiveIntensity={hovered ? 0.2 : 0}
        >
          {cyberTexture && (
            <canvasTexture
              attach="map"
              image={cyberTexture}
              wrapS={THREE.RepeatWrapping}
              wrapT={THREE.RepeatWrapping}
            />
          )}
        </meshStandardMaterial>

        {/* 5: Back Face (-Z) - Card Front (Value/Color) */}
        <meshStandardMaterial
          attach="material-5"
          color={getCardColor()}
          roughness={0.1}
          metalness={0.5}
          emissive={getCardColor()}
          emissiveIntensity={0.2}
          transparent={card.isMatched}
          opacity={card.isMatched ? 0.8 : 1}
        />

        {/* Card symbol/value (only visible when card is flipped) 
            Positioned on the -Z face (z = -0.03)
            Rotated to face the same way as the -Z face (which points to -Z)
            But when card rotates 180 deg around Y, -Z points to +Z (camera).
            Text needs to be readable then.
            If text is at rotation [0, PI, 0], it faces -Z.
            When card rotates PI, text rotates to face +Z. Correct.
        */}
        {isMounted && card.isFlipped && (
          <SimpleText
            position={[0, 0, -0.03]}
            rotation={[0, Math.PI, 0]}
            fontSize={2}
            color="#ffffff"
          >
            {getCardSymbol()}
          </SimpleText>
        )}
      </mesh>
    </group>
  );
}