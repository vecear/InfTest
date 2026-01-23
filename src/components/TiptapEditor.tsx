"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, Heading1, Heading2, Heading3,
    Quote, Highlighter, Smile, Type
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    const [showEmoji, setShowEmoji] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmoji(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        editor.chain().focus().insertContent(emojiData.emoji).run();
        setShowEmoji(false);
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-menu-bar" style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.5rem',
            borderBottom: '1px solid var(--glass-border)',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center'
        }}>
            {/* Semantic Headings */}
            <div style={{ display: 'flex', gap: '0.2rem', paddingRight: '0.4rem', borderRight: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                    title="Heading 1"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('heading', { level: 1 }) ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('heading', { level: 1 }) ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Heading1 size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    title="Heading 2"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('heading', { level: 2 }) ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('heading', { level: 2 }) ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Heading2 size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                    title="Heading 3"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('heading', { level: 3 }) ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('heading', { level: 3 }) ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Heading3 size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={editor.isActive('paragraph') ? 'is-active' : ''}
                    title="內文 (Paragraph)"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('paragraph') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('paragraph') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Type size={18} />
                </button>
            </div>

            {/* Basic Formatting */}
            <div style={{ display: 'flex', gap: '0.2rem', paddingRight: '0.4rem', borderRight: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    title="Bold"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('bold') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('bold') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <Bold size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    title="Italic"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('italic') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('italic') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <Italic size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive('underline') ? 'is-active' : ''}
                    title="Underline"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('underline') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('underline') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <UnderlineIcon size={18} />
                </button>
            </div>

            {/* Colors & Highlight */}
            <div style={{ display: 'flex', gap: '0.2rem', paddingRight: '0.4rem', borderRight: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    className={editor.isActive('highlight') ? 'is-active' : ''}
                    title="Highlight"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('highlight') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('highlight') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <Highlighter size={18} />
                </button>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="color"
                        onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        title="Text Color"
                        style={{
                            width: '32px',
                            height: '32px',
                            padding: '0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: 'transparent'
                        }}
                    />
                </div>

                <div style={{ position: 'relative' }} ref={emojiRef}>
                    <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        title="Emoji"
                        style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            background: showEmoji ? 'var(--accent-color)' : 'transparent',
                            color: showEmoji ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Smile size={18} />
                    </button>
                    {showEmoji && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                        </div>
                    )}
                </div>
            </div>

            {/* Lists & Wrappers */}
            <div style={{ display: 'flex', gap: '0.2rem' }}>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    title="Bullet List"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('bulletList') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('bulletList') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <List size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    title="Ordered List"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('orderedList') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('orderedList') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <ListOrdered size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                    title="Quote"
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: editor.isActive('blockquote') ? 'var(--accent-color)' : 'transparent',
                        color: editor.isActive('blockquote') ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <Quote size={18} />
                </button>
            </div >
        </div >
    );
};

export default function TiptapEditor({ content, onChange, editable = true }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Highlight.configure({ multicolor: true }),
            TextStyle,
            Color,
        ],
        content: content,
        editable: editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
                style: 'min-height: 150px; padding: 0.5rem;'
            },
        },
    });

    // Update content if it changes externally (e.g. init)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if content is significantly different to avoid cursor jumps? 
            // Actually dangerous if typing.
            // But needed for initial load.
            // For now, assume content prop is stable or we only use it for initial
            if (editor.isEmpty && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: editable ? '1px solid var(--glass-border)' : 'none',
            borderRadius: '0.75rem',
            background: editable ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
            overflow: 'hidden'
        }}>
            {editable && <MenuBar editor={editor} />}
            <EditorContent editor={editor} style={{ padding: editable ? '0.5rem' : '0' }} />
        </div>
    );
}
