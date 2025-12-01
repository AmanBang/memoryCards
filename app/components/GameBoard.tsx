'use client';

import { useState, useEffect, useRef } from 'react';
import Card2D from './Card2D';
import { useGame } from '../context/GameContext';
import { calculateGrid } from '../utils/helpers';
import VoiceChat from './VoiceChat';

import { createPortal } from 'react-dom';

export default function GameBoard() {
  const { gameState, flipCard, isOffline } = useGame();
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [gridStyle, setGridStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force re-render every 30 seconds to keep the timer updated
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Calculate grid dimensions and style
  useEffect(() => {
    if (!gameState) return;

    const calculateLayout = () => {
      // Get base grid dimensions
      let { rows, cols } = calculateGrid(gameState.cards.length);

      const gap = 8; // Smaller gap for mobile
      const padding = 16; // Smaller padding

      // Check if mobile
      const isMobile = window.innerWidth < 640;

      // Force 4 columns on mobile for 16 cards (Easy mode) to match reference image
      if (isMobile && gameState.cards.length === 16) {
        cols = 4;
        rows = 4;
      }

      let availableWidth, availableHeight;

      if (isFullScreen) {
        availableWidth = window.innerWidth - padding * 2;
        availableHeight = window.innerHeight - padding * 2;
      } else {
        // In normal mode, try to use container width, fallback to window
        availableWidth = containerRef.current?.clientWidth
          ? containerRef.current.clientWidth - padding * 2
          : window.innerWidth - padding * 2;

        // Constrain height in normal mode to avoid scrolling the whole page if possible
        const headerHeight = 140;
        availableHeight = Math.min(window.innerHeight - headerHeight - padding * 2, 600);
      }

      // Safety check
      availableWidth = Math.max(280, availableWidth);
      availableHeight = Math.max(300, availableHeight);

      // Card aspect ratio 3:4 (standard playing card ratio)
      // The reference image shows slightly taller cards, maybe 2:3 or 3:4.5
      const cardAspectRatio = 3 / 4.2;

      // Calculate max card width based on available width
      const maxCardWidthFromWidth = (availableWidth - (cols - 1) * gap) / cols;

      // Calculate max card width based on available height
      const maxCardHeightFromHeight = (availableHeight - (rows - 1) * gap) / rows;
      const maxCardWidthFromHeight = maxCardHeightFromHeight * cardAspectRatio;

      // Choose the smaller to fit both, but set a reasonable minimum
      let cardWidth = Math.floor(Math.min(maxCardWidthFromWidth, maxCardWidthFromHeight));

      // On mobile, prioritize width fit over height fit to ensure 4 columns are visible
      // The reference image shows cards filling the width
      if (isMobile) {
        // Use the width-based calculation primarily, but clamp if it makes cards too tall
        cardWidth = Math.floor(maxCardWidthFromWidth);

        // If this width makes the total height exceed available height significantly, scale down
        // But for 16 cards, scrolling is acceptable if needed, though fitting is better
        const totalHeight = rows * (cardWidth / cardAspectRatio) + (rows - 1) * gap;
        if (totalHeight > availableHeight && isFullScreen) {
          // If full screen, try to fit in height too
          cardWidth = Math.floor(Math.min(cardWidth, maxCardWidthFromHeight));
        }
      }

      setGridStyle({
        gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
        gap: `${gap}px`,
        maxWidth: '100%',
        justifyContent: 'center',
        alignContent: 'center',
        paddingBottom: isMobile ? '80px' : '0' // Add bottom padding on mobile for controls
      });
    };

    calculateLayout();

    // Observer for container resize
    const observer = new ResizeObserver(calculateLayout);
    if (containerRef.current && !isFullScreen) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', calculateLayout);

    return () => {
      window.removeEventListener('resize', calculateLayout);
      observer.disconnect();
    };
  }, [gameState, isFullScreen]);

  const handleCardClick = (cardId: number) => {
    if (isOffline) {
      console.log('Cannot flip card while offline');
      return;
    }
    flipCard(cardId);
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      // Try native fullscreen first
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.log("Native fullscreen failed, falling back to CSS fullscreen");
          setIsFullScreen(true);
        });
      } else {
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

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

  const GameContent = (
    <div
      ref={containerRef}
      className={`
        bg-black relative flex flex-col items-center justify-center transition-all duration-300
        ${isFullScreen ? 'fixed inset-0 z-[9999] w-screen h-screen p-4' : 'w-full h-full min-h-[400px] p-4 rounded-lg overflow-hidden'}
      `}
    >
      {isOffline && (
        <div className="absolute top-2 right-2 z-10 bg-red-900/80 border border-red-500 text-red-200 px-3 py-1 rounded-full text-xs font-mono animate-pulse">
          OFFLINE MODE
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={toggleFullScreen}
          className="bg-black/50 hover:bg-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:text-black border border-[var(--neon-cyan)] p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>

      {/* Voice Chat Controls */}
      <div className={`absolute bottom-4 right-4 z-10 ${isFullScreen ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
        <VoiceChat />
      </div>

      {/* 2D Grid Container */}
      <div
        className="grid transition-all duration-300 content-center justify-center w-full h-full overflow-y-auto"
        style={gridStyle}
      >
        {gameState.cards.map((card) => (
          <Card2D
            key={`card-${card.id}`}
            card={card}
            onClick={() => handleCardClick(card.id)}
            difficulty={gameState.difficulty || "medium"}
          />
        ))}
      </div>
    </div>
  );

  if (isFullScreen && mounted) {
    return createPortal(GameContent, document.body);
  }

  return GameContent;
}