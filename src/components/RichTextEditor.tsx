"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Palette,
    Smile,
    Type
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const MenuButton = ({
    onClick,
    isActive = false,
    children,
    title
}: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        style={{
            padding: '0.4rem',
            borderRadius: '0.5rem',
            background: isActive ? 'var(--accent-color)' : 'transparent',
            color: isActive ? 'white' : 'var(--text-main)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: isActive ? 1 : 0.7,
        }}
    >
        {children}
    </button>
);

export default function RichTextEditor({ value, onChange, placeholder }: EditorProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
                style: 'min-height: 120px; padding: 1rem; color: var(--text-main); font-size: 1rem; line-height: 1.5;',
            },
        },
    });

    useEffect(() => {
        if (editor && value === "" && editor.getHTML() !== "<p></p>" && editor.getHTML() !== "") {
            editor.commands.setContent("");
        }
    }, [value, editor]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!editor) return null;

    const colors = [
        '#000000', '#475569', '#ef4444', '#f97316', '#f59e0b',
        '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
    ];

    return (
        <div style={{
            border: '1px solid var(--glass-border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            background: 'white',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                padding: '0.5rem',
                borderBottom: '1px solid var(--glass-border)',
                background: '#f8fafc',
                alignItems: 'center'
            }}>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="粗體"
                >
                    <Bold size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="斜體"
                >
                    <Italic size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="底線"
                >
                    <UnderlineIcon size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="刪除線"
                >
                    <Strikethrough size={18} />
                </MenuButton>

                <div style={{ width: '1px', height: '1.25rem', background: 'var(--glass-border)', margin: '0 0.25rem' }} />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="標題"
                >
                    <Type size={18} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="靠左對齊"
                >
                    <AlignLeft size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="置中對齊"
                >
                    <AlignCenter size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="靠右對齊"
                >
                    <AlignRight size={18} />
                </MenuButton>

                <div style={{ width: '1px', height: '1.25rem', background: 'var(--glass-border)', margin: '0 0.25rem' }} />

                <div style={{ position: 'relative' }} ref={colorPickerRef}>
                    <MenuButton
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        isActive={showColorPicker}
                        title="文字顏色"
                    >
                        <Palette size={18} />
                    </MenuButton>
                    {showColorPicker && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 100,
                            background: 'white',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '0.25rem',
                            border: '1px solid var(--glass-border)',
                            marginTop: '0.5rem'
                        }}>
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        editor.chain().focus().setColor(color).run();
                                        setShowColorPicker(false);
                                    }}
                                    style={{
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        background: color,
                                        borderRadius: '0.25rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative' }} ref={emojiPickerRef}>
                    <MenuButton
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        isActive={showEmojiPicker}
                        title="插入 Emoji"
                    >
                        <Smile size={18} />
                    </MenuButton>
                    {showEmojiPicker && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 100,
                            marginTop: '0.5rem'
                        }}>
                            <EmojiPicker
                                theme={Theme.LIGHT}
                                onEmojiClick={(emojiData) => {
                                    editor.chain().focus().insertContent(emojiData.emoji).run();
                                    setShowEmojiPicker(false);
                                }}
                                width={300}
                                height={400}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ background: 'white' }}>
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .tiptap:focus {
                    outline: none;
                }
                .tiptap p { margin: 0; }
                .tiptap h3 { margin: 0.5rem 0; font-size: 1.25rem; font-weight: 700; }
            `}</style>
        </div>
    );
}
