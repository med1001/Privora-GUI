import { useState, useRef, useCallback, useEffect } from 'react';
import { getApiBaseUrl } from '../lib/apiBase';

interface RTCConfigPayload {
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
}

export interface CallState {
  status: "idle" | "calling" | "calling_offline" | "ringing" | "connecting" | "connected" | "reconnecting";
  peerId: string | null;
  peerName: string | null;
  isIncoming: boolean;
  callId: string | null;
}

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
];

const TRACE_PREFIX = '[WebRTC TRACE]';

export const useWebRTC = (
  localUserId: string,
  authToken: string | null,
  sendRawMessage: (data: any) => void,
  onCallEnded: (peerId: string, durationStr: string, missed: boolean, caller: boolean) => void
) => {
  const [callState, setCallState] = useState<CallState>({ status: "idle", peerId: null, peerName: null, isIncoming: false, callId: null });
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const callStateRef = useRef<CallState>({ status: "idle", peerId: null, peerName: null, isIncoming: false, callId: null });
  const rtcConfigRef = useRef<RTCConfigPayload>({ iceServers: DEFAULT_ICE_SERVERS, iceTransportPolicy: 'all' });
  const iceCandidateQueueRef = useRef<Array<{ callId: string; candidate: RTCIceCandidateInit }>>([]);
  const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionLossTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Ensures we send `call_connected` at most once per peer connection (ICE + connection state both report success). */
  const hasEmittedCallConnectedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadRTCConfig = async () => {
      if (!authToken) {
        rtcConfigRef.current = { iceServers: DEFAULT_ICE_SERVERS, iceTransportPolicy: 'all' };
        return;
      }

      const apiBaseUrl = getApiBaseUrl();

      try {
        const response = await fetch(`${apiBaseUrl}/api/rtc-config`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`RTC config request failed with ${response.status}`);
        }

        const data: RTCConfigPayload = await response.json();
        if (!isMounted) {
          return;
        }

        rtcConfigRef.current = {
          iceServers: data.iceServers && data.iceServers.length > 0 ? data.iceServers : DEFAULT_ICE_SERVERS,
          iceTransportPolicy: data.iceTransportPolicy || 'all',
        };
      } catch (error) {
        console.error('[WebRTC] Failed to load RTC config, falling back to default STUN only.', error);
        if (isMounted) {
          rtcConfigRef.current = { iceServers: DEFAULT_ICE_SERVERS, iceTransportPolicy: 'all' };
        }
      }
    };

    loadRTCConfig();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const clearCallTimers = useCallback(() => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (callingTimeoutRef.current) {
      clearTimeout(callingTimeoutRef.current);
      callingTimeoutRef.current = null;
    }
    if (connectionLossTimeoutRef.current) {
      clearTimeout(connectionLossTimeoutRef.current);
      connectionLossTimeoutRef.current = null;
    }
  }, []);

  const resetPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  const flushQueuedIceCandidates = useCallback(async (callId: string, pc: RTCPeerConnection) => {
    const queuedCandidates = iceCandidateQueueRef.current.filter((item) => item.callId === callId);
    iceCandidateQueueRef.current = iceCandidateQueueRef.current.filter((item) => item.callId !== callId);

    for (const item of queuedCandidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(item.candidate));
      } catch (error) {
        console.log('[WebRTC] ICE flush error', error);
      }
    }
  }, []);

  const trace = useCallback((message: string, extra?: unknown) => {
    if (extra !== undefined) {
      console.log(`${TRACE_PREFIX} ${message}`, extra);
      return;
    }
    console.log(`${TRACE_PREFIX} ${message}`);
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  }, []);

  const cleanupCall = useCallback((recordEnd: boolean = true) => {
    clearCallTimers();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    resetPeerConnection();
    setRemoteStream(null);
    setIsMuted(false);

    const previousState = callStateRef.current;
    const activeCallId = currentCallIdRef.current;
    currentCallIdRef.current = null;
    hasEmittedCallConnectedRef.current = false;
    iceCandidateQueueRef.current = iceCandidateQueueRef.current.filter((item) => item.callId !== activeCallId);

    const endTime = Date.now();
    const startTime = callStartTimeRef.current;
    callStartTimeRef.current = null;

    if (recordEnd && previousState.peerId) {
      let durationStr = '00:00';
      let missed = false;

      if (startTime) {
        const diffSeconds = Math.floor((endTime - startTime) / 1000);
        const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
        const s = (diffSeconds % 60).toString().padStart(2, '0');
        durationStr = `${m}:${s}`;
      } else {
        missed = previousState.status !== 'connected' && previousState.status !== 'reconnecting';
      }

      onCallEnded(previousState.peerId, durationStr, missed, !previousState.isIncoming);
    }

    const idleState = { status: 'idle', peerId: null, peerName: null, isIncoming: false, callId: null } as CallState;
    callStateRef.current = idleState;
    setCallState(idleState);
  }, [clearCallTimers, onCallEnded, resetPeerConnection]);

  const createPeerConnection = useCallback((peerId: string, callId: string) => {
    hasEmittedCallConnectedRef.current = false;

    const pc = new RTCPeerConnection({
      iceServers: rtcConfigRef.current.iceServers || DEFAULT_ICE_SERVERS,
      iceTransportPolicy: rtcConfigRef.current.iceTransportPolicy || 'all'
    });

    const emitCallConnectedOnce = () => {
      if (currentCallIdRef.current !== callId || hasEmittedCallConnectedRef.current) {
        return;
      }
      hasEmittedCallConnectedRef.current = true;

      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      if (connectionLossTimeoutRef.current) {
        clearTimeout(connectionLossTimeoutRef.current);
        connectionLossTimeoutRef.current = null;
      }
      setCallState((prev) => (prev.callId === callId ? { ...prev, status: 'connected' } : prev));
      sendRawMessage({ type: 'call_connected', to: peerId, callId });
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || currentCallIdRef.current !== callId) {
        return;
      }

      trace(`Sending ICE candidate for callId=${callId}`);
      sendRawMessage({ type: 'ice_candidate', to: peerId, callId, candidate: event.candidate });
    };

    pc.ontrack = (event) => {
      if (currentCallIdRef.current !== callId) {
        return;
      }

      trace(`Remote audio track received for callId=${callId}`);
      setRemoteStream(event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      if (currentCallIdRef.current !== callId) {
        return;
      }

      trace(`ICE state changed for callId=${callId}: ${pc.iceConnectionState}`);

      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        emitCallConnectedOnce();
      }

      if (pc.iceConnectionState === 'failed') {
        sendRawMessage({ type: 'call_end', to: peerId, callId, reason: 'ice_failed' });
        cleanupCall(true);
      }
    };

    pc.onsignalingstatechange = () => {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      trace(`Signaling state changed for callId=${callId}: ${pc.signalingState}`);
    };

    pc.onconnectionstatechange = () => {
      if (currentCallIdRef.current !== callId) {
        return;
      }

      const state = pc.connectionState;
      trace(`Connection state changed for callId=${callId}: ${state}`);
      if (state === 'connected') {
        emitCallConnectedOnce();
        return;
      }

      if (state === 'disconnected') {
        setCallState((prev) => prev.callId === callId && prev.status !== 'idle' ? { ...prev, status: 'reconnecting' } : prev);

        if (!connectionLossTimeoutRef.current) {
          connectionLossTimeoutRef.current = setTimeout(() => {
            if (currentCallIdRef.current !== callId) {
              return;
            }
            sendRawMessage({ type: 'call_end', to: peerId, callId, reason: 'connection_lost' });
            cleanupCall(true);
          }, 10000);
        }
        return;
      }

      if (state === 'failed' || state === 'closed') {
        sendRawMessage({ type: 'call_end', to: peerId, callId, reason: state === 'failed' ? 'connection_failed' : 'connection_closed' });
        cleanupCall(true);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanupCall, sendRawMessage]);

  const initiateCall = useCallback(async (peerId: string, peerName: string) => {
    if (callStateRef.current.status !== 'idle') {
      return;
    }

    const callId = crypto.randomUUID();
    currentCallIdRef.current = callId;
    trace(`Initiating callId=${callId} to ${peerId}`);
    setCallState({ status: 'calling', peerId, peerName, isIncoming: false, callId });

    try {
      clearCallTimers();
      resetPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      localStreamRef.current = stream;
      const pc = createPeerConnection(peerId, callId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const selfDisplayNameStr = localStorage.getItem('displayName') || localUserId || 'User';

      callingTimeoutRef.current = setTimeout(() => {
        if (currentCallIdRef.current !== callId) {
          return;
        }
        console.log("[WebRTC] Outgoing call timeout. Cancelling call to:", peerId);
        sendRawMessage({ type: 'call_end', to: peerId, callId, reason: 'timeout' });
        cleanupCall(false);
      }, 45000);

      sendRawMessage({
        type: 'call_offer',
        to: peerId,
        callId,
        offer,
        fromDisplayName: selfDisplayNameStr
      });
    } catch (err) {
      console.error('Call initialization failed', err);
      cleanupCall(false);
      alert("Could not access microphone.");
    }
  }, [clearCallTimers, createPeerConnection, sendRawMessage, cleanupCall, resetPeerConnection, localUserId]);

  const acceptCall = useCallback(async () => {
    if (callState.status !== 'ringing' || !callState.peerId || !callState.callId) return;
    const peerId = callState.peerId;
    const callId = callState.callId;
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    setCallState((prev) => prev.callId === callId ? { ...prev, status: 'connecting' } : prev);

    try {
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      localStreamRef.current = stream;
      const pc = pcRef.current;
      if (!pc) {
        throw new Error('Peer connection not ready for incoming call');
      }
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await flushQueuedIceCandidates(callId, pc);

      trace(`Sending call_accepting for callId=${callId}`);
      sendRawMessage({ type: 'call_accepting', to: peerId, callId });
      trace(`Sending call_answer for callId=${callId}`);
      sendRawMessage({ type: 'call_answer', to: peerId, callId, answer });
    } catch (err) {
      console.error('Failed to accept call', err);
      cleanupCall(false);
      alert("Could not access microphone.");
    }
  }, [callState, flushQueuedIceCandidates, sendRawMessage, cleanupCall]);

  const rejectCall = useCallback(() => {
    if (callState.peerId && callState.callId) {
      sendRawMessage({ type: 'call_reject', to: callState.peerId, callId: callState.callId, reason: 'declined' });
    }
    cleanupCall(true);
  }, [callState.peerId, callState.callId, sendRawMessage, cleanupCall]);

  const endCall = useCallback(() => {
    if (callState.peerId && callState.callId) {
      sendRawMessage({ type: 'call_end', to: callState.peerId, callId: callState.callId });
    }
    cleanupCall(true);
  }, [callState.peerId, callState.callId, sendRawMessage, cleanupCall]);

  const handleWebRTCSignal = useCallback(async (parsed: any) => {
    const type = parsed.type;
    const from = parsed.from;
    const callId = parsed.callId;

    trace(`Received signal ${type} for callId=${callId ?? 'missing'} from ${from ?? 'unknown'}`, parsed);

    if (!callId) {
      console.warn('[WebRTC] Ignoring signaling payload without callId:', parsed);
      return;
    }

    if (type === 'call_offer') {
      if (callStateRef.current.status !== 'idle') {
        sendRawMessage({ type: 'call_reject', to: from, callId, reason: 'busy' });
        return;
      }

      currentCallIdRef.current = callId;
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
      }
      ringingTimeoutRef.current = setTimeout(() => {
        if (currentCallIdRef.current !== callId) {
          return;
        }
        console.log('[WebRTC] Incoming call timeout. Automatically rejecting from:', from);
        sendRawMessage({ type: 'call_reject', to: from, callId, reason: 'timeout' });
        cleanupCall(false);
      }, 45000);

      setCallState({
        status: 'ringing',
        peerId: from,
        peerName: parsed.fromDisplayName || from,
        isIncoming: true,
        callId,
      });

      setTimeout(async () => {
        if (currentCallIdRef.current !== callId) {
          return;
        }

        try {
          resetPeerConnection();
          const pc = createPeerConnection(from, callId);
          await pc.setRemoteDescription(new RTCSessionDescription(parsed.offer));
          await flushQueuedIceCandidates(callId, pc);

          sendRawMessage({ type: 'call_ring', to: from, callId });
        } catch (error) {
          console.error('[WebRTC] Failed to prepare incoming call offer:', error);
          sendRawMessage({ type: 'call_reject', to: from, callId, reason: 'setup_failed' });
          cleanupCall(false);
        }
      }, 0);
    }
    else if (type === 'call_ring') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      setCallState((state) => (
        state.callId === callId && (state.status === 'calling' || state.status === 'calling_offline')
          ? { ...state, status: 'calling' }
          : state
      ));
    }
    else if (type === 'call_ring_offline') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      setCallState((state) => (
        state.callId === callId && state.status === 'calling'
          ? { ...state, status: 'calling_offline' }
          : state
      ));
    }
    else if (type === 'call_accepting') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      if (callingTimeoutRef.current) {
        clearTimeout(callingTimeoutRef.current);
        callingTimeoutRef.current = null;
      }
      setCallState((state) => (
        state.callId === callId && (state.status === 'calling' || state.status === 'calling_offline')
          ? { ...state, status: 'connecting' }
          : state
      ));
    }
    else if (type === 'call_answer') {
      if (currentCallIdRef.current !== callId) {
        return;
      }

      console.log("[WebRTC] Received call_answer from peer:", parsed);
      if (callingTimeoutRef.current) {
        clearTimeout(callingTimeoutRef.current);
        callingTimeoutRef.current = null;
      }

      if (pcRef.current) {
        try {
          const answerPayload = parsed.answer?.sdp ? parsed.answer : (parsed.sdp ? parsed : parsed.answer);

          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answerPayload));
          setCallState((state) => state.callId === callId ? { ...state, status: 'connecting' } : state);
          await flushQueuedIceCandidates(callId, pcRef.current);
        } catch (error) {
          console.error("[WebRTC] Failed to set remote description from answer:", error, "Payload:", parsed);
          sendRawMessage({ type: 'call_end', to: from, callId, reason: 'answer_setup_failed' });
          cleanupCall(false);
        }
      } else {
        console.warn("[WebRTC] Received call_answer but pcRef is null. Was the call prematurely closed?");
      }
    }
    else if (type === 'call_connected') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      setCallState((state) => state.callId === callId ? { ...state, status: 'connected' } : state);
    }
    else if (type === 'ice_candidate') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      if (pcRef.current && pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(parsed.candidate)).catch(e => console.log('ICE err', e));
      } else {
        iceCandidateQueueRef.current.push({ callId, candidate: parsed.candidate });
      }
    }
    else if (type === 'call_reject') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      cleanupCall(true);
    }
    else if (type === 'call_end') {
      if (currentCallIdRef.current !== callId) {
        return;
      }
      cleanupCall(true);
    }
  }, [cleanupCall, createPeerConnection, flushQueuedIceCandidates, resetPeerConnection, sendRawMessage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState.status !== 'idle' && callState.peerId && callState.callId) {
        sendRawMessage({ type: 'call_end', to: callState.peerId, callId: callState.callId, reason: 'beforeunload' });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [callState.status, callState.peerId, callState.callId, sendRawMessage]);

  return {
    callState,
    remoteStream,
    isMuted,
    toggleMute,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    handleWebRTCSignal
  };
};
