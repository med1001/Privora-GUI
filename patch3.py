import os
filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/hooks/useWebRTC.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

import re
text = re.sub(
    r'return \{\s*status: "ringing",\s*peerId: from,\s*peerName: parsed\.fromDisplayName \|\| from,\s*isIncoming: true\s*\};',
    '''if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          ringingTimeoutRef.current = setTimeout(() => {
            cleanupCall(false);
          }, 45000);
          return {
            status: "ringing",
            peerId: from,
            peerName: parsed.fromDisplayName || from,
            isIncoming: true
          };''',
    text
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
