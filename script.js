const fs = require(fs);
let c = fs.readFileSync(C:/Users/homepc/Desktop/privora_project/Privora/server/src/handlers/message.py, utf8);
c = c.replace(
    /pending_calls\[recipient_email\] = \{from: sender_email, data: forward_data\}/g,
    
);
fs.writeFileSync(C:/Users/homepc/Desktop/privora_project/Privora/server/src/handlers/message.py, c);
