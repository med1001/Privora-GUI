import os

filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/components/ChatWindow.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_use_effect = """  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeReactionMsgId) {
        setActiveReactionMsgId(null);
      }
    };
    
    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("touchend", handleGlobalClick);
    
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      document.removeEventListener("touchend", handleGlobalClick);
    };
  }, [activeReactionMsgId]);"""

content = content.replace("  useEffect(() => {\n    if (scrollRef.current) {\n      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;\n    }\n  }, [messages]);", new_use_effect)

# remove the wrapper onClick we added previously
content = content.replace(
    '<div className="flex flex-col h-full bg-white" onClick={() => { if (activeReactionMsgId) setActiveReactionMsgId(null); }}>',
    '<div className="flex flex-col h-full bg-white">'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated document click")
