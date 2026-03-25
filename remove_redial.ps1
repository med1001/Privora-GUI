$content = Get-Content src/App.tsx -Raw
$content = $content -replace "          if \(status === 'online' && webRTC\.callState\.status === 'calling_offline' && webRTC\.callState\.peerId === userId\) \{?
            console\.log\('\[WebRTC\] Target user came online! Auto-redialing\.\.\.'\);?
            webRTC\.initiateCall\(userId, webRTC\.callState\.peerName \|\| userId\);?
          \}", ""
Set-Content src/App.tsx $content
