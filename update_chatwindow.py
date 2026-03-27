import sys

filepath = r'C:\Users\homepc\Desktop\privora_project\Privora-GUI\src\components\ChatWindow.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if "Camera," not in content and "Loader2" not in content:
    content = content.replace(
        "Phone, Mic, Square, Send as SendIcon } from \"lucide-react\";",
        "Phone, Mic, Square, Send as SendIcon, Camera, Image as ImageIcon, Paperclip, Loader2 } from \"lucide-react\";"
    )

# 2. Inject states and utils
state_injection = '''
    const EMOJI_OPTIONS = [\"??\", \"??\", \"??\", \"??\", \"??\", \"??\"];

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image' | 'camera') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("File too large. Maximum size is 10MB.");
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(${API_URL}/api/upload, {
                method: "POST",
                headers: {
                    ...(token ? { "Authorization": Bearer  } : {})
                },
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            
            const data = await response.json();
            if (data.url && selectedChat) {
                let messageContent = __system_file:|;
                if (type === 'image' || type === 'camera' || data.type?.startsWith('image/')) {
                    messageContent = __system_image:;
                }
                onSendMessage(messageContent, selectedChat);
            } else if (data.error) {
                alert(data.error);
            }
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };
'''

if "const [isUploading, setIsUploading]" not in content:
    content = content.replace("    const EMOJI_OPTIONS = [\"??\", \"??\", \"??\", \"??\", \"??\", \"??\"];", state_injection)


# 3. Update Message Content Renderer
render_code = '''
                    {msg.text.startsWith("__system_image:") ? (
                        <img src={${API_URL}} alt="uploaded" className="max-w-[200px] sm:max-w-xs rounded" />
                    ) : msg.text.startsWith("__system_file:") ? (
                        <a href={${API_URL}} target="_blank" rel="noopener noreferrer" className={lex items-center gap-2 underline break-all }>
                            <Paperclip size={16} className="flex-shrink-0" /> 
                            <span className="truncate">{msg.text.split("|")[1] || "Attachment"}</span>
                        </a>
                    ) : (
                        <div className="text-[15px] leading-relaxed break-words">{msg.text}</div>
                    )}
'''

if "__system_image:" not in content:
    content = content.replace('<div className="text-[15px] leading-relaxed break-words">{msg.text}</div>', render_code)


# 4. Input Area Update
old_input = '''
        {/* Mic Button (Left side, only empty text & not recording) */}
        {(!message.trim() && !isRecording) && (
          <button
            onClick={startRecording}
            className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedChat || sending}
            title="Record Voice Message"
          >
            <Mic size={22} />
          </button>
        )}
'''

new_input = '''
        {/* Action Buttons (Left side, only empty text & not recording) */}
        {(!message.trim() && !isRecording) && (
          <div className="flex items-center">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedChat || sending || isUploading}
              title="Take Photo"
            >
              <Camera size={20} />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedChat || sending || isUploading}
              title="Attach Image"
            >
              <ImageIcon size={20} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedChat || sending || isUploading}
              title="Attach Document"
            >
              <Paperclip size={20} />
            </button>
            <button
              onClick={startRecording}
              className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedChat || sending || isUploading}
              title="Record Voice Message"
            >
              <Mic size={20} />
            </button>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input type="file" ref={fileInputRef} onChange={(e) => handleUpload(e, 'file')} className="hidden" />
        <input type="file" ref={imageInputRef} accept="image/*" onChange={(e) => handleUpload(e, 'image')} className="hidden" />
        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={(e) => handleUpload(e, 'camera')} className="hidden" />
'''

if "cameraInputRef.current?.click()" not in content:
    # Do normal replacement if old_input exactly matches
    if "        {/* Mic Button (Left side, only empty text & not recording) */}" in content:
        import re
        content = re.sub(
            r'\{\/\*\s*Mic Button\s*\(Left side.*?\n.*?\(\!message\.trim\(\).*?\n.*?<button\n.*?onClick=\{startRecording\}[\s\S]*?<Mic size=\{22\} \/>\n.*?</button>\n\s*\)\}',
            new_input,
            content
        )
    else:
        print("COULD NOT FIND MIC BUTTON REPLACEMENT TO REPLACE")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ChatWindow.tsx")

