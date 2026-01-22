"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getExamById,
    getQuestionsByExamId,
    updateExam,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    Exam,
    Question
} from "@/lib/firestore-client";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    Check
} from "lucide-react";

const CATEGORIES = [
    { value: "WRITTEN", label: "歷屆筆試" },
    { value: "PRACTICAL", label: "歷屆實務" },
    { value: "OTHER", label: "其他題目" },
];

const QUESTION_TYPES = [
    { value: "CHOICE", label: "選擇題" },
    { value: "FILL", label: "填空題" },
];

interface QuestionFormData {
    content: string;
    type: string;
    options: { text: string; order: number }[];
    correctAnswer: string;
    answerExplanation: string;
    imageUrl: string;
}

const emptyQuestion: QuestionFormData = {
    content: "",
    type: "CHOICE",
    options: [
        { text: "", order: 0 },
        { text: "", order: 1 },
        { text: "", order: 2 },
        { text: "", order: 3 },
    ],
    correctAnswer: "",
    answerExplanation: "",
    imageUrl: "",
};

export default function ExamEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: examId } = use(params);
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();

    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Exam editing
    const [editingExam, setEditingExam] = useState(false);
    const [examForm, setExamForm] = useState({ title: "", year: 0, category: "" });

    // Question editing
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [showNewQuestion, setShowNewQuestion] = useState(false);
    const [questionForm, setQuestionForm] = useState<QuestionFormData>(emptyQuestion);

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
            fetchData();
        }
    }, [user, authLoading, isAdmin, router, examId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [examData, questionsData] = await Promise.all([
                getExamById(examId),
                getQuestionsByExamId(examId)
            ]);

            if (!examData) {
                setMessage({ type: 'error', text: '找不到此試卷' });
                return;
            }

            setExam(examData);
            setExamForm({ title: examData.title, year: examData.year, category: examData.category });
            setQuestions(questionsData.sort((a, b) => a.order - b.order));
        } catch (error) {
            console.error("Error fetching data:", error);
            setMessage({ type: 'error', text: '載入失敗' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExam = async () => {
        if (!examForm.title.trim()) {
            setMessage({ type: 'error', text: '請輸入試卷名稱' });
            return;
        }

        try {
            setSaving(true);
            await updateExam(examId, {
                title: examForm.title,
                year: examForm.year,
                category: examForm.category
            });
            setExam({ ...exam!, ...examForm });
            setEditingExam(false);
            setMessage({ type: 'success', text: '試卷資訊已更新' });
        } catch (error) {
            console.error("Error updating exam:", error);
            setMessage({ type: 'error', text: '更新失敗' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveQuestion = async (isNew: boolean) => {
        if (!questionForm.content.trim()) {
            setMessage({ type: 'error', text: '請輸入題目內容' });
            return;
        }

        try {
            setSaving(true);

            const questionData = {
                examId,
                content: questionForm.content,
                type: questionForm.type,
                options: questionForm.type === "CHOICE" ? questionForm.options : [],
                correctAnswer: questionForm.correctAnswer,
                answerExplanation: questionForm.answerExplanation,
                imageUrl: questionForm.imageUrl || null,
                order: isNew ? questions.length : (questions.find(q => q.id === editingQuestionId)?.order || 0)
            };

            if (isNew) {
                const newId = await createQuestion(questionData);
                const newQuestion: Question = {
                    id: newId,
                    ...questionData,
                    ocrText: null
                };
                setQuestions([...questions, newQuestion]);
                setShowNewQuestion(false);
            } else if (editingQuestionId) {
                await updateQuestion(editingQuestionId, questionData);
                setQuestions(questions.map(q =>
                    q.id === editingQuestionId ? { ...q, ...questionData } : q
                ));
                setEditingQuestionId(null);
            }

            setQuestionForm(emptyQuestion);
            setMessage({ type: 'success', text: isNew ? '題目已新增' : '題目已更新' });
        } catch (error) {
            console.error("Error saving question:", error);
            setMessage({ type: 'error', text: '儲存失敗' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('確定要刪除此題目嗎？')) return;

        try {
            setSaving(true);
            await deleteQuestion(questionId);
            setQuestions(questions.filter(q => q.id !== questionId));
            setMessage({ type: 'success', text: '題目已刪除' });
        } catch (error) {
            console.error("Error deleting question:", error);
            setMessage({ type: 'error', text: '刪除失敗' });
        } finally {
            setSaving(false);
        }
    };

    const startEditQuestion = (question: Question) => {
        setEditingQuestionId(question.id);
        setShowNewQuestion(false);
        setQuestionForm({
            content: question.content,
            type: question.type,
            options: question.options.length > 0 ? question.options : emptyQuestion.options,
            correctAnswer: question.correctAnswer || "",
            answerExplanation: question.answerExplanation || "",
            imageUrl: question.imageUrl || "",
        });
    };

    const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
        const index = questions.findIndex(q => q.id === questionId);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
            return;
        }

        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

        // Update orders
        const updates = newQuestions.map((q, i) => ({ ...q, order: i }));
        setQuestions(updates);

        // Save to database
        try {
            await Promise.all([
                updateQuestion(newQuestions[index].id, { order: index }),
                updateQuestion(newQuestions[targetIndex].id, { order: targetIndex })
            ]);
        } catch (error) {
            console.error("Error reordering:", error);
            fetchData(); // Reload on error
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

    if (!isAdmin || !exam) {
        return null;
    }

    return (
        <div className="profile-container">
            <Link href="/admin" className="back-link">
                <ArrowLeft size={16} /> 返回管理後台
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
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {/* Exam Info Card */}
            <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                {editingExam ? (
                    <div>
                        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>編輯試卷資訊</h2>
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                    試卷名稱
                                </label>
                                <input
                                    type="text"
                                    value={examForm.title}
                                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                        年份
                                    </label>
                                    <input
                                        type="number"
                                        value={examForm.year}
                                        onChange={(e) => setExamForm({ ...examForm, year: parseInt(e.target.value) || 0 })}
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
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                        分類
                                    </label>
                                    <select
                                        value={examForm.category}
                                        onChange={(e) => setExamForm({ ...examForm, category: e.target.value })}
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
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleSaveExam}
                                disabled={saving}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                <Save size={16} /> 儲存
                            </button>
                            <button
                                onClick={() => {
                                    setEditingExam(false);
                                    setExamForm({ title: exam.title, year: exam.year, category: exam.category });
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                <X size={16} /> 取消
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem' }}>{exam.title}</h1>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <span>{exam.year} 年</span>
                                <span>{CATEGORIES.find(c => c.value === exam.category)?.label}</span>
                                <span>{questions.length} 題</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditingExam(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            <Edit size={16} /> 編輯資訊
                        </button>
                    </div>
                )}
            </div>

            {/* Questions Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>題目列表</h2>
                <button
                    onClick={() => {
                        setShowNewQuestion(true);
                        setEditingQuestionId(null);
                        setQuestionForm(emptyQuestion);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.9rem'
                    }}
                >
                    <Plus size={16} /> 新增題目
                </button>
            </div>

            {/* New Question Form */}
            {showNewQuestion && (
                <QuestionForm
                    form={questionForm}
                    setForm={setQuestionForm}
                    onSave={() => handleSaveQuestion(true)}
                    onCancel={() => {
                        setShowNewQuestion(false);
                        setQuestionForm(emptyQuestion);
                    }}
                    saving={saving}
                    isNew={true}
                />
            )}

            {/* Question List */}
            {questions.map((question, index) => (
                <div key={question.id} className="premium-card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                    {editingQuestionId === question.id ? (
                        <QuestionForm
                            form={questionForm}
                            setForm={setQuestionForm}
                            onSave={() => handleSaveQuestion(false)}
                            onCancel={() => {
                                setEditingQuestionId(null);
                                setQuestionForm(emptyQuestion);
                            }}
                            saving={saving}
                            isNew={false}
                        />
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {/* Order Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <button
                                    onClick={() => moveQuestion(question.id, 'up')}
                                    disabled={index === 0}
                                    style={{
                                        padding: '0.25rem',
                                        background: index === 0 ? '#f1f5f9' : '#e0f2fe',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                                        opacity: index === 0 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <div style={{
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    padding: '0.25rem 0'
                                }}>
                                    {index + 1}
                                </div>
                                <button
                                    onClick={() => moveQuestion(question.id, 'down')}
                                    disabled={index === questions.length - 1}
                                    style={{
                                        padding: '0.25rem',
                                        background: index === questions.length - 1 ? '#f1f5f9' : '#e0f2fe',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: index === questions.length - 1 ? 'not-allowed' : 'pointer',
                                        opacity: index === questions.length - 1 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* Question Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.2rem 0.5rem',
                                        background: question.type === 'CHOICE' ? '#dbeafe' : '#fef3c7',
                                        color: question.type === 'CHOICE' ? '#1e40af' : '#92400e',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        marginRight: '0.5rem'
                                    }}>
                                        {question.type === 'CHOICE' ? '選擇題' : '填空題'}
                                    </span>
                                    {question.correctAnswer && (
                                        <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 500 }}>
                                            答案: {question.correctAnswer}
                                        </span>
                                    )}
                                </div>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {question.content.length > 150
                                        ? question.content.substring(0, 150) + '...'
                                        : question.content}
                                </p>
                                {question.imageUrl && (
                                    <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        [含圖片]
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button
                                    onClick={() => startEditQuestion(question)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.4rem 0.75rem',
                                        background: '#f0f9ff',
                                        color: '#0284c7',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Edit size={14} /> 編輯
                                </button>
                                <button
                                    onClick={() => handleDeleteQuestion(question.id)}
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={14} /> 刪除
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {questions.length === 0 && !showNewQuestion && (
                <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    尚無題目，點擊上方「新增題目」開始建立
                </div>
            )}
        </div>
    );
}

// Question Form Component
function QuestionForm({
    form,
    setForm,
    onSave,
    onCancel,
    saving,
    isNew
}: {
    form: QuestionFormData;
    setForm: (form: QuestionFormData) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    isNew: boolean;
}) {
    const updateOption = (index: number, text: string) => {
        const newOptions = [...form.options];
        newOptions[index] = { ...newOptions[index], text };
        setForm({ ...form, options: newOptions });
    };

    const addOption = () => {
        if (form.options.length >= 5) return;
        setForm({
            ...form,
            options: [...form.options, { text: "", order: form.options.length }]
        });
    };

    const removeOption = (index: number) => {
        if (form.options.length <= 2) return;
        const newOptions = form.options.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, order: i }));
        setForm({ ...form, options: newOptions });
    };

    return (
        <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '2px solid var(--accent-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>
                {isNew ? '新增題目' : '編輯題目'}
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Question Type */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        題目類型
                    </label>
                    <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            background: 'white'
                        }}
                    >
                        {QUESTION_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                {/* Question Content */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        題目內容 *
                    </label>
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        rows={4}
                        placeholder="輸入題目內容..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.95rem',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* Image URL */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        圖片網址 (選填)
                    </label>
                    <input
                        type="text"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        placeholder="https://..."
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

                {/* Options (for CHOICE type) */}
                {form.type === "CHOICE" && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                            選項
                        </label>
                        {form.options.map((option, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '38px',
                                    background: '#f1f5f9',
                                    borderRadius: '0.375rem',
                                    fontWeight: 600,
                                    color: 'var(--text-muted)'
                                }}>
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`選項 ${String.fromCharCode(65 + index)}`}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                {form.options.length > 2 && (
                                    <button
                                        onClick={() => removeOption(index)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#fef2f2',
                                            color: '#dc2626',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {form.options.length < 5 && (
                            <button
                                onClick={addOption}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.75rem',
                                    background: '#f0fdf4',
                                    color: '#16a34a',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={14} /> 新增選項
                            </button>
                        )}
                    </div>
                )}

                {/* Correct Answer */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        正確答案
                    </label>
                    {form.type === "CHOICE" ? (
                        <select
                            value={form.correctAnswer}
                            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9rem',
                                background: 'white'
                            }}
                        >
                            <option value="">選擇答案</option>
                            {form.options.map((_, index) => (
                                <option key={index} value={String.fromCharCode(65 + index)}>
                                    {String.fromCharCode(65 + index)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={form.correctAnswer}
                            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                            placeholder="輸入正確答案"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    )}
                </div>

                {/* Answer Explanation */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        答案解析 (選填)
                    </label>
                    <textarea
                        value={form.answerExplanation}
                        onChange={(e) => setForm({ ...form, answerExplanation: e.target.value })}
                        rows={3}
                        placeholder="輸入解析說明..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.95rem',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                    onClick={onSave}
                    disabled={saving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    <Save size={16} /> {saving ? '儲存中...' : '儲存'}
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    <X size={16} /> 取消
                </button>
            </div>
        </div>
    );
}
