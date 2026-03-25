const fs = require('fs');
const path = 'src/components/CallOverlay.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import \{ Phone, PhoneOff, User \} from 'lucide-react';/,
  "import { Phone, PhoneOff, User, Volume2, VolumeX } from 'lucide-react';"
);

content = content.replace(
  /const audioRef = useRef<HTMLAudioElement>\(null\);/,
  "const [isSpeaker, setIsSpeaker] = useState(false);\n  const audioRef = useRef<HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }>(null);"
);

content = content.replace(
  /const \[duration, setDuration\] = useState\(0\);/,
  "const [duration, setDuration] = useState(0);\n\n  const toggleSpeaker = async () => {\n    try {\n      const devices = await navigator.mediaDevices.enumerateDevices();\n      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');\n      \n      if (audioOutputs.length === 0) return;\n\n      const nextSpeakerMode = !isSpeaker;\n      let targetId = audioOutputs[0].deviceId; // default\n\n      if (nextSpeakerMode) {\n        // Try to find the speakerphone explicitly\n        const speakerPhone = audioOutputs.find(d => d.label.toLowerCase().includes('speaker'));\n        if (speakerPhone) targetId = speakerPhone.deviceId;\n      } else {\n        // Try to find the earpiece explicitly\n        const earpiece = audioOutputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('handset'));\n        if (earpiece) targetId = earpiece.deviceId;\n      }\n\n      if (audioRef.current && typeof audioRef.current.setSinkId === 'function') {\n        await audioRef.current.setSinkId(targetId);\n        setIsSpeaker(nextSpeakerMode);\n      } else {\n        console.warn('Browser does not support setSinkId');\n        alert('Votre navigateur ne supporte pas le basculement audio natif.');\n      }\n    } catch (err) {\n      console.error('Error switching audio output', err);\n    }\n  };\n"
);

content = content.replace(
  /<div className="flex items-center gap-6">/,
  \<div className="flex items-center gap-6">\n\n            {callState.status === "connected" && (\n              <button\n                onClick={toggleSpeaker}\n                className={"rounded-full p-4 shadow-lg transform hover:scale-105 transition " + (isSpeaker ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700")}\n                title="Basculer Haut-parleur"\n              >\n                {isSpeaker ? <Volume2 size={28} /> : <VolumeX size={28} />}\n              </button>\n            )}\
);

fs.writeFileSync(path, content, 'utf8');
