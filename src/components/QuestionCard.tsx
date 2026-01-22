"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, MessageSquare, Copy } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CommentSection from "@/components/CommentSection";
import { updateQuestionExplanation } from "@/lib/firestore-client";

interface Option {
    id: string;
    text: string;
    order: number;
}

type ExamMode = 'exam' | 'review' | 'reading' | null;

interface QuestionProps {
    question: {
        id: string;
        content: string;
        imageUrl?: string | null;
        ocrText?: string | null;
        type: string;
        correctAnswer: string | null;
        answerExplanation: string | null;
        options: Option[];
    };
    mode?: ExamMode;
    examSubmitted?: boolean;
    forceShowAnswer?: boolean;
    isWrong?: boolean;
    onAnswerChange?: (questionId: string, answer: string | null, isCorrect: boolean) => void;
}

export default function QuestionCard({
    question,
    mode = null,
    examSubmitted = false,
    forceShowAnswer = false,
    isWrong = false,
    onAnswerChange
}: QuestionProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [fillAnswer, setFillAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(forceShowAnswer);
    const [showComments, setShowComments] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isEditingExplanation, setIsEditingExplanation] = useState(false);
    const [editedExplanation, setEditedExplanation] = useState(question.answerExplanation || "");
    const [isSaving, setIsSaving] = useState(false);

    // For image-based questions, match by option text (A/B/C/D/E)
    const getSelectedOptionText = () => {
        if (!selectedOption) return null;
        const option = question.options.find(o => o.id === selectedOption);
        return option?.text || null;
    };

    const isCorrect = question.type === "CHOICE"
        ? getSelectedOptionText() === question.correctAnswer
        : fillAnswer.trim().toLowerCase() === (question.correctAnswer || "").trim().toLowerCase();

    // Determine if answer should be shown based on mode
    const shouldShowAnswer = forceShowAnswer || showAnswer || (mode === 'exam' && examSubmitted);

    // In exam mode before submit, hide reveal button and comments
    const canReveal = mode !== 'exam' || examSubmitted;
    const canShowComments = mode !== 'exam' || examSubmitted;

    const handleReveal = () => {
        if (!canReveal) return;
        setShowAnswer(true);
    };

    // Handle option selection with callback
    const handleSelectOption = (optionId: string) => {
        setSelectedOption(optionId);
        const option = question.options.find(o => o.id === optionId);
        const optionText = option?.text || null;
        const correct = optionText === question.correctAnswer;

        if (onAnswerChange) {
            onAnswerChange(question.id, optionText, correct);
        }

        // In review mode, auto-show answer after selection
        if (mode === 'review') {
            setShowAnswer(true);
        }
    };

    // Handle fill answer change with callback
    const handleFillAnswerChange = (value: string) => {
        setFillAnswer(value);
        const correct = value.trim().toLowerCase() === (question.correctAnswer || "").trim().toLowerCase();

        if (onAnswerChange) {
            onAnswerChange(question.id, value, correct);
        }
    };

    // Handle fill answer submit (for review mode)
    const handleFillAnswerSubmit = () => {
        if (mode === 'review' && fillAnswer.trim()) {
            setShowAnswer(true);
        }
    };

    const handleEditExplanation = () => {
        setIsEditingExplanation(true);
        setEditedExplanation(question.answerExplanation || "");
    };

    const handleCancelEdit = () => {
        setIsEditingExplanation(false);
        setEditedExplanation(question.answerExplanation || "");
    };

    const handleSaveExplanation = async () => {
        setIsSaving(true);
        try {
            const updated = await updateQuestionExplanation(question.id, editedExplanation);
            question.answerExplanation = updated.answerExplanation;
            setIsEditingExplanation(false);
        } catch (error: any) {
            console.error('Error saving explanation:', error);
            alert(`儲存失敗: ${error.message || "未知錯誤"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageClick = async () => {
        if (!question.imageUrl) return;

        try {
            // Create an image element
            const img = new Image();
            img.crossOrigin = 'anonymous';

            // Wait for image to load
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = question.imageUrl!;
            });

            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            ctx.drawImage(img, 0, 0);

            // Convert to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to convert canvas to blob'));
                }, 'image/png');
            });

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);

            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy image:', err);
            alert('複製圖片失敗，請稍後再試');
        }
    };

    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageScale, setImageScale] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    // Check for mobile viewport
    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Reset image state when modal closes
    useEffect(() => {
        if (!showImageModal) {
            setImageScale(1);
            setImagePosition({ x: 0, y: 0 });
        }
    }, [showImageModal]);

    // Calculate and set initial scale when modal image loads
    const handleModalImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const { naturalWidth, naturalHeight } = img;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate scale to FILL the viewport (cover behavior)
        // Use Math.max so image covers entire viewport
        const scaleX = viewportWidth / naturalWidth;
        const scaleY = viewportHeight / naturalHeight;
        const fillScale = Math.max(scaleX, scaleY);

        setImageScale(fillScale);
    };

    // Handle wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
    };

    // Handle touch zoom (pinch)
    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return null;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            setLastTouchDistance(getTouchDistance(e.touches));
        } else if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - imagePosition.x, y: e.touches[0].clientY - imagePosition.y });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const distance = getTouchDistance(e.touches);
            if (distance && lastTouchDistance) {
                const delta = (distance - lastTouchDistance) * 0.01;
                setImageScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
                setLastTouchDistance(distance);
            }
        } else if (e.touches.length === 1 && isDragging && imageScale > 1) {
            setImagePosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = () => {
        setLastTouchDistance(null);
        setIsDragging(false);
    };

    // Handle mouse drag
    const handleMouseDown = (e: React.MouseEvent) => {
        if (imageScale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && imageScale > 1) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleModalClose = (e: React.MouseEvent) => {
        // Only close if clicking on backdrop, not on image
        if (e.target === e.currentTarget) {
            setShowImageModal(false);
        }
    };

    return (
        <div className="premium-card question-card" style={{
            borderLeft: isWrong ? '4px solid #ef4444' : undefined
        }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.6 }}>{question.content}</h3>

                {question.imageUrl && (
                    <div style={{ marginTop: '1rem' }}>
                        <img
                            src={question.imageUrl}
                            alt="Question"
                            onClick={() => setShowImageModal(true)}
                            style={{
                                maxWidth: '100%',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s ease'
                            }}
                        />
                        <button
                            onClick={handleImageClick}
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.4rem 0.75rem',
                                background: copySuccess ? '#10b981' : '#f1f5f9',
                                color: copySuccess ? 'white' : '#64748b',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Copy size={14} />
                            {copySuccess ? '已複製' : '複製圖片'}
                        </button>
                    </div>
                )}
            </div>

            {question.type === "CHOICE" ? (
                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {question.options.map((option) => {
                        const isOptionSelected = selectedOption === option.id;
                        const isOptionCorrect = question.correctAnswer === option.text;

                        let bgColor = 'rgba(255, 255, 255, 0.5)';
                        let borderColor = 'var(--glass-border)';

                        if (shouldShowAnswer) {
                            if (isOptionCorrect) {
                                bgColor = 'rgba(16, 185, 129, 0.15)';
                                borderColor = '#10b981';
                            } else if (isOptionSelected && !isCorrect) {
                                bgColor = 'rgba(239, 68, 68, 0.15)';
                                borderColor = '#ef4444';
                            }
                        } else if (isOptionSelected) {
                            borderColor = 'var(--accent-color)';
                            bgColor = 'rgba(59, 130, 246, 0.1)';
                        }

                        return (
                            <button
                                key={option.id}
                                disabled={shouldShowAnswer}
                                onClick={() => handleSelectOption(option.id)}
                                style={{
                                    textAlign: 'center',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    border: `2px solid ${borderColor}`,
                                    background: bgColor,
                                    cursor: shouldShowAnswer ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.35rem',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                    minWidth: '50px'
                                }}
                            >
                                <span>{option.text}</span>
                                {shouldShowAnswer && isOptionCorrect && <CheckCircle2 size={16} color="#10b981" />}
                                {shouldShowAnswer && isOptionSelected && !isCorrect && <XCircle size={16} color="#ef4444" />}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        value={fillAnswer}
                        onChange={(e) => handleFillAnswerChange(e.target.value)}
                        onBlur={handleFillAnswerSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleFillAnswerSubmit()}
                        disabled={shouldShowAnswer}
                        placeholder="請輸入您的答案..."
                        style={{
                            width: '100%',
                            padding: '1rem 1.25rem',
                            borderRadius: '0.75rem',
                            border: `2px solid ${shouldShowAnswer ? (isCorrect ? '#10b981' : '#ef4444') : 'var(--glass-border)'}`,
                            background: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '1rem',
                            color: 'var(--text-main)',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                    />
                    {shouldShowAnswer && !isCorrect && (
                        <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                            正確答案：{question.correctAnswer}
                        </p>
                    )}
                </div>
            )}

            {/* Only show buttons if not in reading mode */}
            {mode !== 'reading' && (
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {canReveal ? (
                        <button
                            onClick={handleReveal}
                            disabled={(question.type === "CHOICE" ? selectedOption === null : !fillAnswer.trim()) || shouldShowAnswer}
                            style={{
                                padding: '0.6rem 1.5rem',
                                borderRadius: '0.75rem',
                                background: ((question.type === "CHOICE" ? selectedOption === null : !fillAnswer.trim()) || shouldShowAnswer) ? '#94a3b8' : 'var(--accent-color)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 600,
                                cursor: ((question.type === "CHOICE" ? selectedOption === null : !fillAnswer.trim()) || shouldShowAnswer) ? 'default' : 'pointer'
                            }}
                        >
                            查看解答
                        </button>
                    ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            {selectedOption || fillAnswer.trim() ? '已作答' : '請作答'}
                        </div>
                    )}

                    {canShowComments ? (
                        <button
                            onClick={() => {
                                if (shouldShowAnswer) setShowComments(!showComments);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: shouldShowAnswer ? 'var(--text-muted)' : '#94a3b8',
                                background: 'none',
                                border: 'none',
                                cursor: shouldShowAnswer ? 'pointer' : 'default',
                                fontWeight: 500,
                                opacity: shouldShowAnswer ? 1 : 0.6
                            }}
                        >
                            <MessageSquare size={18} />
                            {showComments ? '隱藏討論' : '查看討論'}
                        </button>
                    ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', opacity: 0.5 }}>
                            交卷後可查看討論
                        </div>
                    )}
                </div>
            )}

            {shouldShowAnswer && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    borderRadius: '1rem',
                    borderLeft: `4px solid ${forceShowAnswer ? '#a855f7' : (isCorrect ? '#10b981' : '#ef4444')}`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontWeight: 700, margin: 0, color: forceShowAnswer ? '#a855f7' : (isCorrect ? '#10b981' : '#ef4444') }}>
                            {forceShowAnswer ? '詳解' : (isCorrect ? '正確！' : '錯誤')} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>（正確答案：{question.correctAnswer}）</span>
                        </h4>
                        {!isEditingExplanation && (
                            <button
                                onClick={handleEditExplanation}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.5rem',
                                    background: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                編輯
                            </button>
                        )}
                    </div>

                    {isEditingExplanation ? (
                        <div>
                            <textarea
                                value={editedExplanation}
                                onChange={(e) => setEditedExplanation(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '300px',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '2px solid var(--glass-border)',
                                    background: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.6,
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                                placeholder="輸入詳解（支援 Markdown 格式）..."
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <button
                                    onClick={handleSaveExplanation}
                                    disabled={isSaving}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '0.5rem',
                                        background: isSaving ? '#94a3b8' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '0.875rem',
                                        cursor: isSaving ? 'default' : 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {isSaving ? '儲存中...' : '儲存'}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '0.5rem',
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        border: '2px solid var(--glass-border)',
                                        fontSize: '0.875rem',
                                        cursor: isSaving ? 'default' : 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    ) : (
                        <article style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }} className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {question.answerExplanation || "目前尚無詳細解析。"}
                            </ReactMarkdown>
                        </article>
                    )}
                </div>
            )}

            {showComments && canShowComments && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <CommentSection questionId={question.id} />
                </div>
            )}

            {/* Image Modal - rendered via Portal to escape parent constraints */}
            {showImageModal && question.imageUrl && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={handleModalClose}
                    onWheel={handleWheel}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0, 0, 0, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        cursor: imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-out',
                        overflow: 'hidden',
                        touchAction: 'none'
                    }}
                >
                    <img
                        src={question.imageUrl}
                        alt="Question"
                        onLoad={handleModalImageLoad}
                        onMouseDown={handleMouseDown}
                        draggable={false}
                        style={{
                            maxWidth: 'none',
                            maxHeight: 'none',
                            transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none'
                        }}
                    />
                    {/* Close button */}
                    <button
                        onClick={() => setShowImageModal(false)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 300
                        }}
                    >
                        &times;
                    </button>
                    {/* Zoom indicator */}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem'
                    }}>
                        {Math.round(imageScale * 100)}%
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
