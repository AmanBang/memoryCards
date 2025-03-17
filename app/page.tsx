'use client';

import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import GamePage from './components/GamePage';

export default function Home() {
  return (
    <AuthProvider>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </AuthProvider>
  );
}
