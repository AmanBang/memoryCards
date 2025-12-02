'use client';

import { useStandaloneVideoCall } from '../context/StandaloneVideoCallContext';

export default function FaceTimeControls() {
    const { isMuted, isVideoEnabled, toggleMute, toggleVideo, leaveRoom } = useStandaloneVideoCall();

    return (
        <div className="facetime-controls">
            <div className="controls-container">
                <button
                    className={`control-button ${isMuted ? 'active' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    )}
                </button>

                <button
                    className="control-button end-call"
                    onClick={leaveRoom}
                    title="End Call"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.59 1.322l2.844-1.822 4.041 7.89-2.725 1.76c-.538.35-.932.958-.932 1.667v1.183c0 1.102.897 2 2 2h1.183c.709 0 1.317-.394 1.667-.932l1.76-2.725 7.89 4.041-1.822 2.844A5.001 5.001 0 0 1 15.5 19H8.5a5.001 5.001 0 0 1-4.996-4.772L1.682 3.5a2 2 0 0 1 1.908-2.178z" />
                    </svg>
                </button>

                <button
                    className={`control-button ${!isVideoEnabled ? 'active' : ''}`}
                    onClick={toggleVideo}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                    {!isVideoEnabled ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                            <path d="M10.66 5H14l3 3v7.34M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l.34.34"></path>
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="2" y="5" width="14" height="14" rx="2"></rect>
                        </svg>
                    )}
                </button>
            </div>

            <style jsx>{`
        .facetime-controls {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .controls-container {
          display: flex;
          gap: 16px;
          padding: 12px 24px;
          background: rgba(30, 30, 30, 0.8);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 48px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .control-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          background: rgba(60, 60, 60, 0.8);
          color: white;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .control-button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .control-button:hover::before {
          opacity: 1;
        }

        .control-button:hover {
          transform: scale(1.1);
          background: rgba(80, 80, 80, 0.9);
        }

        .control-button:active {
          transform: scale(0.95);
        }

        .control-button.active {
          background: rgba(239, 68, 68, 0.9);
        }

        .control-button.active:hover {
          background: rgba(239, 68, 68, 1);
        }

        .control-button.end-call {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
        }

        .control-button.end-call:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.6);
        }

        .control-button svg {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .facetime-controls {
            bottom: 24px;
          }

          .controls-container {
            gap: 12px;
            padding: 10px 20px;
          }

          .control-button {
            width: 48px;
            height: 48px;
          }

          .control-button svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
        </div>
    );
}
