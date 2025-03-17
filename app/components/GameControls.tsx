'use client';

import { useGame } from '../context/GameContext';

export default function GameControls() {
  const { gameState, resetGame, leaveGame } = useGame();
  
  if (!gameState) return null;
  
  const handleResetGame = async () => {
    await resetGame();
  };
  
  const handleLeaveGame = async () => {
    await leaveGame();
  };
  
  return (
    <div className="flex gap-4 mt-4">
      {gameState.status === 'finished' && (
        <button
          onClick={handleResetGame}
          className="flex-1 bg-green-600 py-2 px-4 rounded-md hover:bg-green-700 text-white"
        >
          Play Again
        </button>
      )}
      
      <button
        onClick={handleLeaveGame}
        className="flex-1 bg-red-600 py-2 px-4 rounded-md hover:bg-red-700 text-white"
      >
        Leave Game
      </button>
    </div>
  );
} 