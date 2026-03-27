import os
import re

filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/components/ChatWindow.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add onClick to the main container
content = content.replace(
    '<div className="flex flex-col h-full bg-white">',
    '<div className="flex flex-col h-full bg-white" onClick={() => { if (activeReactionMsgId) setActiveReactionMsgId(null); }}>'
)

# Fix the message onClick
old_onclick = """onClick={() => {                        if
(isLongPressRef.current) {
                              isLongPressRef.current = false;
                              return;
                          }                        if (activeReactionMsgId ===  
msg.msg_id) {
                              setActiveReactionMsgId(null);
                              return;
                          }
                          setClickedMessageIdx(clickedMessageIdx === idx ?      
null : idx);
                      }}"""

# Actually, let's just find the onClick pattern more robustly.
content = re.sub(
    r'onClick=\{\(\) => \{\s*if\s*\(\s*isLongPressRef\.current\s*\)\s*\{\s*isLongPressRef\.current = false;\s*return;\s*\}\s*if\s*\(\s*activeReactionMsgId ===\s*msg\.msg_id\s*\)\s*\{\s*setActiveReactionMsgId\(null\);\s*return;\s*\}\s*setClickedMessageIdx\(clickedMessageIdx === idx \? \s*null : idx\);\s*\}\}',
    '''onClick={(e) => {
                        if (isLongPressRef.current) {
                            isLongPressRef.current = false;
                            e.stopPropagation();
                            return;
                        }
                        if (activeReactionMsgId === msg.msg_id) {
                            setActiveReactionMsgId(null);
                            e.stopPropagation();
                            return;
                        }
                        setClickedMessageIdx(clickedMessageIdx === idx ? null : idx);
                    }}''',
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated click outside")
