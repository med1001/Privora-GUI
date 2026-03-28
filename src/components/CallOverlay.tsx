import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, User, Mic, MicOff, Volume2, Smartphone } from 'lucide-react';
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

  // Play ringtone if calling or ringing and handle abort timeout
  useEffect(() => {
    let abortTimeout: NodeJS.Timeout;
    
    if (callState.status === 'calling' || callState.status === 'calling_offline' || callState.status === 'ringing') {
        const audio = ringtoneRef.current;
        if (audio) {
          if (callState.status === 'calling_offline') {
            audio.src = '/assets/offline_calling.wav';
          } else {
            audio.src = callState.status === 'calling' ? '/assets/calling.mp3' : '/assets/ringing.mp3';
          }
          audio.loop = true;
          // Catch and ignore abort errors to prevent unnecessary console spam
          const playPromise = audio.play();
          if (playPromise !== undefined) {
             playPromise.catch(e => {
               if (e.name !== 'AbortError') console.log('Audio error:', e);
             });
          }
        }

        // Auto abort after 45 seconds of ringing
        abortTimeout = setTimeout(() => {
          console.log("[CallOverlay] Auto-aborting call due to timeout (no response)");
          if (callState.isIncoming) {
            onReject();
          } else {
            onHangup();
          }
        }, 45000);
    } else {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }
    
    return () => clearTimeout(abortTimeout);
  }, [callState.status, callState.isIncoming, onHangup, onReject]);

  // Attach remote stream when connected
  useEffect(() => {
    if (callState.status === 'connected' && remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
           playPromise.catch(e => {
             if (e.name !== 'AbortError') console.log('Remote audio error:', e);
           });
        }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <audio ref={audioRef} hidden autoPlay />
      <audio ref={ringtoneRef} hidden />
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center justify-center transform transition-all scale-100">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 overflow-hidden">
           <User size={48} className="text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">{callState.peerName || 'Unknown User'}</h2>
        
        <p className="text-gray-500 mb-8 animate-pulse text-sm">
          {callState.status === 'calling' && 'Calling...'}
          {callState.status === 'ringing' && 'Incoming Call...'}
          {callState.status === 'connected' && formatDuration(duration)}
        </p>

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
