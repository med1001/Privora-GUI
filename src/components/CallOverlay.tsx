import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { CallState } from '../hooks/useWebRTC';

interface CallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ callState, remoteStream, onAccept, onReject, onHangup, isMuted, onToggleMute }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  /** Browser autoplay policy blocked remote <audio>.play(); cleared on success or new stream. */
  const [remotePlayBlocked, setRemotePlayBlocked] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.status === 'connected') {
      interval = setInterval(() => setDuration(p => p + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState.status]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Play ringtone while the call is still waiting for pickup.
  useEffect(() => {
    if (callState.status === 'calling' || callState.status === 'calling_offline' || callState.status === 'ringing') {
      const audio = ringtoneRef.current;
      if (audio) {
        if (callState.status === 'calling_offline') {
          audio.src = '/assets/offline_calling.wav';
        } else {
          audio.src = callState.status === 'calling' ? '/assets/calling.mp3' : '/assets/ringing.mp3';
        }
        audio.loop = true;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') console.log('Audio error:', e);
          });
        }
      }
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, [callState.status]);

  useEffect(() => {
    if (callState.status === 'idle') {
      setRemotePlayBlocked(false);
    }
  }, [callState.status]);

  const tryPlayRemoteElement = (el: HTMLAudioElement) => {
    const playPromise = el.play();
    if (playPromise === undefined) return;
    playPromise
      .then(() => setRemotePlayBlocked(false))
      .catch((e: DOMException) => {
        if (e.name === 'AbortError') return;
        console.warn('Remote audio error:', e);
        if (e.name === 'NotAllowedError') {
          setRemotePlayBlocked(true);
        }
      });
  };

  // Attach remote stream when media is available.
  useEffect(() => {
    if (!remoteStream) {
      setRemotePlayBlocked(false);
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    el.srcObject = remoteStream;
    tryPlayRemoteElement(el);
  }, [remoteStream]);

  const resumeRemoteAudio = () => {
    const el = audioRef.current;
    if (!el || !remoteStream) return;
    el.srcObject = remoteStream;
    tryPlayRemoteElement(el);
  };

  const getStatusLabel = () => {
    switch (callState.status) {
      case 'calling':
        return 'Calling...';
      case 'calling_offline':
        return 'User is offline. Waiting for them to reconnect...';
      case 'ringing':
        return 'Incoming Call...';
      case 'connecting':
        return 'Connecting audio...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'connected':
        return formatDuration(duration);
      default:
        return '';
    }
  };

  if (callState.status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <audio ref={audioRef} hidden playsInline />
      <audio ref={ringtoneRef} hidden />
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center justify-center transform transition-all scale-100">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 overflow-hidden">
           <User size={48} className="text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">{callState.peerName || 'Unknown User'}</h2>
        
        <p
          className={`text-gray-500 animate-pulse text-sm ${
            remotePlayBlocked && remoteStream && callState.status !== 'ringing' ? 'mb-2' : 'mb-8'
          }`}
        >
          {getStatusLabel()}
        </p>

        {remotePlayBlocked && remoteStream && callState.status !== 'ringing' && (
          <div
            className="mb-6 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center"
            role="alert"
          >
            <div className="mb-2 flex items-center justify-center gap-2 text-amber-900">
              <VolumeX className="shrink-0" size={20} aria-hidden />
              <span className="text-sm font-medium">Sound blocked by your browser</span>
            </div>
            <p className="mb-3 text-xs text-amber-800/90">
              Tap the button below so the call audio can play.
            </p>
            <button
              type="button"
              onClick={resumeRemoteAudio}
              className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-700"
            >
              Enable call sound
            </button>
          </div>
        )}

        <div className="flex items-center gap-6">
          {(callState.status === 'ringing') ? (
            <>
              <button
                onClick={onAccept}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transform hover:scale-105 transition"
              >
                <Phone size={28} />
              </button>
              <button
                onClick={onReject}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transform hover:scale-105 transition"
              >
                <PhoneOff size={28} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onToggleMute}
                className={`${isMuted ? 'bg-gray-100 text-gray-500' : 'bg-gray-800 text-white'} rounded-full p-4 shadow-lg transform hover:scale-105 transition`}
              >
                {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              
              <button
                onClick={() => alert("Browser calls default to speakerphone. Switching to the built-in receiver requires a native app.")}
                className="bg-blue-100 text-blue-600 rounded-full p-4 shadow-lg transform hover:scale-105 transition shadow-inner"
              >
                <Volume2 size={28} />
              </button>

              <button
                onClick={onHangup}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform hover:scale-105 transition"
              >
                <PhoneOff size={32} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
