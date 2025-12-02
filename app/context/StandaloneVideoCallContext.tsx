'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { database } from '../firebase/config';
import { ref, set, onValue, off, remove, push } from 'firebase/database';

interface PeerConnection {
    connection: RTCPeerConnection;
    audioTrack?: MediaStreamTrack;
    videoTrack?: MediaStreamTrack;
}

interface Participant {
    userId: string;
    displayName: string;
    isMuted: boolean;
    isVideoEnabled: boolean;
}

interface StandaloneVideoCallContextType {
    // Room state
    roomId: string | null;
    isInCall: boolean;
    participants: Participant[];

    // Local state
    localStream: MediaStream | null;
    isMuted: boolean;
    isVideoEnabled: boolean;
    displayName: string;

    // Actions
    setDisplayName: (name: string) => void;
    createRoom: () => Promise<string>;
    joinRoom: (roomId: string) => Promise<void>;
    leaveRoom: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
}

const StandaloneVideoCallContext = createContext<StandaloneVideoCallContextType | undefined>(undefined);

export function useStandaloneVideoCall() {
    const context = useContext(StandaloneVideoCallContext);
    if (context === undefined) {
        throw new Error('useStandaloneVideoCall must be used within a StandaloneVideoCallProvider');
    }
    return context;
}

export function StandaloneVideoCallProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isInCall, setIsInCall] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);

    // Use useRef for peer connections to avoid state update race conditions
    const peerConnections = useRef<Record<string, PeerConnection>>({});
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
        if (!roomId || !user) return;

        const signalingRef = ref(database, `videoCalls/${roomId}/signaling/${peerId}/${user.uid}`);
        try {
            await set(signalingRef, signal);
        } catch (error) {
            console.error('Error sending signal:', error);
        }
    };

    // Update participant state in Firebase
    const updateParticipantState = async () => {
        if (!roomId || !user) return;

        const participantRef = ref(database, `videoCalls/${roomId}/participants/${user.uid}`);
        try {
            await set(participantRef, {
                displayName: displayName || user.email?.split('@')[0] || 'Anonymous',
                isMuted,
                isVideoEnabled,
                online: true,
            });
        } catch (error) {
            console.error('Error updating participant state:', error);
        }
    };

    // Create RTCPeerConnection for a peer
    const createPeerConnection = async (peerId: string, isInitiator: boolean) => {
        if (!roomId || !user || !localStream) return null;

        // Check if connection already exists
        if (peerConnections.current[peerId]) {
            return peerConnections.current[peerId].connection;
        }

        console.log(`Creating peer connection for ${peerId}, initiator: ${isInitiator}`);

        // Create new RTCPeerConnection
        const peerConnection = new RTCPeerConnection(iceServers);

        // Add local audio and video tracks
        const audioTracks = localStream.getAudioTracks();
        const videoTracks = localStream.getVideoTracks();
        console.log(`Adding ${audioTracks.length} audio tracks and ${videoTracks.length} video tracks for peer ${peerId}`);

        audioTracks.forEach(track => {
            console.log(`Audio Track: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`);
            peerConnection.addTrack(track, localStream);
        });

        videoTracks.forEach(track => {
            console.log(`Video Track: ${track.label}, enabled: ${track.enabled}`);
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

            // Create video element for remote stream if it doesn't exist
            let videoElement = document.getElementById(`standalone-video-${peerId}`) as HTMLVideoElement;
            if (!videoElement) {
                console.log(`Creating new video element for ${peerId}`);
                videoElement = document.createElement('video');
                videoElement.id = `standalone-video-${peerId}`;
                videoElement.autoplay = true;
                videoElement.playsInline = true;
                videoElement.muted = false;
                videoElement.style.display = 'none';
                document.body.appendChild(videoElement);
            }

            if (event.streams && event.streams[0]) {
                console.log(`Setting srcObject from event.streams[0] for ${peerId}`);
                videoElement.srcObject = event.streams[0];
            } else {
                console.log(`Creating new MediaStream for track from ${peerId}`);
                const existingStream = videoElement.srcObject as MediaStream;
                if (existingStream) {
                    existingStream.addTrack(event.track);
                } else {
                    const inboundStream = new MediaStream();
                    inboundStream.addTrack(event.track);
                    videoElement.srcObject = inboundStream;
                }
            }

            videoElement.play()
                .then(() => console.log(`✅ Video playing for ${peerId}`))
                .catch(e => console.error(`❌ Error playing video for ${peerId}:`, e));
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
        if (!roomId || !user || !localStream) return;

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

                // Process any queued ICE candidates
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

    // Listen for signaling from other participants
    useEffect(() => {
        if (!roomId || !user || !isInCall) return;

        const signalingRef = ref(database, `videoCalls/${roomId}/signaling/${user.uid}`);

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
            });
        });

        return () => {
            off(signalingRef);
        };
    }, [roomId, user, isInCall, localStream]);

    // Listen for participant changes
    useEffect(() => {
        if (!roomId || !isInCall || !user) return;

        const participantsRef = ref(database, `videoCalls/${roomId}/participants`);

        const unsubscribe = onValue(participantsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setParticipants([]);
                return;
            }

            const participantList: Participant[] = Object.entries(data)
                .filter(([userId]) => userId !== user.uid)
                .map(([userId, info]: [string, any]) => ({
                    userId,
                    displayName: info.displayName || 'Anonymous',
                    isMuted: info.isMuted || false,
                    isVideoEnabled: info.isVideoEnabled !== false,
                }));

            setParticipants(participantList);

            // Establish connections to new participants
            participantList.forEach(participant => {
                if (!peerConnections.current[participant.userId]) {
                    // Glare handling: smaller UID initiates
                    if (user.uid < participant.userId) {
                        initiateConnection(participant.userId);
                    }
                }
            });

            // Cleanup connections for participants who left
            Object.keys(peerConnections.current).forEach(peerId => {
                if (!participantList.find(p => p.userId === peerId)) {
                    const pc = peerConnections.current[peerId].connection;
                    pc.close();
                    delete peerConnections.current[peerId];

                    const videoElement = document.getElementById(`standalone-video-${peerId}`);
                    if (videoElement) videoElement.remove();
                }
            });
        });

        return () => {
            off(participantsRef);
        };
    }, [roomId, isInCall, user, localStream]);

    // Update participant state when mute/video changes
    useEffect(() => {
        if (isInCall) {
            updateParticipantState();
        }
    }, [isMuted, isVideoEnabled, isInCall, displayName]);

    // Toggle mute state
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    // Toggle video state
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoEnabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    // Create a new room
    const createRoom = async (): Promise<string> => {
        if (!user) throw new Error('User must be authenticated');

        try {
            console.log('🎤📹 Requesting microphone and camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();
            console.log(`✅ Got media access. Audio tracks: ${audioTracks.length}, Video tracks: ${videoTracks.length}`);

            setLocalStream(stream);

            // Generate a unique room ID
            const roomsRef = ref(database, 'videoCalls');
            const newRoomRef = push(roomsRef);
            const newRoomId = newRoomRef.key!;

            setRoomId(newRoomId);
            setIsInCall(true);

            // Set participant info
            await updateParticipantState();

            console.log(`✅ Room created: ${newRoomId}`);
            return newRoomId;
        } catch (error) {
            console.error('❌ Error creating room:', error);
            throw error;
        }
    };

    // Join an existing room
    const joinRoom = async (targetRoomId: string): Promise<void> => {
        if (!user) throw new Error('User must be authenticated');

        try {
            console.log('🎤📹 Requesting microphone and camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();
            console.log(`✅ Got media access. Audio tracks: ${audioTracks.length}, Video tracks: ${videoTracks.length}`);

            setLocalStream(stream);
            setRoomId(targetRoomId);
            setIsInCall(true);

            // Set participant info
            await updateParticipantState();

            console.log(`✅ Joined room: ${targetRoomId}`);
        } catch (error) {
            console.error('❌ Error joining room:', error);
            throw error;
        }
    };

    // Leave the current room
    const leaveRoom = () => {
        console.log('📞 Leaving room...');

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        Object.entries(peerConnections.current).forEach(([peerId, { connection }]) => {
            connection.close();
            const videoElement = document.getElementById(`standalone-video-${peerId}`);
            if (videoElement) videoElement.remove();
        });

        peerConnections.current = {};
        iceCandidateQueue.current = {};

        if (roomId && user) {
            // Remove participant from room
            const participantRef = ref(database, `videoCalls/${roomId}/participants/${user.uid}`);
            const signalingRef = ref(database, `videoCalls/${roomId}/signaling/${user.uid}`);
            remove(participantRef);
            remove(signalingRef);
            console.log('✅ Cleaned up Firebase data');
        }

        setIsInCall(false);
        setRoomId(null);
        setParticipants([]);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, []);

    return (
        <StandaloneVideoCallContext.Provider
            value={{
                roomId,
                isInCall,
                participants,
                localStream,
                isMuted,
                isVideoEnabled,
                displayName,
                setDisplayName,
                createRoom,
                joinRoom,
                leaveRoom,
                toggleMute,
                toggleVideo,
            }}
        >
            {children}
        </StandaloneVideoCallContext.Provider>
    );
}
