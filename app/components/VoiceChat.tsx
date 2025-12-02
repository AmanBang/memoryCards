'use client';

import { useState, useEffect } from 'react';
import { useVoiceChat } from '../context/VoiceChatContext';
import { useGame } from '../context/GameContext';
import VideoGrid from './VideoGrid';

export default function VoiceChat() {
  const { isMuted, isVideoEnabled, isConnected, isCallActive, toggleMute, toggleVideo, startCall, endCall, connectedUsers } = useVoiceChat();
  const { gameState } = useGame();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showConnectedUsers, setShowConnectedUsers] = useState(false);

  // Get display names of connected users
  const getConnectedUserNames = () => {
    if (!gameState) return [];

    return connectedUsers.map(userId => {
      const player = gameState.players[userId];
      return player?.displayName || 'Unknown Player';
    });
  };

  // Handle call start with permission handling
  const handleStartCall = async () => {
    try {
      await startCall();
    } catch (error: any) {
      console.error('Error starting call:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      } else if (error.name === 'NotFoundError') {
        // Camera or microphone not found
        alert('Camera or microphone not found. Please connect a device and try again.');
      }
    }
  };

  return (
    <div className="voice-chat-controls">
      {/* Call not active state */}
      {!isCallActive && (
        <button
          onClick={handleStartCall}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-full transition-colors"
          title="Start voice chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          <span>Join Video Call</span>
        </button>
      )}

      {/* Call active state - show controls */}
      {isCallActive && (
        <div className="flex items-center space-x-2">
          {/* Mute/unmute button */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v3.933l-2.4-2.4A.997.997 0 004.2 6.6L7.5 9.9V8a.5.5 0 01.5-.5.5.5 0 01.5.5v3a.5.5 0 01-.5.5.5.5 0 01-.5-.5V10.5l-5.3 5.3a.997.997 0 001.4 1.4l16-16a.997.997 0 00-1.4-1.4L10 7.733V4a2 2 0 00-2-2H8z" clipRule="evenodd" />
                <path d="M16.72 14.4l-1.42-1.42A5.007 5.007 0 0015 10c0-2.76-2.24-5-5-5-.74 0-1.44.16-2.06.44L6.6 4.01C7.57 3.37 8.73 3 10 3c3.87 0 7 3.13 7 7 0 1.57-.52 3.02-1.39 4.19z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v6a2 2 0 104 0V4a2 2 0 00-2-2zm3 8a3 3 0 11-6 0 3 3 0 016 0zm-3 6a6 6 0 01-5.3-3.17l-.24-.45a.75.75 0 011.32-.71l.24.45A4.5 4.5 0 0010 14.5a4.5 4.5 0 004.5-4.5c0-1.35-.59-2.58-1.53-3.42a.75.75 0 01.97-1.15C15.29 6.45 16 8.14 16 10a6 6 0 01-6 6z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Camera toggle button */}
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-full ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {!isVideoEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13.657V6.343a1 1 0 00-1.447-.894l-2 1A2 2 0 0012 6V4a2 2 0 00-2-2H6.414l-2.707-2.707zm5.586 5.586L12 10.586V6H9.293zM2 6a2 2 0 012-2h.879L2 1.121V6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            )}
          </button>

          {/* Connection status indicator */}
          <div
            className="relative cursor-pointer"
            onClick={() => setShowConnectedUsers(!showConnectedUsers)}
            title="Connected users"
          >
            <div className={`p-2 rounded-full ${isConnected ? 'bg-blue-500' : 'bg-gray-500'} text-white`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zm5 2a2 2 0 11-4 0 2 2 0 014 0zm-4 7a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zm10 10v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>

            {/* Show connected users in a dropdown */}
            {showConnectedUsers && connectedUsers.length > 0 && (
              <div className="absolute bottom-full mb-2 right-0 bg-white shadow-lg rounded-md p-2 min-w-[150px] z-10">
                <h4 className="text-sm font-semibold mb-1">Connected Users:</h4>
                <ul className="text-sm">
                  {getConnectedUserNames().map((name, index) => (
                    <li key={index} className="py-1">{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* End call button */}
          <button
            onClick={endCall}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
            title="End call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.924 2.617a.997.997 0 00-.215-.322l-.004-.004A.997.997 0 0017 2h-4a1 1 0 100 2h1.586l-3.293 3.293a1 1 0 001.414 1.414L16 5.414V7a1 1 0 102 0V3a.997.997 0 00-.076-.383z" />
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              <path d="M16.707 16.707a1 1 0 01-1.414 0L1.707 3.121a1 1 0 011.414-1.414l13.586 13.586a1 1 0 010 1.414z" />
            </svg>
          </button>
        </div>
      )}

      {/* Show permission denied message */}
      {permissionDenied && (
        <div className="mt-2 text-red-500 text-xs">
          Camera or microphone access denied. Please check your browser permissions.
        </div>
      )}

      {/* Video Grid */}
      {isCallActive && <VideoGrid />}
    </div>
  );
} 