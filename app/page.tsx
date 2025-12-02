'use client';

import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { VoiceChatProvider } from './context/VoiceChatContext';
import { StandaloneVideoCallProvider } from './context/StandaloneVideoCallContext';
import GamePage from './components/GamePage';
import FaceTimeVideoCall from './components/FaceTimeVideoCall';
import { useState } from 'react';

export default function Home() {
  const [showVideoCall, setShowVideoCall] = useState(true);

  return (
    <AuthProvider>
      <GameProvider>
        <VoiceChatProvider>
          <StandaloneVideoCallProvider>
            {showVideoCall ? (
              <FaceTimeVideoCall />
            ) : (
              <GamePage />
            )}

            {/* Toggle button to switch between video call and game */}
            {!showVideoCall && (
              <button
                onClick={() => setShowVideoCall(true)}
                style={{
                  position: 'fixed',
                  bottom: '20px',
                  left: '20px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                  zIndex: 1000,
                }}
              >
                📹 Video Call
              </button>
            )}
          </StandaloneVideoCallProvider>
        </VoiceChatProvider>
      </GameProvider>
    </AuthProvider>
  );
}
