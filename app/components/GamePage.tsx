'use client';

import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GameBoard from './GameBoard';
import GameInfo from './GameInfo';
import GameSetup from './GameSetup';
import GameControls from './GameControls';
import Login from './Login';
import { database } from '../firebase/config';
import { ref, set } from 'firebase/database';
import { useState } from 'react';

export default function GamePage() {
  const { user, loading: authLoading } = useAuth();
  const { gameState, gameId, isLoading } = useGame();
  const [showDebug, setShowDebug] = useState(false);
  
  // Function to test Firebase connectivity
  const testFirebaseConnection = async () => {
    try {
      const testRef = ref(database, 'test');
      await set(testRef, {
        timestamp: Date.now(),
        message: 'Test connection successful'
      });
      console.log('Test data saved to Firebase');
      alert('Test data saved to Firebase');
    } catch (error: any) {
      console.error('Error saving test data to Firebase:', error);
      alert('Error saving test data: ' + (error?.message || 'Unknown error'));
    }
  };
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  // Show login if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Login />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Memory Game</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-sm sm:text-base">{user.displayName}</p>
                <p className="text-xs sm:text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
          
          {/* Debug information */}
          <div className="mt-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs bg-gray-700 px-2 py-1 rounded"
            >
              {showDebug ? "Hide Debug" : "Show Debug"}
            </button>
            
            {showDebug && (
              <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                <p>Game ID: {gameId || 'None'}</p>
                <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>Game State: {gameState ? 'Available' : 'None'}</p>
                {gameState && (
                  <p>Players: {Object.keys(gameState.players).length}</p>
                )}
                <button 
                  onClick={testFirebaseConnection}
                  className="mt-2 bg-blue-600 px-2 py-1 rounded text-white"
                >
                  Test Firebase Connection
                </button>
              </div>
            )}
          </div>
        </header>
        
        <main>
          {!gameId ? (
            <GameSetup />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <GameBoard />
              </div>
              <div className="lg:sticky lg:top-4 self-start space-y-4">
                <GameInfo />
                <GameControls />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}