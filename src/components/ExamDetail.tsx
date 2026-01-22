"use client";

import { ArrowLeft, Clock, Play, FileCheck, BookOpen, Eye } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";
import QuestionCard from "./QuestionCard";

type ExamMode = 'exam' | 'review' | 'reading' | null;

interface Option {
    id: string;
    text: string;
    order: number;
}

interface Question {
    id: string;
    content: string;
    imageUrl?: string | null;
    ocrText?: string | null;
    type: string;
    correctAnswer: string | null;
    answerExplanation: string | null;
    options: Option[];
}

interface Exam {
    id: string;
    title: string;
    questions: Question[];
}

interface ExamDetailProps {
    exam: Exam;
    backPath: string;
}

interface AnswerRecord {
    answer: string | null;
    isCorrect: boolean;
}

export default function ExamDetail({ exam, backPath }: ExamDetailProps) {
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const [isNavHovered, setIsNavHovered] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Exam mode states
    const [selectedMode, setSelectedMode] = useState<ExamMode>(null);
    const [examStarted, setExamStarted] = useState(false);
    const [examSubmitted, setExamSubmitted] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState(120);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});

    // Calculate score
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const wrongQuestionIds = Object.entries(answers)
        .filter(([, a]) => !a.isCorrect && a.answer !== null)
        .map(([id]) => id);

    const scrollToQuestion = useCallback((index: number) => {
        const element = questionRefs.current[index];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const scrollToTop = useCallback(() => {
        if (headerRef.current) {
            headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    // Handle answer changes from QuestionCard
    const handleAnswerChange = useCallback((questionId: string, answer: string | null, isCorrect: boolean) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { answer, isCorrect }
        }));
    }, []);

    // Start exam
    const handleStartExam = () => {
        setExamStarted(true);
        if (selectedMode === 'exam') {
            setTimeRemaining(timerMinutes * 60);
        }
    };

    // Submit exam
    const handleSubmit = useCallback(() => {
        setExamSubmitted(true);
        scrollToTop();
    }, [scrollToTop]);

    // Timer effect for exam mode
    useEffect(() => {
        if (selectedMode !== 'exam' || !examStarted || examSubmitted) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedMode, examStarted, examSubmitted, handleSubmit]);

    // Format time
    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 150;
            for (let i = questionRefs.current.length - 1; i >= 0; i--) {
                const element = questionRefs.current[i];
                if (element && element.offsetTop <= scrollPosition) {
                    setCurrentQuestion(i + 1);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Backdrop for click-outside on mobile */}
            {mounted && isMobile && isNavHovered && examStarted && (
                <div
                    onClick={() => setIsNavHovered(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.2)',
                        zIndex: 1098,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* Floating Navigation */}
            {examStarted && (
                <div
                    onMouseEnter={() => !isMobile && setIsNavHovered(true)}
                    onMouseLeave={() => !isMobile && setIsNavHovered(false)}
                    onClick={() => isMobile && setIsNavHovered(!isNavHovered)}
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1100, // Higher than bottom nav
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'auto'
                    }}
                >
                    {/* Hover trigger area */}
                    <div
                        style={{
                            width: isNavHovered ? '0' : '20px',
                            height: '300px',
                            cursor: 'pointer'
                        }}
                    />

                    {/* Navigation panel */}
                    <div
                        style={{
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: isMobile ? '0 16px 16px 0' : '0 12px 12px 0',
                            padding: isMobile ? '16px 12px' : '12px 8px',
                            transform: isNavHovered ? 'translateX(0)' : 'translateX(-100%)',
                            opacity: isNavHovered ? 1 : 0,
                            transition: 'none',
                            maxHeight: '70vh',
                            overflowY: 'auto',
                            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
                            pointerEvents: isNavHovered ? 'auto' : 'none'
                        }}
                    >
                        <div style={{
                            fontSize: isMobile ? '0.8rem' : '0.7rem',
                            color: '#888',
                            marginBottom: isMobile ? '12px' : '8px',
                            paddingLeft: '4px',
                            fontWeight: 600
                        }}>
                            題號導覽
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                            gap: isMobile ? '8px' : '4px'
                        }}>
                            {exam.questions.map((q, index) => {
                                const isWrongQuestion = examSubmitted && wrongQuestionIds.includes(q.id);
                                const isCurrent = currentQuestion === index + 1;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => scrollToQuestion(index)}
                                        style={{
                                            width: isMobile ? '48px' : '28px',
                                            height: isMobile ? '48px' : '28px',
                                            borderRadius: isMobile ? '10px' : '6px',
                                            border: 'none',
                                            background: isWrongQuestion
                                                ? '#ef4444'
                                                : isCurrent
                                                    ? 'var(--accent-color)'
                                                    : 'rgba(255, 255, 255, 0.1)',
                                            color: isWrongQuestion || isCurrent
                                                ? 'white'
                                                : '#aaa',
                                            fontSize: isMobile ? '1rem' : '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isCurrent && !isWrongQuestion) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                                e.currentTarget.style.color = 'white';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isCurrent && !isWrongQuestion) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                e.currentTarget.style.color = '#aaa';
                                            }
                                        }}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>
                        {isMobile && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsNavHovered(false);
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                關閉導覽
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Collapsed indicator when not hovered */}
            {examStarted && (
                <div
                    onMouseEnter={() => !isMobile && setIsNavHovered(true)}
                    onClick={() => isMobile && setIsNavHovered(true)}
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1099,
                        background: 'rgba(30, 30, 30, 0.8)',
                        borderRadius: '0 8px 8px 0',
                        padding: '12px 6px',
                        cursor: 'pointer',
                        opacity: isNavHovered ? 0 : 1,
                        transition: 'none',
                        pointerEvents: isNavHovered ? 'none' : 'auto'
                    }}
                >
                    <div style={{
                        writingMode: 'vertical-rl',
                        fontSize: '0.75rem',
                        color: '#888',
                        fontWeight: 500
                    }}>
                        #{currentQuestion}
                    </div>
                </div>
            )}

            <div className={`exam-detail-container ${(selectedMode === 'exam' && examStarted && !examSubmitted) ? 'timer-active' : ''}`}>
                <div ref={headerRef} style={{ marginBottom: '2.5rem' }}>
                    <Link href={backPath} className="back-link">
                        <ArrowLeft size={16} /> 返回列表
                    </Link>
                    <div className="exam-header">
                        <h1 className="exam-title">{exam.title}</h1>
                    </div>
                    <p className="exam-count">
                        共 {exam.questions.length} 題
                    </p>

                    {/* Score (shown after submit) */}
                    {examSubmitted && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.5rem',
                            background: correctCount >= exam.questions.length * 0.6 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '1rem',
                            border: `2px solid ${correctCount >= exam.questions.length * 0.6 ? '#10b981' : '#ef4444'}`
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: correctCount >= exam.questions.length * 0.6 ? '#10b981' : '#ef4444',
                                marginBottom: '0.5rem'
                            }}>
                                成績：{correctCount} / {exam.questions.length} 分
                            </h2>
                            {wrongQuestionIds.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        答錯的題目：
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {exam.questions.map((q, idx) => {
                                            if (wrongQuestionIds.includes(q.id)) {
                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => scrollToQuestion(idx)}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '0.5rem',
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        第 {idx + 1} 題
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode Selection (shown before exam starts) */}
                    {!examStarted && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.5rem',
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '1rem',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                                選擇作答模式
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Exam Mode */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    background: selectedMode === 'exam' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.02)',
                                    border: selectedMode === 'exam' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                    onClick={() => setSelectedMode('exam')}
                                >
                                    <FileCheck size={20} color={selectedMode === 'exam' ? 'var(--accent-color)' : '#666'} />
                                    <span style={{ fontWeight: 600, color: selectedMode === 'exam' ? 'var(--accent-color)' : 'var(--text-main)' }}>
                                        正式上場
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>計時測驗，交卷後顯示成績</span>
                                    {selectedMode === 'exam' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                                            <Clock size={16} color="#666" />
                                            <input
                                                type="number"
                                                value={timerMinutes}
                                                onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    width: '60px',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '0.5rem',
                                                    border: '1px solid var(--glass-border)',
                                                    fontSize: '0.875rem',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.875rem', color: '#666' }}>分鐘</span>
                                        </div>
                                    )}
                                </div>

                                {/* Review Mode */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    background: selectedMode === 'review' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.02)',
                                    border: selectedMode === 'review' ? '2px solid #10b981' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                    onClick={() => setSelectedMode('review')}
                                >
                                    <BookOpen size={20} color={selectedMode === 'review' ? '#10b981' : '#666'} />
                                    <span style={{ fontWeight: 600, color: selectedMode === 'review' ? '#10b981' : 'var(--text-main)' }}>
                                        複習模式
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>不計時，每題答完即顯示詳解</span>
                                </div>

                                {/* Reading Mode */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    background: selectedMode === 'reading' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0,0,0,0.02)',
                                    border: selectedMode === 'reading' ? '2px solid #a855f7' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                    onClick={() => setSelectedMode('reading')}
                                >
                                    <Eye size={20} color={selectedMode === 'reading' ? '#a855f7' : '#666'} />
                                    <span style={{ fontWeight: 600, color: selectedMode === 'reading' ? '#a855f7' : 'var(--text-main)' }}>
                                        閱讀模式
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>直接展開所有詳解</span>
                                </div>
                            </div>

                            {/* Start Button */}
                            {selectedMode && (
                                <button
                                    onClick={handleStartExam}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '0.75rem',
                                        background: selectedMode === 'exam' ? 'var(--accent-color)' : selectedMode === 'review' ? '#10b981' : '#a855f7',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Play size={18} />
                                    {selectedMode === 'exam' ? '開始作答' : selectedMode === 'review' ? '開始複習' : '開始閱讀'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Timer Display (for exam mode) */}
                    {selectedMode === 'exam' && examStarted && !examSubmitted && (
                        <div style={isMobile ? {
                            // Mobile: Overlay on top of Navbar
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '50px', // Match navbar height (0.75rem padding * 2 + 24px icon + border ~= 49-50px)
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderBottom: '1px solid var(--glass-border)',
                            zIndex: 1200, // Higher than Navbar (1000) and everything else
                            color: timeRemaining < 300 ? '#ef4444' : 'var(--primary-color)',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            gap: '0.5rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            animation: 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        } : {
                            // Desktop: Integrated into Navbar
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            padding: '0 2rem',
                            height: '58px', // Match approximate Navbar height
                            background: 'transparent',
                            color: timeRemaining < 300 ? '#ef4444' : 'var(--text-main)',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            zIndex: 1100, // Top of Navbar
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            pointerEvents: 'none' // Let clicks pass through if needed (though it's on the side)
                        }}>
                            <Clock size={isMobile ? 22 : 18} />
                            {formatTime(timeRemaining)}
                        </div>
                    )}
                </div>

                {/* Questions (only show after exam starts) */}
                {examStarted && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {exam.questions.map((q, index) => (
                            <div
                                key={q.id}
                                ref={(el) => { questionRefs.current[index] = el; }}
                                id={`question-${index + 1}`}
                            >
                                <div style={{
                                    marginBottom: '1rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: examSubmitted && wrongQuestionIds.includes(q.id) ? '#ef4444' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>第 {index + 1} 題</span>
                                    {examSubmitted && wrongQuestionIds.includes(q.id) && (
                                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>✗ 答錯</span>
                                    )}
                                </div>
                                <QuestionCard
                                    question={q}
                                    mode={selectedMode}
                                    examSubmitted={examSubmitted}
                                    forceShowAnswer={selectedMode === 'reading'}
                                    isWrong={examSubmitted && wrongQuestionIds.includes(q.id)}
                                    onAnswerChange={handleAnswerChange}
                                />
                            </div>
                        ))}

                        {/* Submit Button (for exam and review modes) */}
                        {(selectedMode === 'exam' || selectedMode === 'review') && !examSubmitted && (
                            <div style={{
                                marginTop: '2rem',
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.8)',
                                borderRadius: '1rem',
                                textAlign: 'center',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                    已作答 {Object.keys(answers).length} / {exam.questions.length} 題
                                </p>
                                <button
                                    onClick={handleSubmit}
                                    style={{
                                        padding: '1rem 3rem',
                                        borderRadius: '0.75rem',
                                        background: selectedMode === 'exam' ? '#ef4444' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '1.125rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    交卷
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
