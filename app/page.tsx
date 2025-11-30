'use client';

import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { VoiceChatProvider } from './context/VoiceChatContext';
import GamePage from './components/GamePage';

export default function Home() {
  return (
    <AuthProvider>
      <GameProvider>
        <VoiceChatProvider>
          <GamePage />
        </VoiceChatProvider>
      </GameProvider>
    </AuthProvider>
  );
}
