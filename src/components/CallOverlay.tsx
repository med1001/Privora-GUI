import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { CallState } from '../hooks/useWebRTC';

interface CallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ callState, remoteStream, onAccept, onReject, onHangup }) => {
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

  // Play ringtone if calling or ringing
  useEffect(() => {
    if (callState.status === 'calling' || callState.status === 'ringing') {
        const audio = ringtoneRef.current;
        if (audio) {
          audio.src = callState.status === 'calling' ? '/assets/calling.mp3' : '/assets/ringing.mp3';
          audio.loop = true;
          audio.play().catch(e => console.log('Audio error:', e));
        }
    } else {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }
  }, [callState.status]);

  // Attach remote stream when connected
  useEffect(() => {
    if (callState.status === 'connected' && remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.log('Remote audio error:', e));
    }
  }, [callState.status, remoteStream]);

  if (callState.status === 'idle') return null;

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
          {(callState.status === 'ringing') && (
            <button 
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transform hover:scale-105 transition"
            >
              <Phone size={28} />
            </button>
          )}
          
          <button 
            onClick={callState.status === 'ringing' ? onReject : onHangup}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transform hover:scale-105 transition"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;