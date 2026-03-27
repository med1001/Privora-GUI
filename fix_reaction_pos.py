import os

filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/components/ChatWindow.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = "className={bsolute -top-10  bg-white border border-gray-200 shadow-lg rounded-full flex gap-1 p-1 z-10}"
new_str = "className={bsolute   bg-white border border-gray-200 shadow-lg rounded-full flex gap-1 p-1 z-[60]}"

if old_str in content:
    content = content.replace(old_str, new_str)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated positioning.")
else:
    print("Could not find the target string. The file might have been modified.")
