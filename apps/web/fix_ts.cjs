const fs = require('fs');

// Fix ChatPage.tsx
let c = fs.readFileSync('src/pages/chat/ChatPage.tsx', 'utf8');
c = c.replace(/const fileInputRef = useRef<HTMLInputElement>\(null\);\r?\n\s*const \{ theme \} = useThemeStore\(\);\r?\n\s*const \[emojiPickerOpen, setEmojiPickerOpen\] = useState\(false\);\r?\n\s*const \[isPinnedOpen, setIsPinnedOpen\] = useState\(false\);/g, 
  'const fileInputRef = useRef<HTMLInputElement>(null);\n    const inputRef = useRef<HTMLInputElement>(null);\n    const { theme } = useThemeStore();\n    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);\n    const [isPinnedOpen, setIsPinnedOpen] = useState(false);');

c = c.replace(/<UserProfilePanel user=\{user\} \/>/g, '<UserProfilePanel user={user || null} />');
fs.writeFileSync('src/pages/chat/ChatPage.tsx', c);

// Fix AppearanceModal.tsx
let a = fs.readFileSync('src/components/AppearanceModal.tsx', 'utf8');
a = a.replace(/ringColor: color\.value/g, '');
fs.writeFileSync('src/components/AppearanceModal.tsx', a);
