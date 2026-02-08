'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Coffee, SkipForward, LogOut, Search, Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';

// Use environment variable or default to localhost
const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'http://localhost:3002';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

type ChatStatus = 'initializing' | 'waiting' | 'connecting' | 'connected' | 'partner_left';

export default function ChatPage() {
    const router = useRouter();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [status, setStatus] = useState<ChatStatus>('initializing');
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [commonInterests, setCommonInterests] = useState<string[]>([]);
    const [userInterests, setUserInterests] = useState<string[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const partnerIdRef = useRef<string | null>(null);
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
    const isNegotiating = useRef(false);

    // Load fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
    }, []);

    // Mouse tracking for glow effect
    useEffect(() => {
        const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    // Load user interests from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('userInterests');
        if (stored) {
            try {
                setUserInterests(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse interests:', e);
            }
        }
    }, []);

    // Keep partnerId ref in sync
    useEffect(() => {
        partnerIdRef.current = partnerId;
    }, [partnerId]);

    // Toggle audio
    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Create peer connection
    const createPeerConnection = useCallback((targetPartnerId: string) => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        iceCandidateQueue.current = [];
        isNegotiating.current = false;

        console.log('Creating peer connection for partner:', targetPartnerId);
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pc.ontrack = (event) => {
            console.log('Received remote track');
            const remoteMediaStream = new MediaStream();
            event.streams[0].getTracks().forEach((track) => {
                remoteMediaStream.addTrack(track);
            });
            setRemoteStream(remoteMediaStream);
            setStatus('connected');
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate.toJSON(),
                    to: targetPartnerId,
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setStatus('connected');
            }
        };

        pc.onsignalingstatechange = () => {
            console.log('Signaling state:', pc.signalingState);
            isNegotiating.current = pc.signalingState !== 'stable';
        };

        return pc;
    }, []);

    const processIceCandidateQueue = useCallback(async () => {
        const pc = peerConnectionRef.current;
        if (!pc || pc.remoteDescription === null) return;

        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            if (candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error('Error adding queued ICE candidate:', error);
                }
            }
        }
    }, []);

    const resetConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        iceCandidateQueue.current = [];
        isNegotiating.current = false;
        setRemoteStream(null);
    }, []);

    // Initialize socket connection
    useEffect(() => {
        console.log('Initializing socket connection to:', SIGNALING_SERVER);
        const socket = io(SIGNALING_SERVER);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to signaling server:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from signaling server');
            setIsConnected(false);
        });

        socket.on('waiting', () => {
            console.log('Added to waiting queue');
            setStatus('waiting');
        });

        socket.on('matched', async (data: {
            partnerId: string;
            isInitiator: boolean;
            commonInterests?: string[];
        }) => {
            console.log('Matched with:', data.partnerId, 'isInitiator:', data.isInitiator, 'Common:', data.commonInterests);

            setPartnerId(data.partnerId);
            partnerIdRef.current = data.partnerId;
            setCommonInterests(data.commonInterests || []);
            setStatus('connecting');

            if (data.isInitiator) {
                const pc = createPeerConnection(data.partnerId);
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    console.log('Sending offer to:', data.partnerId);
                    socket.emit('offer', { offer, to: data.partnerId });
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }
        });

        socket.on('offer', async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
            console.log('Received offer from:', data.from);

            const pc = createPeerConnection(data.from);
            setPartnerId(data.from);
            partnerIdRef.current = data.from;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                await processIceCandidateQueue();

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log('Sending answer to:', data.from);
                socket.emit('answer', { answer, to: data.from });
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });

        socket.on('answer', async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
            console.log('Received answer from:', data.from);
            const pc = peerConnectionRef.current;

            if (!pc) {
                console.error('No peer connection for answer');
                return;
            }

            if (pc.signalingState !== 'have-local-offer') {
                console.warn('Cannot set answer in state:', pc.signalingState);
                return;
            }

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                await processIceCandidateQueue();
                setStatus('connected');
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        });

        socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit; from: string }) => {
            const pc = peerConnectionRef.current;

            if (!pc) {
                iceCandidateQueue.current.push(data.candidate);
                return;
            }

            if (!pc.remoteDescription) {
                iceCandidateQueue.current.push(data.candidate);
                return;
            }

            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });

        socket.on('partner_left', () => {
            console.log('Partner left');
            setStatus('partner_left');
            setPartnerId(null);
            partnerIdRef.current = null;
            setCommonInterests([]);
            resetConnection();
        });

        socket.on('skip_confirmed', () => {
            console.log('Skip confirmed');
            resetConnection();
        });

        return () => {
            socket.disconnect();
        };
    }, [createPeerConnection, resetConnection, processIceCandidateQueue]);

    // Initialize local stream
    useEffect(() => {
        const initStream = async () => {
            try {
                console.log('Requesting camera access...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                console.log('Camera access granted');
                localStreamRef.current = stream;
                setLocalStream(stream);
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        };
        initStream();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Set local video
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Set remote video
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Join queue when stream and socket are ready
    useEffect(() => {
        if (localStream && isConnected && status === 'initializing') {
            console.log('Joining queue with interests:', userInterests);
            socketRef.current?.emit('join_queue', { interests: userInterests });
        }
    }, [localStream, isConnected, status, userInterests]);

    const handleSkip = () => {
        socketRef.current?.emit('skip');
        resetConnection();
        setStatus('initializing');
        setPartnerId(null);
        partnerIdRef.current = null;
        setCommonInterests([]);
        setTimeout(() => {
            socketRef.current?.emit('join_queue', { interests: userInterests });
        }, 100);
    };

    const handleLeave = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        router.push('/');
    };

    const handleFindNew = () => {
        setStatus('initializing');
        setPartnerId(null);
        partnerIdRef.current = null;
        setCommonInterests([]);
        resetConnection();
        socketRef.current?.emit('join_queue', { interests: userInterests });
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'initializing':
                return 'Initializing camera...';
            case 'waiting':
                return 'Looking for a developer to chat with...';
            case 'connecting':
                return 'Connecting to partner...';
            case 'connected':
                return 'Connected!';
            case 'partner_left':
                return 'Partner disconnected';
            default:
                return '';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return 'bg-emerald-500';
            case 'partner_left':
                return 'bg-red-500';
            default:
                return 'bg-amber-500 animate-pulse';
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f6fc] text-[#475569] font-[Outfit] relative overflow-hidden selection:bg-purple-200 selection:text-purple-900">

            {/* Cursor glow */}
            <div
                className="fixed pointer-events-none z-[100] w-[500px] h-[500px] rounded-full opacity-[0.04] mix-blend-multiply transition-transform duration-300 ease-out"
                style={{
                    background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)',
                    left: mousePos.x - 250,
                    top: mousePos.y - 250,
                }}
            />

            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-red-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-amber-200/20 rounded-full blur-[80px] mix-blend-multiply animate-blob animation-delay-4000"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-4">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="glass-nav rounded-full px-4 py-2 flex justify-between items-center shadow-lg shadow-red-500/5 ring-1 ring-white/40 backdrop-blur-xl bg-white/40">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-400 to-blue-400 flex items-center justify-center text-white">
                                <Coffee size={16} className="text-white/90" />
                            </div>
                            <span className="font-semibold text-slate-700 tracking-tight">CodeBreak</span>
                        </div>

                        {/* Status indicator */}
                        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 border border-white/60">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                            <span className="text-sm font-medium text-slate-600">{getStatusMessage()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLeave}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white/50 transition-all"
                            >
                                <LogOut size={16} />
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="relative z-10 pt-24 pb-8 px-6 h-screen flex flex-col">
                {/* Common interests bar */}
                {commonInterests.length > 0 && (
                    <div className="max-w-6xl mx-auto w-full mb-4 animate-fade-in-up">
                        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-4 border border-white/40">
                            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Coffee size={14} className="text-amber-500" />
                                Topics to chat about:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {commonInterests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500/10 to-blue-500/10 text-slate-600 border border-red-200/50"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Video grid */}
                <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Remote video */}
                    <div className="relative glass rounded-[2rem] overflow-hidden border border-white/40 shadow-xl min-h-[300px] md:min-h-0">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {!remoteStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                <div className="w-24 h-24 rounded-full bg-white/60 flex items-center justify-center mb-4 shadow-lg">
                                    <Users size={40} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium">
                                    {status === 'waiting' ? 'Waiting for partner...' : 'Connecting...'}
                                </p>
                                {status === 'waiting' && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Partner
                        </div>
                    </div>

                    {/* Local video */}
                    <div className="relative glass rounded-[2rem] overflow-hidden border border-white/40 shadow-xl min-h-[300px] md:min-h-0">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : ''}`}
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-400 to-blue-400 flex items-center justify-center text-white text-2xl font-bold">
                                    YOU
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-sm font-medium">
                            You
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="max-w-6xl mx-auto w-full mt-6">
                    <div className="glass rounded-2xl px-6 py-4 flex items-center justify-center gap-4 border border-white/40">
                        {/* Audio toggle */}
                        <button
                            onClick={toggleAudio}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white/80 text-slate-600 hover:bg-white shadow-md'
                                }`}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>

                        {/* Video toggle */}
                        <button
                            onClick={toggleVideo}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white/80 text-slate-600 hover:bg-white shadow-md'
                                }`}
                        >
                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>

                        <div className="w-px h-8 bg-slate-200 mx-2"></div>

                        {/* Skip / Find New */}
                        {status === 'partner_left' ? (
                            <button
                                onClick={handleFindNew}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-semibold shadow-xl shadow-slate-900/20 hover:scale-105 hover:shadow-2xl transition-all"
                            >
                                <Search size={18} />
                                Find New Partner
                            </button>
                        ) : (
                            <button
                                onClick={handleSkip}
                                disabled={status === 'waiting' || status === 'initializing'}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${status === 'waiting' || status === 'initializing'
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        : 'bg-white text-slate-700 shadow-md hover:shadow-lg hover:scale-[1.02] border border-slate-200'
                                    }`}
                            >
                                <SkipForward size={18} />
                                Skip
                            </button>
                        )}

                        {/* Leave button */}
                        <button
                            onClick={handleLeave}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                            <LogOut size={18} />
                            Leave
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
