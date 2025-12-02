'use client';

import { useVoiceChat } from '../context/VoiceChatContext';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import VideoParticipant from './VideoParticipant';

export default function VideoGrid() {
    const { localStream, connectedUsers, isMuted, isVideoEnabled } = useVoiceChat();
    const { gameState } = useGame();
    const { user } = useAuth();

    if (!localStream) return null;

    // Get participant information
    const participants = [
        {
            userId: user?.uid || '',
            displayName: gameState?.players[user?.uid || '']?.displayName || 'You',
            stream: localStream,
            isLocal: true,
            isMuted,
            isVideoEnabled
        },
        ...connectedUsers.map(userId => {
            const videoElement = document.getElementById(`remote-video-${userId}`) as HTMLVideoElement;
            return {
                userId,
                displayName: gameState?.players[userId]?.displayName || 'Player',
                stream: videoElement?.srcObject as MediaStream || undefined,
                isLocal: false,
                isMuted: false, // We don't track remote mute state
                isVideoEnabled: true // We don't track remote video state
            };
        })
    ];

    const gridClass = participants.length === 1 ? 'grid-1' :
        participants.length === 2 ? 'grid-2' :
            participants.length === 3 ? 'grid-3' :
                'grid-4';

    return (
        <div className="video-grid-container">
            <div className={`video-grid ${gridClass}`}>
                {participants.map(participant => (
                    <VideoParticipant
                        key={participant.userId}
                        {...participant}
                    />
                ))}
            </div>

            <style jsx>{`
        .video-grid-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          max-width: 600px;
          max-height: 400px;
        }

        .video-grid {
          display: grid;
          gap: 12px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .grid-1 {
          grid-template-columns: 1fr;
          width: 320px;
        }

        .grid-2 {
          grid-template-columns: repeat(2, 1fr);
          width: 600px;
        }

        .grid-3 {
          grid-template-columns: repeat(2, 1fr);
          width: 600px;
        }

        .grid-4 {
          grid-template-columns: repeat(2, 1fr);
          width: 600px;
        }

        @media (max-width: 768px) {
          .video-grid-container {
            bottom: 10px;
            right: 10px;
            left: 10px;
            max-width: 100%;
          }

          .grid-1,
          .grid-2,
          .grid-3,
          .grid-4 {
            width: 100%;
          }

          .grid-2,
          .grid-3,
          .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
