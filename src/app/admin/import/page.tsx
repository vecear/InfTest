"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createExam, createQuestion } from "@/lib/firestore-client";
import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle, CheckCircle } from "lucide-react";

interface QuestionData {
    order: number;
    content: string;
    type: string;
    imageUrl: string;
    imageUrls: string[];
    options: { text: string; order: number }[];
    correctAnswer: string;
    answerExplanation: string;
}

interface ExamData {
    title: string;
    year: number;
    category: string;
    questions: QuestionData[];
}

export default function ImportPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, exam: "" });

    if (authLoading) {
        return (
            <div className="profile-container loading-wrapper">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-muted)' }}>載入中...</p>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        router.push('/');
        return null;
    }

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            setMessage(null);

            const text = await file.text();
            const examData: ExamData = JSON.parse(text);

            setProgress({ current: 0, total: examData.questions.length, exam: examData.title });

            // Create exam
            const examId = await createExam({
                title: examData.title,
                year: examData.year,
                category: examData.category
            });

            // Create questions
            for (let i = 0; i < examData.questions.length; i++) {
                const question = examData.questions[i];
                await createQuestion({
                    examId,
                    content: question.content,
                    type: question.type,
                    imageUrl: question.imageUrl || null,
                    imageUrls: question.imageUrls || [],
                    options: question.options || [],
                    correctAnswer: question.correctAnswer || null,
                    answerExplanation: question.answerExplanation || null,
                    order: question.order,
                    ocrText: null
                });

                setProgress({ current: i + 1, total: examData.questions.length, exam: examData.title });
            }

            setMessage({ type: 'success', text: `成功匯入 ${examData.title}，共 ${examData.questions.length} 題` });
            setProgress({ current: 0, total: 0, exam: "" });
        } catch (error: any) {
            console.error('Import error:', error);
            setMessage({ type: 'error', text: `匯入失敗: ${error.message}` });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="profile-container">
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--accent-color)',
                    textDecoration: 'none'
                }}>
                    <ArrowLeft size={20} />
                    返回管理頁面
                </Link>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>批量匯入試卷</h1>

            <div className="premium-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>單一檔案匯入</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    選擇一個 JSON 檔案來匯入試卷資料
                </p>

                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    disabled={importing}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '2px dashed var(--glass-border)',
                        width: '100%',
                        cursor: importing ? 'not-allowed' : 'pointer'
                    }}
                />
            </div>

            {progress.total > 0 && (
                <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                        正在匯入: {progress.exam}
                    </h3>
                    <div style={{
                        marginBottom: '0.5rem',
                        background: '#e2e8f0',
                        height: '8px',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${(progress.current / progress.total) * 100}%`,
                            height: '100%',
                            background: 'var(--accent-color)',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {progress.current} / {progress.total} 題
                    </p>
                </div>
            )}

            {message && (
                <div className="premium-card" style={{
                    padding: '1rem 1.5rem',
                    marginBottom: '1.5rem',
                    background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {message.type === 'success' ? (
                            <CheckCircle size={20} color="#10b981" />
                        ) : (
                            <AlertCircle size={20} color="#ef4444" />
                        )}
                        <span style={{ color: message.type === 'success' ? '#166534' : '#991b1b' }}>
                            {message.text}
                        </span>
                    </div>
                </div>
            )}

            <div className="premium-card" style={{ padding: '1.5rem', background: '#fef3c7' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#92400e' }}>
                    注意事項
                </h3>
                <ul style={{ color: '#92400e', fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                    <li>匯入前請確保 JSON 檔案格式正確</li>
                    <li>大量資料匯入可能需要一些時間，請勿關閉頁面</li>
                    <li>建議先使用單一檔案匯入測試，確認無誤後再批量匯入</li>
                    <li>匯入的圖片路徑必須正確，並且圖片已上傳至 public 目錄</li>
                </ul>
            </div>
        </div>
    );
}
