import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useCallStore } from "@/stores/useCallStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "./ui/button";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
};

export function CallModal() {
    const { socket } = useSocket();
    const { user } = useAuthStore();
    const { callStatus, otherUserId, otherUserName, isVideo, setCallStatus, setCallData, resetCall } = useCallStore();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!isVideo);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);

    // Stop all media tracks and cleanup
    const stopMedia = () => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const endCall = () => {
        if (socket && otherUserId) {
            socket.emit("call_end", { targetUserId: otherUserId });
        }
        stopMedia();
        resetCall();
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        
        pc.onicecandidate = (event) => {
            if (event.candidate && socket && otherUserId) {
                socket.emit("webrtc_ice_candidate", {
                    targetUserId: otherUserId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));
        }

        peerConnection.current = pc;
        return pc;
    };

    const startLocalMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error("Error accessing media devices.", error);
            return null;
        }
    };

    // Socket listeners for signaling
    useEffect(() => {
        if (!socket || !user) return;

        const onIncomingCall = (data: any) => {
            if (callStatus !== 'idle') {
                // Busy
                socket.emit("call_reject", { targetUserId: data.callerId });
                return;
            }
            setCallData(data.callerId, data.callerName, data.isVideo);
            setCallStatus('incoming');
        };

        const onCallAccepted = async (data: any) => {
            if (callStatus === 'calling') {
                setCallStatus('connected');
                const pc = createPeerConnection();
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit("webrtc_offer", { targetUserId: otherUserId, offer });
                } catch (e) {
                    console.error(e);
                }
            }
        };

        const onCallRejected = () => {
            stopMedia();
            resetCall();
            alert("Call declined");
        };

        const onCallEnded = () => {
            stopMedia();
            resetCall();
        };

        const onOffer = async (data: any) => {
            const pc = createPeerConnection();
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("webrtc_answer", { targetUserId: data.callerId || otherUserId, answer });
            } catch (e) {
                console.error(e);
            }
        };

        const onAnswer = async (data: any) => {
            if (peerConnection.current) {
                try {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (e) {
                    console.error(e);
                }
            }
        };

        const onIceCandidate = async (data: any) => {
            if (peerConnection.current) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error(e);
                }
            }
        };

        socket.on("call_incoming", onIncomingCall);
        socket.on("call_accepted", onCallAccepted);
        socket.on("call_rejected", onCallRejected);
        socket.on("call_ended", onCallEnded);
        socket.on("webrtc_offer", onOffer);
        socket.on("webrtc_answer", onAnswer);
        socket.on("webrtc_ice_candidate", onIceCandidate);

        return () => {
            socket.off("call_incoming", onIncomingCall);
            socket.off("call_accepted", onCallAccepted);
            socket.off("call_rejected", onCallRejected);
            socket.off("call_ended", onCallEnded);
            socket.off("webrtc_offer", onOffer);
            socket.off("webrtc_answer", onAnswer);
            socket.off("webrtc_ice_candidate", onIceCandidate);
        };
    }, [socket, callStatus, otherUserId, user]);

    // Handle initial state changes
    useEffect(() => {
        if (callStatus === 'calling') {
            startLocalMedia();
        }
    }, [callStatus]);

    const acceptCall = async () => {
        await startLocalMedia();
        setCallStatus('connected');
        if (socket && otherUserId) {
            socket.emit("call_accept", { targetUserId: otherUserId, callerId: user?.id });
        }
    };

    const rejectCall = () => {
        if (socket && otherUserId) {
            socket.emit("call_reject", { targetUserId: otherUserId });
        }
        resetCall();
    };

    const toggleMute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!localStream.current.getAudioTracks()[0].enabled);
        }
    };

    const toggleVideo = () => {
        if (localStream.current) {
            localStream.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!localStream.current.getVideoTracks()[0].enabled);
        }
    };

    if (callStatus === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className={`fixed z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md ${isFullscreen ? 'inset-0' : 'bottom-4 right-4 w-[350px] h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--glass-border)]'}`}
            >
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900">
                    
                    {/* Remote Video */}
                    {(callStatus === 'connected') && (
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Local Video (PiP) */}
                    {(callStatus === 'connected' && isVideo) && (
                        <motion.div 
                            drag
                            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                            className="absolute top-4 right-4 w-24 h-36 bg-black rounded-xl overflow-hidden border-2 border-primary shadow-lg z-20 cursor-move"
                        >
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    )}

                    {/* Calling / Incoming Screen */}
                    {(callStatus === 'calling' || callStatus === 'incoming') && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-gray-900 to-black">
                            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse mb-6">
                                <div className="w-20 h-20 rounded-full bg-primary/40 flex items-center justify-center text-white text-3xl font-bold">
                                    {otherUserName?.charAt(0).toUpperCase() || "?"}
                                </div>
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-2">{otherUserName}</h2>
                            <p className="text-white/60 mb-8">{callStatus === 'calling' ? 'Calling...' : 'Incoming Call...'}</p>

                            {callStatus === 'incoming' && (
                                <div className="flex gap-6">
                                    <Button size="lg" variant="destructive" className="rounded-full w-14 h-14 p-0 shadow-lg" onClick={rejectCall}>
                                        <PhoneOff className="w-6 h-6" />
                                    </Button>
                                    <Button size="lg" className="rounded-full w-14 h-14 p-0 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20" onClick={acceptCall}>
                                        {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                                    </Button>
                                </div>
                            )}

                            {callStatus === 'calling' && (
                                <Button size="lg" variant="destructive" className="rounded-full w-14 h-14 p-0 shadow-lg mt-4" onClick={endCall}>
                                    <PhoneOff className="w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Controls Overlay (Connected) */}
                    {callStatus === 'connected' && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 z-20">
                            <Button variant="ghost" size="icon" className={`rounded-full hover:bg-white/20 ${isMuted ? 'text-red-400' : 'text-white'}`} onClick={toggleMute}>
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </Button>
                            {isVideo && (
                                <Button variant="ghost" size="icon" className={`rounded-full hover:bg-white/20 ${isVideoOff ? 'text-red-400' : 'text-white'}`} onClick={toggleVideo}>
                                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </Button>
                            )}
                            <Button variant="destructive" size="icon" className="rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-110 transition-transform w-12 h-12" onClick={endCall}>
                                <PhoneOff className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-white" onClick={() => setIsFullscreen(!isFullscreen)}>
                                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
