'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  // Use useRef for peer connections to avoid state update race conditions
  const peerConnections = useRef<Record<string, PeerConnection>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  // Queue for ICE candidates that arrive before remote description is set
  const iceCandidateQueue = useRef<Record<string, RTCIceCandidateInit[]>>({});

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
      console.error('Error sending signal:', error);
    }
  };

  // Create RTCPeerConnection for a peer
  const createPeerConnection = async (peerId: string, isInitiator: boolean) => {
    if (!gameId || !user || !localStream) return null;

    // Check if connection already exists
    if (peerConnections.current[peerId]) {
      return peerConnections.current[peerId].connection;
    }

    console.log(`Creating peer connection for ${peerId}, initiator: ${isInitiator}`);

    // Create new RTCPeerConnection
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local audio tracks
    const audioTracks = localStream.getAudioTracks();
    console.log(`Adding ${audioTracks.length} audio tracks for peer ${peerId}`);
    audioTracks.forEach(track => {
      console.log(`Track: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`);
      peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, { candidate: event.candidate.toJSON() });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'connected') {
        setConnectedUsers(prev => {
          if (!prev.includes(peerId)) return [...prev, peerId];
          return prev;
        });
      } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        setConnectedUsers(prev => prev.filter(id => id !== peerId));
        const audioElement = document.getElementById(`remote-audio-${peerId}`);
        if (audioElement) audioElement.remove();
      }
    };

    // Also listen to ICE connection state for better compatibility
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${peerId}: ${peerConnection.iceConnectionState}`);
      if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
        setConnectedUsers(prev => {
          if (!prev.includes(peerId)) return [...prev, peerId];
          return prev;
        });
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log(`🎵 Received track from ${peerId}:`, {
        kind: event.track.kind,
        label: event.track.label,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState,
        streams: event.streams?.length || 0
      });

      // Create audio element for remote audio if it doesn't exist
      let audioElement = document.getElementById(`remote-audio-${peerId}`) as HTMLAudioElement;
      if (!audioElement) {
        console.log(`Creating new audio element for ${peerId}`);
        audioElement = document.createElement('audio');
        audioElement.id = `remote-audio-${peerId}`;
        audioElement.autoplay = true;
        audioElement.volume = 1.0; // Set volume to maximum
        // @ts-ignore - playsInline is standard but might be missing in TS types for Audio
        audioElement.playsInline = true;
        document.body.appendChild(audioElement);
      }

      if (event.streams && event.streams[0]) {
        console.log(`Setting srcObject from event.streams[0] for ${peerId}`);
        audioElement.srcObject = event.streams[0];
      } else {
        // Fallback if no stream is provided with the track
        console.log(`Creating new MediaStream for track from ${peerId}`);
        const inboundStream = new MediaStream();
        inboundStream.addTrack(event.track);
        audioElement.srcObject = inboundStream;
      }

      // Attempt to play (browser might block if no interaction)
      audioElement.play()
        .then(() => console.log(`✅ Audio playing for ${peerId}`))
        .catch(e => console.error(`❌ Error playing audio for ${peerId}:`, e));
    };

    // Store the connection immediately in ref
    peerConnections.current[peerId] = {
      connection: peerConnection,
    };

    return peerConnection;
  };

  // Initialize connection as caller
  const initiateConnection = async (peerId: string) => {
    const pc = await createPeerConnection(peerId, true);
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(peerId, { type: 'offer', sdp: offer.sdp });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (senderId: string, offerSdp: string) => {
    if (!gameId || !user || !localStream) return;

    console.log(`Handling offer from ${senderId}`);
    const pc = await createPeerConnection(senderId, false);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));

      // Process any queued ICE candidates
      if (iceCandidateQueue.current[senderId]) {
        for (const candidate of iceCandidateQueue.current[senderId]) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        delete iceCandidateQueue.current[senderId];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(senderId, { type: 'answer', sdp: answer.sdp });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (senderId: string, answerSdp: string) => {
    const pc = peerConnections.current[senderId]?.connection;
    if (pc) {
      console.log(`Handling answer from ${senderId}`);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
        console.log(`✅ Remote description (answer) set for ${senderId}`);

        // Process any queued ICE candidates (CRITICAL FIX)
        if (iceCandidateQueue.current[senderId]) {
          console.log(`Processing ${iceCandidateQueue.current[senderId].length} queued ICE candidates for ${senderId}`);
          for (const candidate of iceCandidateQueue.current[senderId]) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          delete iceCandidateQueue.current[senderId];
        }
      } catch (error) {
        console.error('Error setting remote description (answer):', error);
      }
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = async (senderId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current[senderId]?.connection;
    if (pc) {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue candidate if remote description is not set yet
          if (!iceCandidateQueue.current[senderId]) {
            iceCandidateQueue.current[senderId] = [];
          }
          iceCandidateQueue.current[senderId].push(candidate);
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
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

      // Process incoming signals
      Object.entries(data).forEach(async ([senderId, signal]) => {
        if (senderId === user.uid) return;

        const signalData = signal as any;
        if (!signalData) return;

        // Handle offer
        if (signalData.type === 'offer') {
          console.log(`📩 Received offer from ${senderId}`);
          await handleOffer(senderId, signalData.sdp);
        }
        // Handle answer
        else if (signalData.type === 'answer') {
          console.log(`📩 Received answer from ${senderId}`);
          await handleAnswer(senderId, signalData.sdp);
        }
        // Handle ICE candidate
        else if (signalData.candidate) {
          console.log(`📩 Received ICE candidate from ${senderId}`);
          await handleIceCandidate(senderId, signalData.candidate);
        }

        // REMOVED: Don't delete signals immediately - this causes race conditions
        // Signals will be cleaned up when the call ends or connection is established
      });
    });

    return () => {
      off(signalingRef);
    };
  }, [gameId, user, isCallActive, localStream]);

  // Set up call when players change
  useEffect(() => {
    if (!gameState || !isCallActive || !user || !localStream) return;

    // Get list of other online players
    const otherPlayers = Object.entries(gameState.players)
      .filter(([playerId, playerInfo]) => playerId !== user.uid && playerInfo.online)
      .map(([playerId]) => playerId);

    // Establish connections to players we're not already connected to
    otherPlayers.forEach(playerId => {
      if (!peerConnections.current[playerId]) {
        // Glare handling: smaller UID initiates
        if (user.uid < playerId) {
          initiateConnection(playerId);
        }
      }
    });

    // Cleanup connections for players who left
    Object.keys(peerConnections.current).forEach(peerId => {
      if (!otherPlayers.includes(peerId)) {
        const pc = peerConnections.current[peerId].connection;
        pc.close();
        delete peerConnections.current[peerId];

        const audioElement = document.getElementById(`remote-audio-${peerId}`);
        if (audioElement) audioElement.remove();

        setConnectedUsers(prev => prev.filter(id => id !== peerId));
      }
    });

  }, [gameState?.players, isCallActive, user, localStream]);

  // Toggle mute state
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Note: enabled=true means unmuted
      });
      setIsMuted(!isMuted);
    }
  };

  // Start a call
  const startCall = async () => {
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      const audioTracks = stream.getAudioTracks();
      console.log(`✅ Got microphone access. Audio tracks: ${audioTracks.length}`);
      audioTracks.forEach((track, i) => {
        console.log(`  Track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`);
      });

      setLocalStream(stream);
      setIsCallActive(true);
      setIsConnected(true); // Optimistically set connected

      if (gameId && user) {
        try {
          const presenceRef = ref(database, `voiceChat/${gameId}/participants/${user.uid}`);
          await set(presenceRef, true);
          await onDisconnect(presenceRef).set(false);
          console.log('✅ Presence set in Firebase');
        } catch (error) {
          console.error('Error setting presence:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      throw error;
    }
  };

  // End a call
  const endCall = () => {
    console.log('📞 Ending call...');

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    Object.entries(peerConnections.current).forEach(([peerId, { connection }]) => {
      connection.close();
      const audioElement = document.getElementById(`remote-audio-${peerId}`);
      if (audioElement) audioElement.remove();
    });

    peerConnections.current = {};
    iceCandidateQueue.current = {};
    setIsCallActive(false);
    setIsConnected(false);
    setConnectedUsers([]);

    if (gameId && user) {
      // Clean up presence and signaling data
      const presenceRef = ref(database, `voiceChat/${gameId}/participants/${user.uid}`);
      const signalingRef = ref(database, `voiceChat/${gameId}/signaling/${user.uid}`);
      set(presenceRef, null);
      set(signalingRef, null); // Clean up signaling data on call end
      console.log('✅ Cleaned up Firebase data');
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