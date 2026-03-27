import os

filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/components/ChatWindow.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re
new_str = r"className={\bsolute \ \ bg-white border border-gray-200 shadow-lg rounded-full flex gap-1 p-1 z-[60]\}"

content = re.sub(r"className=\{\bsolute -top-10 \$\{isOwn \? 'right-0' : 'left-0'\} bg-white border border-gray-200 shadow-lg rounded-full flex gap-1 p-1 z-10\\}", new_str, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated via regex")
