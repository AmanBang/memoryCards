'use client';

import { useVoiceChat } from '../context/VoiceChatContext';
import { useGame } from '../context/GameContext';

interface VideoParticipantProps {
    userId: string;
    displayName: string;
    stream?: MediaStream;
    isLocal?: boolean;
    isMuted?: boolean;
    isVideoEnabled?: boolean;
}

export default function VideoParticipant({
    userId,
    displayName,
    stream,
    isLocal = false,
    isMuted = false,
    isVideoEnabled = true
}: VideoParticipantProps) {
    return (
        <div className="video-participant">
            <div className="video-container">
                {isVideoEnabled && stream ? (
                    <video
                        id={isLocal ? 'local-video' : `remote-video-${userId}`}
                        autoPlay
                        playsInline
                        muted={isLocal} // Mute local video to prevent echo
                        ref={(videoElement) => {
                            if (videoElement && stream) {
                                videoElement.srcObject = stream;
                            }
                        }}
                    />
                ) : (
                    <div className="video-placeholder">
                        <div className="avatar">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}

                <div className="participant-info">
                    <span className="participant-name">{displayName} {isLocal && '(You)'}</span>
                    <div className="status-indicators">
                        {isMuted && (
                            <span className="status-icon muted" title="Microphone muted">
                                🎤
                            </span>
                        )}
                        {!isVideoEnabled && (
                            <span className="status-icon camera-off" title="Camera off">
                                📹
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .video-participant {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          aspect-ratio: 16 / 9;
        }

        .video-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e94560 0%, #533483 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: white;
          text-transform: uppercase;
        }

        .participant-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .participant-name {
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .status-indicators {
          display: flex;
          gap: 6px;
        }

        .status-icon {
          font-size: 16px;
          opacity: 0.9;
          filter: grayscale(100%) brightness(0.8);
        }

        @media (max-width: 768px) {
          .avatar {
            width: 60px;
            height: 60px;
            font-size: 24px;
          }

          .participant-name {
            font-size: 12px;
          }

          .status-icon {
            font-size: 14px;
          }
        }
      `}</style>
        </div>
    );
}
