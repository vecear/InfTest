"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getExams,
    createExam,
    deleteExam,
    Exam
} from "@/lib/firestore-client";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    BookOpen,
    PenTool,
    Database,
    Shield,
    AlertCircle
} from "lucide-react";

const CATEGORIES = [
    { value: "WRITTEN", label: "歷屆筆試", icon: BookOpen },
    { value: "PRACTICAL", label: "歷屆實務", icon: PenTool },
    { value: "OTHER", label: "其他題目", icon: Database },
];

const TEMPLATES = [
    { value: "DEFAULT", label: "預設樣式" },
    { value: "WRITTEN_WITH_IMAGES", label: "歷屆筆試含圖" },
];

export default function AdminPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();

    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewExamModal, setShowNewExamModal] = useState(false);
    const [newExam, setNewExam] = useState({ title: "", year: new Date().getFullYear(), category: "WRITTEN", template: "DEFAULT" });
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
                return;
            }
            if (!isAdmin) {
                router.push("/");
                return;
            }
            fetchExams();
        }
    }, [user, authLoading, isAdmin, router]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const allExams = await getExams();
            setExams(allExams);
        } catch (error) {
            console.error("Error fetching exams:", error);
            setMessage({ type: 'error', text: '載入試卷失敗' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = async () => {
        if (!newExam.title.trim()) {
            setMessage({ type: 'error', text: '請輸入試卷名稱' });
            return;
        }

        try {
            setCreating(true);
            const examId = await createExam({
                title: newExam.title,
                year: newExam.year,
                category: newExam.category
            });
            setMessage({ type: 'success', text: '試卷建立成功' });
            setShowNewExamModal(false);
            setNewExam({ title: "", year: new Date().getFullYear(), category: "WRITTEN", template: "DEFAULT" });
            // Navigate to edit the new exam
            router.push(`/admin/exam/edit/?id=${examId}`);
        } catch (error) {
            console.error("Error creating exam:", error);
            setMessage({ type: 'error', text: '建立試卷失敗' });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteExam = async (examId: string, examTitle: string) => {
        if (!confirm(`確定要刪除「${examTitle}」嗎？此操作無法復原，所有相關題目也會被刪除。`)) {
            return;
        }

        try {
            setDeleting(examId);
            await deleteExam(examId);
            setExams(exams.filter(e => e.id !== examId));
            setMessage({ type: 'success', text: '試卷已刪除' });
        } catch (error) {
            console.error("Error deleting exam:", error);
            setMessage({ type: 'error', text: '刪除失敗' });
        } finally {
            setDeleting(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="profile-container loading-wrapper">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-muted)' }}>載入中...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="profile-container">
            <Link href="/" className="back-link">
                <ArrowLeft size={16} /> 返回首頁
            </Link>

            {message && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: message.type === 'success' ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {message.type === 'error' && <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={28} color="var(--accent-color)" />
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>管理後台</h1>
                    </div>
                    <button
                        onClick={() => setShowNewExamModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--accent-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        <Plus size={18} /> 新增試卷
                    </button>
                </div>
            </div>

            {/* Exam List by Category */}
            {CATEGORIES.map(category => {
                const categoryExams = exams.filter(e => e.category === category.value);
                const Icon = category.icon;

                return (
                    <div key={category.value} style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1.1rem',
                            color: 'var(--text-primary)',
                            marginBottom: '1rem'
                        }}>
                            <Icon size={20} color="var(--accent-color)" />
                            {category.label}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                ({categoryExams.length})
                            </span>
                        </h2>

                        {categoryExams.length > 0 ? (
                            <div className="premium-card" style={{ overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>試卷名稱</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', width: '80px' }}>年份</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', width: '80px' }}>題數</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', width: '160px' }}>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryExams.map(exam => (
                                            <tr key={exam.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{exam.title}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{exam.year}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{exam._count?.questions || 0}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <Link
                                                            href={`/admin/exam/edit/?id=${exam.id}`}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem',
                                                                padding: '0.4rem 0.75rem',
                                                                background: '#f0f9ff',
                                                                color: '#0284c7',
                                                                borderRadius: '0.375rem',
                                                                fontSize: '0.8rem',
                                                                textDecoration: 'none',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <Edit size={14} /> 編輯
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                                                            disabled={deleting === exam.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem',
                                                                padding: '0.4rem 0.75rem',
                                                                background: '#fef2f2',
                                                                color: '#dc2626',
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                fontSize: '0.8rem',
                                                                cursor: deleting === exam.id ? 'not-allowed' : 'pointer',
                                                                opacity: deleting === exam.id ? 0.6 : 1,
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <Trash2 size={14} /> {deleting === exam.id ? '刪除中...' : '刪除'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="premium-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                尚無試卷
                            </div>
                        )}
                    </div>
                );
            })}

            {/* New Exam Modal */}
            {
                showNewExamModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}>
                        <div className="premium-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
                            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>新增試卷</h2>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                    試卷名稱
                                </label>
                                <input
                                    type="text"
                                    value={newExam.title}
                                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                                    placeholder="例：113年第一次醫師國考"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                    年份
                                </label>
                                <input
                                    type="number"
                                    value={newExam.year}
                                    onChange={(e) => setNewExam({ ...newExam, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                    分類
                                </label>
                                <select
                                    value={newExam.category}
                                    onChange={(e) => setNewExam({ ...newExam, category: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box',
                                        background: 'white'
                                    }}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                    模板
                                </label>
                                <select
                                    value={newExam.template}
                                    onChange={(e) => setNewExam({ ...newExam, template: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box',
                                        background: 'white'
                                    }}
                                >
                                    {TEMPLATES.map(tmpl => (
                                        <option key={tmpl.value} value={tmpl.value}>{tmpl.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowNewExamModal(false)}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleCreateExam}
                                    disabled={creating}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: creating ? 'not-allowed' : 'pointer',
                                        fontWeight: 500,
                                        opacity: creating ? 0.7 : 1
                                    }}
                                >
                                    {creating ? '建立中...' : '建立'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
