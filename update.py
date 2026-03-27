import re
with open('src/components/ChatWindow.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the input block to add isUploading state
pattern = r"(\{\s*isRecording\s*\?\s*\([\s\S]*?className=\"text-red-700 hover:bg-red-200 rounded-full p-1\.5 transition-colors\"[\s\S]*?title=\"Stop and Send\"[\s\S]*?>\s*<Square size=\{16\} fill=\"currentColor\" \/>\s*</button>\s*</div>\s*\)\s*:\s*\()"

replacement = r'''\1 isUploading ? (
            <div className="flex-grow min-w-0 h-11 px-4 border border-blue-200 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-medium">
              <div className="flex items-center gap-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading attachment...</span>
              </div>
            </div>
          ) : ('''

content = re.sub(pattern, replacement, content)

with open('src/components/ChatWindow.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
