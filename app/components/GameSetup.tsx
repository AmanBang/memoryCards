'use client';

import { useState, useEffect } from 'react';
import { useGame, Difficulty } from '../context/GameContext';
import { copyToClipboard } from '../utils/helpers';

export default function GameSetup() {
  const { createGame, joinGame, isLoading, gameId, testConnection, isOffline } = useGame();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [joinGameId, setJoinGameId] = useState('');
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update createdGameId when gameId changes in the context
  useEffect(() => {
    console.log('GameId from context in useEffect:', gameId);
    if (gameId) {
      console.log('Setting createdGameId from context:', gameId);
      setCreatedGameId(gameId);
    }
  }, [gameId]);
  
  const handleCreateGame = async () => {
    if (isOffline) {
      setError("You're currently offline. Please check your internet connection and try again.");
      return;
    }
    
    try {
      setError(null);
      console.log('Creating game with difficulty:', difficulty);
      const newGameId = await createGame(difficulty);
      console.log('Game created with ID:', newGameId);
      
      // Directly set the createdGameId when we get it back from createGame
      if (newGameId) {
        setCreatedGameId(newGameId);
        console.log('Created game ID set to:', newGameId);
      } else {
        console.error('No game ID returned from createGame');
        setError('Failed to create game: No game ID returned');
      }
    } catch (err: any) {
      console.error('Error creating game:', err);
      setError('Failed to create game: ' + (err?.message || 'Unknown error'));
    }
  };
  
  const handleJoinGame = async () => {
    if (isOffline) {
      setError("You're currently offline. Please check your internet connection and try again.");
      return;
    }
    
    if (!joinGameId.trim()) {
      setError('Please enter a game ID');
      return;
    }
    
    try {
      setError(null);
      console.log('Joining game with ID:', joinGameId);
      const success = await joinGame(joinGameId);
      
      if (!success) {
        console.error('Failed to join game: Game not found or already full');
        setError('Game not found or already full');
      } else {
        console.log('Successfully joined game');
      }
    } catch (err: any) {
      console.error('Error joining game:', err);
      setError('Failed to join game: ' + (err?.message || 'Unknown error'));
    }
  };
  
  const handleCopyGameId = async () => {
    if (createdGameId) {
      console.log('Copying game ID to clipboard:', createdGameId);
      try {
        await copyToClipboard(createdGameId);
        alert('Game ID copied to clipboard!');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        setError('Failed to copy game ID. Please copy it manually.');
      }
    }
  };
  
  const handleTestConnection = async () => {
    try {
      const success = await testConnection();
      if (success) {
        alert('Firebase connection successful!');
      } else {
        alert('Firebase connection failed. Check console for details.');
      }
    } catch (err) {
      console.error('Error testing connection:', err);
      alert('Error testing connection. Check console for details.');
    }
  };
  
  console.log('Render GameSetup: createdGameId =', createdGameId, 'gameId =', gameId);
  
  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Memory Game</h2>
      
      {isOffline && (
        <div className="mb-4 p-3 bg-yellow-700 rounded-md">
          <p className="font-semibold">You are currently offline</p>
          <p className="text-sm mt-1">Some features may not work until you reconnect to the internet.</p>
        </div>
      )}
      
      {/* Test connection button */}
      <div className="mb-4">
        <button
          onClick={handleTestConnection}
          className="w-full bg-purple-600 py-2 rounded-md hover:bg-purple-700"
        >
          Test Firebase Connection
        </button>
      </div>
      
      {createdGameId ? (
        <div className="mb-6">
          <p className="mb-2">Share this game ID with your friend:</p>
          <div className="flex">
            <input
              type="text"
              value={createdGameId}
              readOnly
              className="flex-1 bg-gray-700 p-2 rounded-l-md"
            />
            <button
              onClick={handleCopyGameId}
              className="bg-blue-600 px-4 rounded-r-md hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Waiting for another player to join...
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Create a New Game</h3>
            <div className="mb-4">
              <label className="block mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full bg-gray-700 p-2 rounded-md"
                disabled={isLoading}
              >
                <option value="easy">Easy (16 cards)</option>
                <option value="medium">Medium (36 cards)</option>
                <option value="hard">Hard (64 cards)</option>
                <option value="tough">Tough (100 cards)</option>
                <option value="genius">Genius (120 cards)</option>
              </select>
            </div>
            <button
              onClick={handleCreateGame}
              disabled={isLoading || isOffline}
              className="w-full bg-blue-600 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
          
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-2">Join a Game</h3>
            <div className="mb-4">
              <label className="block mb-2">Game ID</label>
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded-md"
                placeholder="Enter game ID"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleJoinGame}
              disabled={isLoading || !joinGameId.trim() || isOffline}
              className="w-full bg-green-600 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-900 rounded-md">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}