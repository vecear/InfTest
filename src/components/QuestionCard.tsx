"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import CommentSection from "@/components/CommentSection";

interface Option {
    id: string;
    text: string;
    order: number;
}

interface QuestionProps {
    question: {
        id: string;
        content: string;
        imageUrl?: string | null;
        type: string;
        correctAnswer: string | null;
        answerExplanation: string | null;
        options: Option[];
    };
}

export default function QuestionCard({ question }: QuestionProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [fillAnswer, setFillAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const isCorrect = question.type === "CHOICE"
        ? selectedOption === question.correctAnswer
        : fillAnswer.trim().toLowerCase() === (question.correctAnswer || "").trim().toLowerCase();

    const handleReveal = () => {
        setShowAnswer(true);
    };

    return (
        <div className="premium-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.6 }}>- {question.content}</h3>
                {question.imageUrl && (
                    <img src={question.imageUrl} alt="Question" style={{ maxWidth: '100%', borderRadius: '0.75rem', marginTop: '1rem' }} />
                )}
            </div>

            {question.type === "CHOICE" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {question.options.map((option, index) => {
                        const isOptionSelected = selectedOption === option.id;
                        const isOptionCorrect = question.correctAnswer === option.id;

                        let bgColor = 'rgba(255, 255, 255, 0.5)';
                        let borderColor = 'var(--glass-border)';

                        if (showAnswer) {
                            if (isOptionCorrect) {
                                bgColor = 'rgba(16, 185, 129, 0.1)';
                                borderColor = '#10b981';
                            } else if (isOptionSelected && !isCorrect) {
                                bgColor = 'rgba(239, 68, 68, 0.1)';
                                borderColor = '#ef4444';
                            }
                        } else if (isOptionSelected) {
                            borderColor = 'var(--accent-color)';
                            bgColor = 'rgba(59, 130, 246, 0.05)';
                        }

                        return (
                            <button
                                key={option.id}
                                disabled={showAnswer}
                                onClick={() => setSelectedOption(option.id)}
                                style={{
                                    textAlign: 'left',
                                    padding: '1rem 1.25rem',
                                    borderRadius: '0.75rem',
                                    border: `2px solid ${borderColor}`,
                                    background: bgColor,
                                    cursor: showAnswer ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '1rem',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <span>{String.fromCharCode(65 + index)}. {option.text}</span>
                                {showAnswer && isOptionCorrect && <CheckCircle2 size={20} color="#10b981" />}
                                {showAnswer && isOptionSelected && !isCorrect && <XCircle size={20} color="#ef4444" />}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        value={fillAnswer}
                        onChange={(e) => setFillAnswer(e.target.value)}
                        disabled={showAnswer}
                        placeholder="請輸入您的答案..."
                        style={{
                            width: '100%',
                            padding: '1rem 1.25rem',
                            borderRadius: '0.75rem',
                            border: `2px solid ${showAnswer ? (isCorrect ? '#10b981' : '#ef4444') : 'var(--glass-border)'}`,
                            background: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '1rem',
                            color: 'var(--text-main)',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                    />
                    {showAnswer && !isCorrect && (
                        <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                            正確答案：{question.correctAnswer}
                        </p>
                    )}
                </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={handleReveal}
                    disabled={(question.type === "CHOICE" ? selectedOption === null : !fillAnswer.trim()) || showAnswer}
                    style={{
                        padding: '0.6rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: ((question.type === "CHOICE" ? selectedOption === null : !fillAnswer.trim()) || showAnswer) ? '#94a3b8' : 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 600,
                        cursor: ((question.type === "CHOICE" ? selectedOption === null : !fillAnswer.trim()) || showAnswer) ? 'default' : 'pointer'
                    }}
                >
                    查看解答
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    <MessageSquare size={18} />
                    {showComments ? '隱藏討論' : '查看討論'}
                </button>
            </div>

            {showAnswer && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    borderRadius: '1rem',
                    borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`
                }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: isCorrect ? '#10b981' : '#ef4444' }}>
                        {isCorrect ? '正確！' : '錯誤'}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {question.answerExplanation || "目前尚無詳細解析。"}
                    </p>
                </div>
            )}

            {showComments && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <CommentSection questionId={question.id} />
                </div>
            )}
        </div>
    );
}
