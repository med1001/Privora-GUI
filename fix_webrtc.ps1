$content = Get-Content src/hooks/useWebRTC.ts -Raw

$content = $content -replace 'if \(pcRef\.current\) \{\s+pcRef\.current\.close\(\);\s+pcRef\.current = null;\s+\}', "if (pcRef.current) {
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }"

$content = $content -replace 'setCallState\(\{ status: "calling", peerId, peerName, isIncoming: false \}\);\s+try \{', "setCallState({ status:"calling", peerId, peerName, isIncoming: false });
    try {
      if (pcRef.current) {
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }"

$content = $content -replace 'if \(parsed\.reason === .offline.\) \{\s+setCallState\(s => \(s\.status === .calling. \? \{ \.\.\.s, status: .calling_offline. \} : s\)\);\s+\} else', "if (parsed.reason === 'offline') {
        setCallState(s => (s.status === 'calling' ? { ...s, status: 'calling_offline' } : s));
        if (pcRef.current) {
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.close();
          pcRef.current = null;
        }
      } else"

$content = $content -replace 'setTimeout\(async \(\) => \{\s+if \(pcRef\.current\) pcRef\.current\.close\(\);', "setTimeout(async () => {
          if (pcRef.current) {
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.close();
          }"

Set-Content src/hooks/useWebRTC.ts $content
