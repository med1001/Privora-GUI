$content = Get-Content src/components/CallOverlay.tsx -Raw 

$content = $content -replace 'import \{ Phone, PhoneOff, User \} from .lucide-react.;', "import { Phone, PhoneOff, User, Volume2, VolumeX } from 'lucide-react';"

$content = $content -replace 'const audioRef = useRef<HTMLAudioElement>\(null\);', "const [isSpeaker, setIsSpeaker] = useState(false);
  const audioRef = useRef<HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }>(null);"

$content = $content -replace 'const \[duration, setDuration\] = useState\(0\);', "const [duration, setDuration] = useState(0);

  const toggleSpeaker = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      
      if (audioOutputs.length === 0) return;

      const nextSpeakerMode = !isSpeaker;
      let targetId = audioOutputs[0].deviceId; // default

      if (nextSpeakerMode) {
        // Try to find the speakerphone explicitly
        const speakerPhone = audioOutputs.find(d => d.label.toLowerCase().includes('speaker'));
        if (speakerPhone) targetId = speakerPhone.deviceId;
      } else {
        // Try to find the earpiece explicitly
        const earpiece = audioOutputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('handset'));
        if (earpiece) targetId = earpiece.deviceId;
      }

      if (audioRef.current && typeof audioRef.current.setSinkId === 'function') {
        await audioRef.current.setSinkId(targetId);
        setIsSpeaker(nextSpeakerMode);
      } else {
        console.warn('Browser does not support setSinkId');
        alert('Votre navigateur ne supporte pas le basculement audio natif.');
      }
    } catch (err) {
      console.error('Error switching audio output', err);
    }
  };"

$content = $content -replace '<div className="flex items-center gap-6">', '<div className="flex items-center gap-6">

            {callState.status === "connected" && (
              <button
                onClick={toggleSpeaker}
                className={"rounded-full p-4 shadow-lg transform hover:scale-105 transition \$\{isSpeaker ? \'bg-blue-500 text-white\' : \'bg-gray-200 text-gray-700\'\}"}
                title="Basculer Haut-parleur"
              >
                {isSpeaker ? <Volume2 size={28} /> : <VolumeX size={28} />}
              </button>
            )}'

Set-Content src/components/CallOverlay.tsx $content
