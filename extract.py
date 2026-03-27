import os
filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/components/ChatWindow.tsx'
content = open(filepath, encoding='utf-8').read()
start = content.find('if (msg.text.startsWith("__system_audio:")) {')
end = content.find('return (', start + 100)
end = content.find('return (', end + 100) # get past the nested return
print(content[start:end])
