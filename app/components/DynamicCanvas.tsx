'use client';

import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Import Canvas with no SSR
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

interface DynamicCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export default function DynamicCanvas({ children, className = "" }: DynamicCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Add meta viewport tag to prevent scaling issues on mobile
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    return () => {
      // Restore default viewport
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="animate-pulse text-gray-400">Loading 3D environment...</div>
        </div>
      </div>
    );
  }

  return (
    <Canvas 
      className={className} 
      shadows 
      dpr={[1, 2]} // Limit pixel ratio for better performance
      gl={{ 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      }}
      performance={{ min: 0.5 }} // Improve performance by allowing frame rate to drop
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
} 