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

export default function GamePage() {
  const { user, loading: authLoading } = useAuth();
  const { gameState, gameId, isLoading } = useGame();
  
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
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Memory Game</h1>
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
          
          {/* Debug information */}
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
        </header>
        
        <main>
          {!gameId ? (
            <GameSetup />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GameBoard />
              </div>
              <div>
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