import os
filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/hooks/useWebRTC.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

old_dc = '''          return {
            status: "ringing",
            peerId: from,
            peerName: parsed.fromDisplayName || from,
            isIncoming: true
          };'''

new_dc = '''          if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          ringingTimeoutRef.current = setTimeout(() => {
            console.log('[WebRTC] Call ringing timeout reached. Dropping ghost call.');
            cleanupCall(false);
          }, 45000); // 45 sec auto drop if no answer

          return {
            status: "ringing",
            peerId: from,
            peerName: parsed.fromDisplayName || from,
            isIncoming: true
          };'''

text = text.replace(old_dc, new_dc)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
