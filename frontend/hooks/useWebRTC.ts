'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface UseWebRTCReturn {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isLocalStreamReady: boolean;
    initializeLocalStream: () => Promise<void>;
    createOffer: () => Promise<RTCSessionDescriptionInit | null>;
    handleOffer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
    handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
    handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
    setOnIceCandidate: (callback: (candidate: RTCIceCandidateInit) => void) => void;
    cleanup: () => void;
    resetConnection: () => void;
}

export function useWebRTC(): UseWebRTCReturn {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const onIceCandidateRef = useRef<((candidate: RTCIceCandidateInit) => void) | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);

    const createPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('Received remote track');
            const remoteMediaStream = new MediaStream();
            event.streams[0].getTracks().forEach((track) => {
                remoteMediaStream.addTrack(track);
            });
            setRemoteStream(remoteMediaStream);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && onIceCandidateRef.current) {
                onIceCandidateRef.current(event.candidate.toJSON());
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState);
        };

        return pc;
    }, []);

    const initializeLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsLocalStreamReady(true);
            console.log('Local stream initialized');
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }, []);

    const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
        const pc = createPeerConnection();
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('Created offer');
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            return null;
        }
    }, [createPeerConnection]);

    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
        const pc = createPeerConnection();
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('Created answer');
            return answer;
        } catch (error) {
            console.error('Error handling offer:', error);
            return null;
        }
    }, [createPeerConnection]);

    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit): Promise<void> => {
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('No peer connection');
            return;
        }
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Set remote description (answer)');
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }, []);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('No peer connection for ICE candidate');
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }, []);

    const setOnIceCandidate = useCallback((callback: (candidate: RTCIceCandidateInit) => void) => {
        onIceCandidateRef.current = callback;
    }, []);

    const resetConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setRemoteStream(null);
    }, []);

    const cleanup = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsLocalStreamReady(false);
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        localStream,
        remoteStream,
        isLocalStreamReady,
        initializeLocalStream,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        setOnIceCandidate,
        cleanup,
        resetConnection,
    };
}
