import os
filepath = 'C:/Users/homepc/Desktop/privora_project/Privora/server/src/main.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

old_dc = '''            # Clean up pending calls if caller abruptly disconnects
            for to_user, offer in list(pending_calls.items()):
                if offer["from"] == user_email:
                    del pending_calls[to_user]'''

new_dc = '''            # Clean up pending calls if caller abruptly disconnects
            for to_user, offer in list(pending_calls.items()):
                if offer["from"] == user_email:
                    del pending_calls[to_user]
                    # Also notify the callee that the call dropped so their screen stops ringing
                    if to_user in active_connections:
                        try:
                            import asyncio, json
                            asyncio.create_task(active_connections[to_user].send_text(json.dumps({
                                "type": "call_end",
                                "from": user_email,
                                "to": to_user
                            })))
                        except:
                            pass'''

text = text.replace(old_dc, new_dc)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
