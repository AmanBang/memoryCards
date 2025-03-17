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
    <Canvas className={className} shadows>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
} 