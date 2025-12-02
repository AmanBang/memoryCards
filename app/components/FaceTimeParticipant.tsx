'use client';

import { useStandaloneVideoCall } from '../context/StandaloneVideoCallContext';

interface FaceTimeParticipantProps {
    userId: string;
    displayName: string;
    stream?: MediaStream;
    isLocal?: boolean;
    isMuted?: boolean;
    isVideoEnabled?: boolean;
    isMainSpeaker?: boolean;
}

export default function FaceTimeParticipant({
    userId,
    displayName,
    stream,
    isLocal = false,
    isMuted = false,
    isVideoEnabled = true,
    isMainSpeaker = false
}: FaceTimeParticipantProps) {
    return (
        <div className={`facetime-participant ${isMainSpeaker ? 'main-speaker' : 'thumbnail'}`}>
            <div className="video-container">
                {isVideoEnabled && stream ? (
                    <video
                        id={isLocal ? 'facetime-local-video' : `facetime-video-${userId}`}
                        autoPlay
                        playsInline
                        muted={isLocal}
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

                <div className="participant-overlay">
                    <div className="participant-info">
                        <span className="participant-name">{displayName}</span>
                        <div className="status-indicators">
                            {isMuted && (
                                <div className="status-badge muted">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .facetime-participant {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .facetime-participant.main-speaker {
          width: 100%;
          height: 100%;
          border-radius: 24px;
        }

        .facetime-participant.thumbnail {
          aspect-ratio: 9 / 16;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .facetime-participant.thumbnail:hover {
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.2);
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
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
        }

        .avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
        }

        .thumbnail .avatar {
          width: 60px;
          height: 60px;
          font-size: 24px;
        }

        .participant-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .facetime-participant:hover .participant-overlay,
        .thumbnail .participant-overlay {
          opacity: 1;
        }

        .participant-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .participant-name {
          color: white;
          font-weight: 600;
          font-size: 16px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        }

        .thumbnail .participant-name {
          font-size: 12px;
        }

        .status-indicators {
          display: flex;
          gap: 8px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          color: white;
        }

        .thumbnail .status-badge {
          width: 24px;
          height: 24px;
        }

        .thumbnail .status-badge svg {
          width: 12px;
          height: 12px;
        }

        .status-badge.muted {
          background: rgba(239, 68, 68, 0.9);
        }

        @media (max-width: 768px) {
          .avatar {
            width: 80px;
            height: 80px;
            font-size: 32px;
          }

          .thumbnail .avatar {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .participant-name {
            font-size: 14px;
          }
        }
      `}</style>
        </div>
    );
}
