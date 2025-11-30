'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useGame } from './GameContext';
import { database } from '../firebase/config';
import { ref, set, onValue, off, onDisconnect } from 'firebase/database';

interface PeerConnection {
  connection: RTCPeerConnection;
  audioTrack?: MediaStreamTrack;
}

interface VoiceChatContextType {
  isMuted: boolean;
  isConnected: boolean;
  isCallActive: boolean;
  toggleMute: () => void;
  startCall: () => Promise<void>;
  endCall: () => void;
  connectedUsers: string[];
}

const VoiceChatContext = createContext<VoiceChatContextType | undefined>(undefined);

export function useVoiceChat() {
  const context = useContext(VoiceChatContext);
  if (context === undefined) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider');
  }
  return context;
}

export function VoiceChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { gameId, gameState } = useGame();
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<Record<string, PeerConnection>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  // ICE servers configuration for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Send signaling data to another peer through Firebase
  const sendSignal = async (peerId: string, signal: any) => {
    if (!gameId || !user) return;

    const signalingRef = ref(database, `voiceChat/${gameId}/signaling/${peerId}/${user.uid}`);
    try {
      await set(signalingRef, signal);
    } catch (error) {
      console.error('Error sending signal (check Firebase rules):', error);
    }
  };

  // Create RTCPeerConnection for a peer
  const createPeerConnection = async (peerId: string) => {
    if (!gameId || !user || !localStream) return;

    // Create new RTCPeerConnection
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local audio tracks
    localStream.getAudioTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, { candidate: event.candidate });
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      // Create audio element for remote audio
      const audioElement = document.createElement('audio');
      audioElement.srcObject = event.streams[0];
      audioElement.autoplay = true;
      audioElement.id = `remote-audio-${peerId}`;
      document.body.appendChild(audioElement);
    };

    // Store the connection
    setPeerConnections(prev => ({
      ...prev,
      [peerId]: {
        connection: peerConnection,
      }
    }));

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendSignal(peerId, offer);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (senderId: string, offer: RTCSessionDescriptionInit) => {
    if (!gameId || !user || !localStream) return;

    // Create RTCPeerConnection if it doesn't exist
    if (!peerConnections[senderId]) {
      const peerConnection = new RTCPeerConnection(iceServers);

      // Add local audio tracks
      localStream.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(senderId, { candidate: event.candidate });
        }
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        // Create audio element for remote audio
        const audioElement = document.createElement('audio');
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;
        audioElement.id = `remote-audio-${senderId}`;
        document.body.appendChild(audioElement);
      };

      // Store the connection
      setPeerConnections(prev => ({
        ...prev,
        [senderId]: {
          connection: peerConnection,
        }
      }));

      // Set remote description from offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      try {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal(senderId, answer);
      } catch (error) {
        console.error('Error creating answer:', error);
      }
    }
  };

  // Handle incoming answer
  const handleAnswer = async (senderId: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peerConnections[senderId]?.connection;
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = async (senderId: string, ice: any) => {
    const peerConnection = peerConnections[senderId]?.connection;
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(ice.candidate));
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  // Listen for signaling from other players when game is active
  useEffect(() => {
    if (!gameId || !user || !isCallActive) return;

    const signalingRef = ref(database, `voiceChat/${gameId}/signaling/${user.uid}`);

    const unsubscribe = onValue(signalingRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Process incoming signals (offers, answers, ice candidates)
      Object.entries(data).forEach(async ([senderId, signal]) => {
        if (senderId === user.uid) return; // Skip our own signals

        const signalData = signal as any;
        if (!signalData) return;

        // Handle offer
        if (signalData.type === 'offer') {
          await handleOffer(senderId, signalData);
        }

        // Handle answer
        if (signalData.type === 'answer') {
          await handleAnswer(senderId, signalData);
        }

        // Handle ICE candidate
        if (signalData.candidate) {
          await handleIceCandidate(senderId, signalData);
        }

        // Clear the processed signal
        const clearRef = ref(database, `voiceChat/${gameId}/signaling/${user.uid}/${senderId}`);
        await set(clearRef, null);
      });
    });

    return () => {
      off(signalingRef);
    };
  }, [gameId, user, isCallActive]);

  // Set up call when players change
  useEffect(() => {
    if (!gameState || !isCallActive || !user) return;

    // Get list of other online players
    const otherPlayers = Object.entries(gameState.players)
      .filter(([playerId, playerInfo]) => playerId !== user.uid && playerInfo.online)
      .map(([playerId]) => playerId);

    // Establish connections to players we're not already connected to
    otherPlayers.forEach(playerId => {
      if (!peerConnections[playerId]) {
        // To prevent "glare" (both peers trying to initiate),
        // only the peer with the lexicographically smaller UID initiates.
        // The other peer will wait for the offer.
        if (user.uid < playerId) {
          createPeerConnection(playerId);
        }
      }
    });

    // Update connected users list
    const currentlyConnected = Object.keys(peerConnections);
    setConnectedUsers(currentlyConnected);
    setIsConnected(currentlyConnected.length > 0);

  }, [gameState?.players, isCallActive, peerConnections, user]);

  // Toggle mute state
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // toggle to opposite of current state
      });
      setIsMuted(!isMuted);
    }
  };

  // Start a call
  const startCall = async () => {
    try {
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setIsCallActive(true);

      // Initialize voice chat presence
      if (gameId && user) {
        try {
          const presenceRef = ref(database, `voiceChat/${gameId}/participants/${user.uid}`);
          await set(presenceRef, true);
          await onDisconnect(presenceRef).set(false);
        } catch (error) {
          console.error('Error setting voice chat presence (check Firebase rules):', error);
        }
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  };

  // End a call
  const endCall = () => {
    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close all peer connections
    Object.entries(peerConnections).forEach(([peerId, { connection }]) => {
      connection.close();

      // Remove audio elements
      const audioElement = document.getElementById(`remote-audio-${peerId}`);
      if (audioElement) {
        document.body.removeChild(audioElement);
      }
    });

    // Clear peer connections
    setPeerConnections({});
    setIsCallActive(false);
    setIsConnected(false);
    setConnectedUsers([]);

    // Remove voice chat presence
    if (gameId && user) {
      const presenceRef = ref(database, `voiceChat/${gameId}/participants/${user.uid}`);
      set(presenceRef, null);
    }
  };

  return (
    <VoiceChatContext.Provider
      value={{
        isMuted,
        isConnected,
        isCallActive,
        toggleMute,
        startCall,
        endCall,
        connectedUsers
      }}
    >
      {children}
    </VoiceChatContext.Provider>
  );
}