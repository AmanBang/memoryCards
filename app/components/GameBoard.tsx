'use client';

import { useState, useEffect } from 'react';
import Card2D from './Card2D';
import { useGame } from '../context/GameContext';
import { calculateGrid } from '../utils/helpers';
import VoiceChat from './VoiceChat';

export default function GameBoard() {
  const { gameState, flipCard, isOffline } = useGame();
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [gridStyle, setGridStyle] = useState({});

  // Force re-render every 30 seconds to keep the timer updated
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for fullscreen change events (e.g. user pressing Esc)
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
      const { rows, cols } = calculateGrid(gameState.cards.length);
      const gap = 16; // 1rem = 16px
      const padding = 32; // 2rem = 32px

      // Available space
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const availableWidth = isFullScreen ? vw - padding : Math.min(vw - padding, 1152); // max-w-6xl is 1152px
      const availableHeight = isFullScreen ? vh - padding : Math.max(500, vh * 0.7); // Min 500px or 70% of screen height

      // Card aspect ratio 3:4
      const cardAspectRatio = 3 / 4;

      // Calculate max card width based on available width
      // width = (availableWidth - (cols - 1) * gap) / cols
      const maxCardWidthFromWidth = (availableWidth - (cols - 1) * gap) / cols;

      // Calculate max card width based on available height
      // height = width / ratio
      // height = (availableHeight - (rows - 1) * gap) / rows
      // width = height * ratio
      const maxCardHeightFromHeight = (availableHeight - (rows - 1) * gap) / rows;
      const maxCardWidthFromHeight = maxCardHeightFromHeight * cardAspectRatio;

      // Choose the smaller of the two to ensure it fits both dimensions
      const cardWidth = Math.min(maxCardWidthFromWidth, maxCardWidthFromHeight);

      setGridStyle({
        gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
        gap: `${gap}px`,
        maxWidth: '100%',
        justifyContent: 'center'
      });
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [gameState, isFullScreen]);

  const handleCardClick = (cardId: number) => {
    if (isOffline) {
      console.log('Cannot flip card while offline');
      return;
    }
    flipCard(cardId);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
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

  return (
    <div
      className={`
        bg-black rounded-lg overflow-hidden relative flex flex-col items-center justify-center transition-all duration-300
        ${isFullScreen ? 'fixed inset-0 z-50 h-screen w-screen p-4' : 'w-full h-full min-h-[500px] p-4'}
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className="grid transition-all duration-300"
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
}