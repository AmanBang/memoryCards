'use client';

import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { formatTime } from '../utils/helpers';

export default function GameInfo() {
  const { gameState } = useGame();
  const { user } = useAuth();
  
  if (!gameState || !user) return null;
  
  const isMyTurn = gameState.currentPlayer === user.uid;
  const gameStatus = gameState.status;
  const elapsedTime = gameState.startTime 
    ? (gameState.endTime || Date.now()) - gameState.startTime 
    : 0;
  
  const getStatusText = () => {
    if (gameStatus === 'waiting') {
      return 'Waiting for another player to join...';
    } else if (gameStatus === 'playing') {
      return isMyTurn ? 'Your turn' : 'Opponent\'s turn';
    } else if (gameStatus === 'finished') {
      if (gameState.winner === user.uid) {
        return 'You won!';
      } else if (gameState.winner === null) {
        return 'It\'s a tie!';
      } else {
        return 'You lost!';
      }
    }
    return '';
  };
  
  const getDifficultyLabel = () => {
    const firstLetter = gameState.difficulty.charAt(0).toUpperCase();
    const restOfWord = gameState.difficulty.slice(1);
    return `${firstLetter}${restOfWord}`;
  };
  
  const getScores = () => {
    const scores: { id: string; name: string; score: number }[] = [];
    
    Object.entries(gameState.players).forEach(([id, player]) => {
      scores.push({
        id,
        name: player.displayName,
        score: player.score,
      });
    });
    
    return scores;
  };
  
  const scores = getScores();
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{getDifficultyLabel()} Mode</h2>
          <p className="text-gray-300">
            {gameState.cards.length} cards ({gameState.cards.length / 2} pairs)
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono">{formatTime(elapsedTime)}</p>
          <p className="text-sm text-gray-300">Time</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <p className="text-lg font-semibold">{getStatusText()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {scores.map((score) => (
          <div 
            key={score.id} 
            className={`p-3 rounded-lg ${score.id === user.uid ? 'bg-blue-900' : 'bg-gray-700'} ${score.id === gameState.currentPlayer && gameState.status === 'playing' ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <p className="font-medium">{score.id === user.uid ? 'You' : score.name}</p>
            <p className="text-2xl font-bold">{score.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}