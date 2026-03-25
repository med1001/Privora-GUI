with open(r"C:\Users\homepc\Desktop\privora_project\Privora-GUI\src\components\ChatWindow.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('className="flex-grow p-3 overflow-y-auto space-y-3 flex flex-col"', 'className="flex-grow p-3 overflow-y-auto space-y-3 flex flex-col relative z-20"')

with open(r"C:\Users\homepc\Desktop\privora_project\Privora-GUI\src\components\ChatWindow.tsx", "w", encoding="utf-8") as f:
    f.write(text)
