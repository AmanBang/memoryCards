'use client';

import { useStandaloneVideoCall } from '../context/StandaloneVideoCallContext';
import FaceTimeVideoGrid from './FaceTimeVideoGrid';
import FaceTimeControls from './FaceTimeControls';
import { useState } from 'react';

export default function FaceTimeRoom() {
    const { roomId, participants } = useStandaloneVideoCall();
    const [copied, setCopied] = useState(false);

    const copyRoomId = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="facetime-room">
            {/* Header with room info */}
            <div className="room-header">
                <div className="room-info">
                    <div className="room-id-container">
                        <span className="room-label">Room ID:</span>
                        <code className="room-id">{roomId}</code>
                        <button className="copy-button" onClick={copyRoomId} title="Copy Room ID">
                            {copied ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="participant-count">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{participants.length + 1} {participants.length === 0 ? 'participant' : 'participants'}</span>
                    </div>
                </div>
            </div>

            {/* Video grid */}
            <FaceTimeVideoGrid />

            {/* Controls */}
            <FaceTimeControls />

            <style jsx>{`
        .facetime-room {
          position: fixed;
          inset: 0;
          background: #000;
          overflow: hidden;
        }

        .room-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          padding: 24px;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .room-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .room-id-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(30, 30, 30, 0.8);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: fit-content;
        }

        .room-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
        }

        .room-id {
          color: white;
          font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .copy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .copy-button:active {
          transform: scale(0.95);
        }

        .participant-count {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(30, 30, 30, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
          font-weight: 500;
          width: fit-content;
        }

        .participant-count svg {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .room-header {
            padding: 16px;
          }

          .room-id-container {
            padding: 10px 12px;
            gap: 8px;
          }

          .room-label,
          .room-id {
            font-size: 12px;
          }

          .copy-button {
            width: 28px;
            height: 28px;
          }

          .copy-button svg {
            width: 14px;
            height: 14px;
          }

          .participant-count {
            font-size: 12px;
            padding: 6px 10px;
          }

          .participant-count svg {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>
        </div>
    );
}
