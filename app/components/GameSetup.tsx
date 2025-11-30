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
    if (gameId) {
      setCreatedGameId(gameId);
    }
  }, [gameId]);

  const handleCreateGame = async () => {
    if (isOffline) {
      setError("OFFLINE MODE: Cannot create online game.");
      return;
    }

    try {
      setError(null);
      const newGameId = await createGame(difficulty);
      if (newGameId) {
        setCreatedGameId(newGameId);
      }
    } catch (err: any) {
      console.error('Error creating game:', err);
      if (err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Permission denied')) {
        setError('ACCESS DENIED: Database rules prevent writing. Check Firebase Console.');
      } else {
        setError('SYSTEM ERROR: ' + (err?.message || 'Unknown error'));
      }
    }
  };

  const handleJoinGame = async () => {
    if (isOffline) {
      setError("OFFLINE MODE: Cannot join online game.");
      return;
    }

    if (!joinGameId.trim()) {
      setError('INPUT REQUIRED: Enter Game ID');
      return;
    }

    try {
      setError(null);
      const success = await joinGame(joinGameId);

      if (!success) {
        setError('ACCESS DENIED: Game not found or full');
      }
    } catch (err: any) {
      setError('CONNECTION ERROR: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleCopyGameId = async () => {
    if (createdGameId) {
      try {
        await copyToClipboard(createdGameId);
        // Could add a toast notification here
      } catch (err) {
        setError('CLIPBOARD ERROR: Copy manually');
      }
    }
  };

  const handleTestConnection = async () => {
    try {
      const success = await testConnection();
      if (success) {
        alert('CONNECTION ESTABLISHED');
      } else {
        alert('CONNECTION FAILED');
      }
    } catch (err) {
      alert('CONNECTION ERROR');
    }
  };

  return (
    <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative overflow-hidden neon-border">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]"></div>

      <h2 className="text-3xl font-bold mb-8 text-center tracking-widest text-white">
        <span className="text-[var(--neon-cyan)]">INITIATE</span> PROTOCOL
      </h2>

      {isOffline && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          <p className="font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            OFFLINE MODE DETECTED
          </p>
          <p className="mt-1 opacity-80">Network features unavailable.</p>
        </div>
      )}

      {createdGameId ? (
        <div className="mb-8 animate-in fade-in zoom-in duration-300">
          <p className="mb-2 text-[var(--neon-cyan)] text-sm uppercase tracking-wider">Share Access Code:</p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={createdGameId}
              readOnly
              className="flex-1 input-cyber p-3 rounded-lg text-center font-mono text-lg tracking-widest border-[var(--neon-cyan)] text-[var(--neon-cyan)]"
            />
            <button
              onClick={handleCopyGameId}
              className="btn-cyber px-6 rounded-lg font-bold"
            >
              COPY
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-400 text-sm animate-pulse">
            <div className="w-2 h-2 bg-[var(--neon-cyan)] rounded-full"></div>
            Waiting for player connection...
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-[var(--neon-cyan)] text-sm uppercase tracking-wider border-b border-[var(--neon-cyan)]/30 pb-2">Create New Session</h3>
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full input-cyber p-3 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
              >
                <option value="easy">LEVEL 1: EASY (16 UNITS)</option>
                <option value="medium">LEVEL 2: MEDIUM (36 UNITS)</option>
                <option value="hard">LEVEL 3: HARD (64 UNITS)</option>
                <option value="tough">LEVEL 4: TOUGH (100 UNITS)</option>
                <option value="genius">LEVEL 5: GENIUS (120 UNITS)</option>
              </select>
            </div>
            <button
              onClick={handleCreateGame}
              disabled={isLoading || isOffline}
              className="w-full btn-cyber py-3 rounded-lg font-bold text-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'INITIALIZING...' : 'CREATE SESSION'}
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full h-px bg-gray-800"></div>
            <span className="relative bg-[#0a0a0a] px-4 text-gray-600 text-xs uppercase tracking-widest">OR</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-[var(--neon-pink)] text-sm uppercase tracking-wider border-b border-[var(--neon-pink)]/30 pb-2">Join Existing Session</h3>
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase">Access Code</label>
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                className="w-full input-cyber p-3 rounded-lg focus:border-[var(--neon-pink)] focus:shadow-[0_0_10px_rgba(255,0,255,0.3)]"
                placeholder="ENTER CODE..."
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleJoinGame}
              disabled={isLoading || !joinGameId.trim() || isOffline}
              className="w-full btn-cyber-pink py-3 rounded-lg font-bold text-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'CONNECTING...' : 'JOIN SESSION'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-xs text-center font-mono animate-pulse">
          ERROR: {error}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={handleTestConnection}
          className="text-[10px] text-gray-600 hover:text-[var(--neon-cyan)] transition-colors uppercase tracking-widest"
        >
          Test Network Connectivity
        </button>
      </div>
    </div>
  );
}