import os

filepath = 'C:/Users/homepc/Desktop/privora_project/Privora-GUI/src/components/ChatWindow.tsx'
content = open(filepath, encoding='utf-8').read()
start = content.find('if (msg.text.startsWith("__system_audio:")) {')
end = content.find('return (', start + 100)
end = content.find('return (', end + 100)
end = content.find('}', end) + 1  # find the closing bracket of the if block

old_block = content[start:end]

new_block = '''if (msg.text.startsWith("__system_audio:")) {
                const audioBase64 = msg.text.replace("__system_audio:", "");
                return (
                  <div
                    key={idx}
                    className={lex flex-col max-w-[75%] mb-1 }
                  >
                    <div className="relative">
                      {activeReactionMsgId === msg.msg_id && (
                          <div className={bsolute   bg-white border border-gray-200 shadow-lg rounded-full flex gap-1 p-1 z-[60]}>
                          {EMOJI_OPTIONS.map(emoji => (
                            <button
                              key={emoji}
                              className="hover:bg-gray-100 p-1 rounded-full text-lg transition-transform hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSendReaction && msg.msg_id) {
                                  onSendReaction(msg.msg_id, emoji, selectedChat);
                                }
                                setActiveReactionMsgId(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div
                        onClick={(e) => {
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
                        }}
                        onMouseDown={() => handlePressStart(msg.msg_id)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={() => handlePressStart(msg.msg_id)}
                        onTouchEnd={handlePressEnd}
                        className={py-2 px-3 rounded-xl shadow-sm relative group cursor-pointer transition-all select-none }
                      >
                        <audio controls src={audioBase64} className="h-10 w-48" />

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={bsolute -bottom-3  bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm flex items-center gap-1 z-0}>
                             {Array.from(new Set(Object.values(msg.reactions))).map((emoji, i) => (
                               <span key={i}>{emoji}</span>
                             ))}
                             {Object.keys(msg.reactions).length > 1 && <span className="text-[10px] text-gray-500 font-medium">{Object.keys(msg.reactions).length}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Adding some margin if reactions are shown to prevent overlap */}
                    <div className={${msg.reactions && Object.keys(msg.reactions).length > 0 ? "mt-2" : ""}}>
                      {clickedMessageIdx === idx && (
                        <div className={	ext-[11px] mt-1 px-1 select-none flex items-center opacity-70 animate-in fade-in slide-in-from-top-1 }>
                          {timeString}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }'''

content = content.replace(old_block, new_block)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Replaced {len(old_block)} characters with {len(new_block)} characters")
