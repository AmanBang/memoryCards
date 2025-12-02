'use client';

import { useStandaloneVideoCall } from '../context/StandaloneVideoCallContext';
import { useAuth } from '../context/AuthContext';
import FaceTimeParticipant from './FaceTimeParticipant';

export default function FaceTimeVideoGrid() {
    const { localStream, participants, isMuted, isVideoEnabled } = useStandaloneVideoCall();
    const { user } = useAuth();

    if (!localStream) return null;

    // Get all participants including local user
    const allParticipants = [
        {
            userId: user?.uid || '',
            displayName: 'You',
            stream: localStream,
            isLocal: true,
            isMuted,
            isVideoEnabled
        },
        ...participants.map(participant => {
            const videoElement = document.getElementById(`standalone-video-${participant.userId}`) as HTMLVideoElement;
            return {
                userId: participant.userId,
                displayName: participant.displayName,
                stream: videoElement?.srcObject as MediaStream || undefined,
                isLocal: false,
                isMuted: participant.isMuted,
                isVideoEnabled: participant.isVideoEnabled
            };
        })
    ];

    // For now, the first participant is the main speaker
    // In a real app, you'd detect who's speaking based on audio levels
    const mainSpeaker = allParticipants[0];
    const thumbnails = allParticipants.slice(1);

    return (
        <div className="facetime-video-grid">
            {/* Main speaker view */}
            <div className="main-speaker-container">
                <FaceTimeParticipant
                    {...mainSpeaker}
                    isMainSpeaker={true}
                />
            </div>

            {/* Thumbnail grid */}
            {thumbnails.length > 0 && (
                <div className="thumbnails-container">
                    <div className="thumbnails-grid">
                        {thumbnails.map(participant => (
                            <FaceTimeParticipant
                                key={participant.userId}
                                {...participant}
                                isMainSpeaker={false}
                            />
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
        .facetime-video-grid {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .main-speaker-container {
          width: 100%;
          height: 100%;
          padding: 24px;
        }

        .thumbnails-container {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 100;
          max-height: calc(100% - 180px);
          overflow-y: auto;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .thumbnails-container::-webkit-scrollbar {
          width: 6px;
        }

        .thumbnails-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .thumbnails-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .thumbnails-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .thumbnails-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 140px;
        }

        @media (max-width: 768px) {
          .main-speaker-container {
            padding: 16px;
          }

          .thumbnails-container {
            top: 16px;
            right: 16px;
            max-height: calc(100% - 140px);
          }

          .thumbnails-grid {
            width: 100px;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .thumbnails-container {
            top: 12px;
            right: 12px;
            left: 12px;
            max-height: auto;
            max-width: calc(100% - 24px);
          }

          .thumbnails-grid {
            flex-direction: row;
            width: 100%;
            overflow-x: auto;
          }

          .thumbnails-grid > :global(*) {
            min-width: 80px;
          }
        }
      `}</style>
        </div>
    );
}
