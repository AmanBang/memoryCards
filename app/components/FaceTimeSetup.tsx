'use client';

import { useState } from 'react';
import { useStandaloneVideoCall } from '../context/StandaloneVideoCallContext';

export default function FaceTimeSetup() {
    const { displayName, setDisplayName, createRoom, joinRoom } = useStandaloneVideoCall();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    const handleCreateRoom = async () => {
        if (!displayName.trim()) {
            setError('Please enter your name');
            return;
        }

        setIsCreating(true);
        setError('');
        try {
            await createRoom();
        } catch (err) {
            setError('Failed to create room. Please check camera/microphone permissions.');
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!displayName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!roomIdInput.trim()) {
            setError('Please enter a room ID');
            return;
        }

        setIsJoining(true);
        setError('');
        try {
            await joinRoom(roomIdInput.trim());
        } catch (err) {
            setError('Failed to join room. Please check camera/microphone permissions.');
            setIsJoining(false);
        }
    };

    return (
        <div className="facetime-setup">
            <div className="setup-container">
                <div className="setup-header">
                    <div className="logo">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="2" y="5" width="14" height="14" rx="2"></rect>
                        </svg>
                    </div>
                    <h1 className="title">FaceTime</h1>
                    <p className="subtitle">Connect with friends and family</p>
                </div>

                <div className="setup-form">
                    <div className="input-group">
                        <label htmlFor="displayName">Your Name</label>
                        <input
                            id="displayName"
                            type="text"
                            placeholder="Enter your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                        />
                    </div>

                    <button
                        className="primary-button"
                        onClick={handleCreateRoom}
                        disabled={isCreating || isJoining}
                    >
                        {isCreating ? (
                            <>
                                <div className="spinner"></div>
                                Creating Room...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                Create New Call
                            </>
                        )}
                    </button>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="roomId">Room ID</label>
                        <input
                            id="roomId"
                            type="text"
                            placeholder="Enter room ID to join"
                            value={roomIdInput}
                            onChange={(e) => setRoomIdInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                        />
                    </div>

                    <button
                        className="secondary-button"
                        onClick={handleJoinRoom}
                        disabled={isCreating || isJoining}
                    >
                        {isJoining ? (
                            <>
                                <div className="spinner"></div>
                                Joining Room...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                </svg>
                                Join Call
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="error-message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .facetime-setup {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
          padding: 24px;
        }

        .setup-container {
          width: 100%;
          max-width: 480px;
          background: rgba(30, 30, 30, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .setup-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
        }

        .title {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .setup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .input-group input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .input-group input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .input-group input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .primary-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .secondary-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .primary-button:active:not(:disabled),
        .secondary-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .primary-button:disabled,
        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .divider {
          position: relative;
          text-align: center;
          margin: 8px 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .divider span {
          position: relative;
          display: inline-block;
          padding: 0 16px;
          background: rgba(30, 30, 30, 0.6);
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          font-weight: 500;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 14px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .setup-container {
            padding: 32px 24px;
          }

          .title {
            font-size: 28px;
          }

          .subtitle {
            font-size: 14px;
          }

          .logo {
            width: 64px;
            height: 64px;
          }

          .logo svg {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
        </div>
    );
}
