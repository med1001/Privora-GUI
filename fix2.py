import os
filepath = 'C:/Users/homepc/Desktop/privora_project/Privora/server/src/handlers/message.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'pending_calls[recipient_email] = {"from": sender_email, "data": forward_data}',
    'import time\n                  pending_calls[recipient_email] = {"from": sender_email, "data": forward_data, "timestamp": time.time()}'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
