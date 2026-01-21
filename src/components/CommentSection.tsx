"use client";

import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import { User, Send } from "lucide-react";

interface Comment {
    id: string;
    content: string;
    author: string;
    createdAt: string;
}

export default function CommentSection({ questionId }: { questionId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchComments();
    }, [questionId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?questionId=${questionId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                body: JSON.stringify({ questionId, content: newComment }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setNewComment("");
                fetchComments();
            } else {
                const errorData = await res.json();
                console.error("Failed to post comment:", errorData);
                alert("無法發表留言，請稍後再試。");
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("發表留言時發生錯誤。");
        }
        setIsLoading(false);
    };

    return (
        <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                討論區 ({comments.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {comments.map((comment) => (
                    <div key={comment.id} style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <User size={18} color="#64748b" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{comment.author}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {mounted ? new Date(comment.createdAt).toLocaleString() : ""}
                                </span>
                            </div>
                            <div
                                style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}
                                dangerouslySetInnerHTML={{ __html: comment.content }}
                            />
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>暫無留言，成為第一個討論的人吧！</p>
                )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem' }}>發表您的想法</p>
                <RichTextEditor
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="支援 Rich Text 與 Emoji..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !newComment.trim()}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.75rem',
                            background: 'var(--accent-color)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Send size={16} />
                        {isLoading ? '傳送中...' : '送出'}
                    </button>
                </div>
            </div>
        </div>
    );
}
