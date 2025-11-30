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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--neon-cyan)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-['Orbitron'] tracking-wider">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }
  
  // Show login if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--surface-light)_0%,_var(--background)_100%)]">
        <Login />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--background)] text-white p-2 sm:p-4 md:p-6 overflow-hidden relative">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--neon-cyan)] flex items-center justify-center shadow-[0_0_15px_var(--neon-cyan)]">
              <span className="text-black font-bold text-xl">M</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-widest neon-text-cyan">
              MEMORY<span className="text-[var(--neon-pink)] neon-text-pink">PROTOCOL</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-[var(--neon-cyan)]/30">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border-2 border-[var(--neon-cyan)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--surface-light)] border-2 border-[var(--neon-cyan)] flex items-center justify-center">
                  <span className="text-xs">{user.displayName?.charAt(0) || 'U'}</span>
                </div>
              )}
              <div className="hidden sm:block">
                <p className="font-medium text-sm text-[var(--neon-cyan)] uppercase tracking-wider">{user.displayName}</p>
                <p className="text-xs text-gray-400 font-mono">{user.email}</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Debug Toggle - Hidden by default, small icon to toggle */}
        <div className="fixed bottom-2 right-2 z-50">
           <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-[10px] bg-black/50 text-gray-500 px-2 py-1 rounded hover:text-white transition-colors"
            >
              {showDebug ? "Hide Debug" : "Debug"}
            </button>
            
            {showDebug && (
              <div className="absolute bottom-8 right-0 p-4 bg-black/90 border border-[var(--neon-cyan)] rounded text-xs w-64 glass-panel">
                <p className="text-[var(--neon-cyan)] mb-1">SYSTEM STATUS:</p>
                <p>Game ID: <span className="text-white">{gameId || 'None'}</span></p>
                <p>Loading: <span className={isLoading ? "text-yellow-400" : "text-green-400"}>{isLoading ? 'Yes' : 'No'}</span></p>
                <p>State: <span className="text-white">{gameState ? 'Active' : 'Idle'}</span></p>
                {gameState && (
                  <p>Players: {Object.keys(gameState.players).length}</p>
                )}
                <button 
                  onClick={testFirebaseConnection}
                  className="mt-2 w-full btn-cyber text-xs py-1"
                >
                  Test Connection
                </button>
              </div>
            )}
        </div>
        
        <main className="w-full">
          {!gameId ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <GameSetup />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
              <div className="lg:col-span-3 h-full glass-panel rounded-2xl overflow-hidden border border-[var(--neon-cyan)]/20 shadow-[0_0_30px_rgba(0,243,255,0.1)] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent opacity-50"></div>
                <GameBoard />
              </div>
              
              <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-y-auto pr-1">
                <div className="glass-panel p-4 rounded-xl border border-[var(--neon-pink)]/20">
                  <h3 className="text-[var(--neon-pink)] text-lg mb-3 border-b border-[var(--neon-pink)]/30 pb-2">Mission Data</h3>
                  <GameInfo />
                </div>
                
                <div className="glass-panel p-4 rounded-xl border border-[var(--neon-green)]/20 flex-grow">
                  <h3 className="text-[var(--neon-green)] text-lg mb-3 border-b border-[var(--neon-green)]/30 pb-2">Controls</h3>
                  <GameControls />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}