'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SIGNALING_SERVER = 'http://localhost:3002';

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    joinQueue: () => void;
    sendOffer: (offer: RTCSessionDescriptionInit, to: string) => void;
    sendAnswer: (answer: RTCSessionDescriptionInit, to: string) => void;
    sendIceCandidate: (candidate: RTCIceCandidateInit, to: string) => void;
    skip: () => void;
}

export function useSocket(
    onMatched: (partnerId: string, isInitiator: boolean) => void,
    onOffer: (offer: RTCSessionDescriptionInit, from: string) => void,
    onAnswer: (answer: RTCSessionDescriptionInit, from: string) => void,
    onIceCandidate: (candidate: RTCIceCandidateInit, from: string) => void,
    onPartnerLeft: () => void,
    onWaiting: () => void,
    onSkipConfirmed: () => void
): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = io(SIGNALING_SERVER);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to signaling server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from signaling server');
            setIsConnected(false);
        });

        socket.on('matched', (data: { partnerId: string; isInitiator: boolean }) => {
            console.log('Matched with:', data.partnerId, 'isInitiator:', data.isInitiator);
            onMatched(data.partnerId, data.isInitiator);
        });

        socket.on('waiting', () => {
            console.log('Added to waiting queue');
            onWaiting();
        });

        socket.on('offer', (data: { offer: RTCSessionDescriptionInit; from: string }) => {
            console.log('Received offer from:', data.from);
            onOffer(data.offer, data.from);
        });

        socket.on('answer', (data: { answer: RTCSessionDescriptionInit; from: string }) => {
            console.log('Received answer from:', data.from);
            onAnswer(data.answer, data.from);
        });

        socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit; from: string }) => {
            onIceCandidate(data.candidate, data.from);
        });

        socket.on('partner_left', () => {
            console.log('Partner left');
            onPartnerLeft();
        });

        socket.on('skip_confirmed', () => {
            console.log('Skip confirmed');
            onSkipConfirmed();
        });

        return () => {
            socket.disconnect();
        };
    }, [onMatched, onOffer, onAnswer, onIceCandidate, onPartnerLeft, onWaiting, onSkipConfirmed]);

    const joinQueue = useCallback(() => {
        socketRef.current?.emit('join_queue');
    }, []);

    const sendOffer = useCallback((offer: RTCSessionDescriptionInit, to: string) => {
        socketRef.current?.emit('offer', { offer, to });
    }, []);

    const sendAnswer = useCallback((answer: RTCSessionDescriptionInit, to: string) => {
        socketRef.current?.emit('answer', { answer, to });
    }, []);

    const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit, to: string) => {
        socketRef.current?.emit('ice-candidate', { candidate, to });
    }, []);

    const skip = useCallback(() => {
        socketRef.current?.emit('skip');
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        joinQueue,
        sendOffer,
        sendAnswer,
        sendIceCandidate,
        skip,
    };
}
