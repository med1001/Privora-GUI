import { useState, useRef, useCallback, useEffect } from 'react';

export interface CallState {
  status: "idle" | "calling" | "calling_offline" | "ringing" | "connected";
  peerId: string | null;
  peerName: string | null;
  isIncoming: boolean;
}

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
};

export const useWebRTC = (
  localUserId: string,
  sendRawMessage: (data: any) => void,
  onCallEnded: (peerId: string, durationStr: string, missed: boolean, caller: boolean) => void
) => {
  const [callState, setCallState] = useState<CallState>({ status: "idle", peerId: null, peerName: null, isIncoming: false });
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const iceCandidateQueueRef = useRef<any[]>([]);

  const cleanupCall = useCallback((recordEnd: boolean = true) => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      setIsMuted(false);
      iceCandidateQueueRef.current = [];

      const endTime = Date.now();
      const startTime = callStartTimeRef.current;
      callStartTimeRef.current = null;

      setCallState(prev => {
        if (recordEnd && prev.peerId) {
          let durationStr = "00:00";
          let missed = false;

          console.log("[WebRTC] Call ending. startTime:", startTime, "status:", prev.status);

          if (startTime && prev.status === "connected") {
            const diffChars = Math.floor((endTime - startTime) / 1000);
            const m = Math.floor(diffChars / 60).toString().padStart(2, '0');
            const s = (diffChars % 60).toString().padStart(2, '0');
            durationStr = `${m}:${s}`;
          } else if (prev.status !== "connected") {
            missed = true;
          }
          console.log("[WebRTC] Final calculated duration:", durationStr);
          onCallEnded(prev.peerId, durationStr, missed, !prev.isIncoming);
        }
        return { status: "idle", peerId: null, peerName: null, isIncoming: false };
      });
    }, [onCallEnded]);

    const createPeerConnection = useCallback((peerId: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendRawMessage({ type: 'ice_candidate', to: peerId, candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall(true);
      }
    };
    pcRef.current = pc;
    return pc;
  }, [cleanupCall, sendRawMessage]);

  const initiateCall = useCallback(async (peerId: string, peerName: string) => {
    setCallState({ status: "calling", peerId, peerName, isIncoming: false });
    try {
      if (pcRef.current) {
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      localStreamRef.current = stream;
      const pc = createPeerConnection(peerId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const selfDisplayNameStr = localStorage.getItem("displayName") || "User";

      sendRawMessage({
        type: 'call_offer',
        to: peerId,
        offer,
        fromDisplayName: selfDisplayNameStr
      });
    } catch (err) {
      console.error('Call initialization failed', err);
      cleanupCall(false);
      alert("Could not access microphone.");
    }
  }, [createPeerConnection, sendRawMessage, cleanupCall]);

  const acceptCall = useCallback(async () => {
    if (callState.status !== 'ringing' || !callState.peerId) return;
    const peerId = callState.peerId;

    setCallState(s => ({ ...s, status: "connected" }));
    callStartTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      localStreamRef.current = stream;
      const pc = pcRef.current;
      if (!pc) return;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendRawMessage({ type: 'call_answer', to: peerId, answer });
    } catch (err) {
      console.error('Failed to accept call', err);
      cleanupCall(false);
      alert("Could not access microphone.");
    }
  }, [callState, sendRawMessage, cleanupCall]);

  const rejectCall = useCallback(() => {
    if (callState.peerId) {
      sendRawMessage({ type: 'call_reject', to: callState.peerId, reason: 'declined' });
    }
    cleanupCall(true);
  }, [callState.peerId, sendRawMessage, cleanupCall]);

  const endCall = useCallback(() => {
    if (callState.peerId) {
      sendRawMessage({ type: 'call_end', to: callState.peerId });
    }
    cleanupCall(true);
  }, [callState.peerId, sendRawMessage, cleanupCall]);

  const handleWebRTCSignal = useCallback(async (parsed: any) => {
    const type = parsed.type;
    const from = parsed.from;

    if (type === 'call_offer') {
      setCallState(prev => {
        if (prev.status !== 'idle') {
           sendRawMessage({ type: 'call_reject', to: from, reason: 'busy' });
           return prev;
        }
        return {
          status: "ringing",
          peerId: from,
          peerName: parsed.fromDisplayName || from,
          isIncoming: true
        };
      });
      setTimeout(async () => {
          if (pcRef.current) {
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
          }
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(parsed.offer));
          
          iceCandidateQueueRef.current.forEach(candidate => {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log('ICE err', e));
          });
          iceCandidateQueueRef.current = [];

          sendRawMessage({ type: 'call_ring', to: from });
      }, 0);
    }
    else if (type === 'call_ring') {
      setCallState(s => (s.status === 'calling' || s.status === 'calling_offline' ? { ...s, status: 'calling' } : s));
    }
    else if (type === 'call_ring_offline') {
      setCallState(s => (s.status === 'calling' ? { ...s, status: 'calling_offline' } : s));
    }
    else if (type === 'call_answer') {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(parsed.answer));
        setCallState(s => ({ ...s, status: "connected" }));
        callStartTimeRef.current = Date.now();
        
        iceCandidateQueueRef.current.forEach(candidate => {
            pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log('ICE err', e));
        });
        iceCandidateQueueRef.current = [];
      }
    }
    else if (type === 'ice_candidate') {
      if (pcRef.current && pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(parsed.candidate)).catch(e => console.log('ICE err', e));
      } else {
        iceCandidateQueueRef.current.push(parsed.candidate);
      }
    }
    else if (type === 'call_reject') {
      if (parsed.reason === 'offline') {
        setCallState(s => (s.status === 'calling' ? { ...s, status: 'calling_offline' } : s));
        if (pcRef.current) {
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.close();
          pcRef.current = null;
        }
      } else {
        cleanupCall(true);
      }
    }
    else if (type === 'call_end') {
      cleanupCall(true);
    }
  }, [createPeerConnection, sendRawMessage, cleanupCall]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState.status !== 'idle' && callState.peerId) {
        sendRawMessage({ type: 'call_end', to: callState.peerId });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [callState.status, callState.peerId, sendRawMessage]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  }, []);

  return {
    callState,
    remoteStream,
    isMuted,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    handleWebRTCSignal
  };
};
