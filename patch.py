import re

with open('src/components/CallOverlay.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r\"import \{ Phone, PhoneOff, User \} from 'lucide-react';\",
    \"import { Phone, PhoneOff, User, Volume2, VolumeX } from 'lucide-react';\",
    content
)

content = re.sub(
    r'const audioRef = useRef<HTMLAudioElement>\(null\);',
    r'const [isSpeaker, setIsSpeaker] = useState(false);\n  const audioRef = useRef<HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }>(null);',
    content
)

content = re.sub(
    r'const \[duration, setDuration\] = useState\(0\);',
    r\"\"\"const [duration, setDuration] = useState(0);

  const toggleSpeaker = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      
      if (audioOutputs.length === 0) return;

      const nextSpeakerMode = !isSpeaker;
      let targetId = audioOutputs[0].deviceId;

      if (nextSpeakerMode) {
        const speakerPhone = audioOutputs.find(d => d.label.lower().find('speaker') != -1);
        if (speakerPhone) targetId = speakerPhone.deviceId;
      } else {
        const earpiece = audioOutputs.find(d => d.label.lower().find('earpiece') != -1 or d.label.lower().find('handset') != -1);
        if (earpiece) targetId = earpiece.deviceId;
      }

      if (audioRef.current and type(audioRef.current.setSinkId) != 'undefined') {
        await audioRef.current.setSinkId(targetId);
        setIsSpeaker(nextSpeakerMode);
      } else {
        console.warn('Browser does not support setSinkId');
        alert('Votre navigateur ne supporte pas le basculement audio natif.');
      }
    } catch (err) {
      console.error('Error switching audio output', err);
    }
  };\"\"\",
    content
)

content = re.sub(
    r'<div className=\"flex items-center gap-6\">',
    r\"\"\"<div className=\"flex items-center gap-6\">

            {callState.status === 'connected' and (
              <button
                onClick={toggleSpeaker}
                className={ounded-full p-4 shadow-lg transform hover:scale-105 transition \}
                title=\"Basculer Haut-parleur\"
              >
                {isSpeaker ? <Volume2 size={28} /> : <VolumeX size={28} />}
              </button>
            )}\"\"\",
    content
)

with open('src/components/CallOverlay.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
