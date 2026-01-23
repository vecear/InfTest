"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    getUserScoreHistory,
    updateUserProfile,
    getUserProfile,
    deleteUserScore,
    UserScore,
} from "@/lib/firestore-client";
import {
    Edit3,
    Save,
    X,
    Clock,
    ArrowLeft,
    BookOpen,
    Key,
    Mail,
    Check,
    AlertCircle,
    Globe,
    LogOut,
    ChevronDown,
    ChevronUp,
    Trash2
} from "lucide-react";
import Link from "next/link";
import {
    updateProfile,
    GoogleAuthProvider,
    linkWithPopup,
    updatePassword,
    updateEmail,
    EmailAuthProvider,
    linkWithCredential,
    reauthenticateWithCredential,
    User
} from "firebase/auth";
import { auth } from "@/firebase";

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [scores, setScores] = useState<UserScore[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        examsCompleted: 0
    });

    // Helper function to format dates consistently
    const formatDate = (dateStr: string) => {
        if (!isMounted) return ''; // Prevent hydration mismatch
        return new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatDateTime = (dateStr: string) => {
        if (!isMounted) return ''; // Prevent hydration mismatch
        return new Date(dateStr).toLocaleString('zh-TW');
    };

    // History expansion state
    const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

    // Account Settings State
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLinking, setIsLinking] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [activePopover, setActivePopover] = useState<'email' | 'password' | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [authProviders, setAuthProviders] = useState<string[]>([]);

    useEffect(() => {
        setIsMounted(true);
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            setDisplayName(user.displayName || user.email?.split("@")[0] || "User");
            fetchUserData();
            updateProviderStatus(user);
        }
    }, [user, authLoading, router]);

    const updateProviderStatus = (user: User) => {
        const providers = user.providerData.map(p => p.providerId);
        setAuthProviders(providers);
    };

    const fetchUserData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [history, profile] = await Promise.all([
                getUserScoreHistory(user.uid),
                getUserProfile(user.uid)
            ]);

            if (profile?.displayName) {
                setDisplayName(profile.displayName);
            }

            setScores(history);
            calculateStats(history);
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (history: UserScore[]) => {
        if (history.length === 0) {
            setStats({
                totalAttempts: 0,
                averageScore: 0,
                bestScore: 0,
                examsCompleted: 0
            });
            return;
        }

        const total = history.length;
        const sum = history.reduce((acc, curr) => acc + curr.score, 0);
        const best = Math.max(...history.map(s => s.score));
        const uniqueExams = new Set(history.map(s => s.examId)).size;

        setStats({
            totalAttempts: total,
            averageScore: Math.round(sum / total),
            bestScore: best,
            examsCompleted: uniqueExams
        });
    };

    const handleSaveProfile = async () => {
        if (!user || saving) return;

        try {
            setSaving(true);

            // Update Firebase Auth profile
            await updateProfile(user, { displayName });

            // Update Firestore profile
            await updateUserProfile({
                uid: user.uid,
                displayName: displayName,
                email: user.email || "",
                photoURL: user.photoURL || undefined,
                updatedAt: new Date().toISOString()
            });

            setIsEditing(false);
            setMessage({ type: 'success', text: "個人資料已更新" });
        } catch (error: any) {
            console.error("Profile Save Detailed Error:", error);
            setMessage({ type: 'error', text: `儲存失敗: ${error.message || "未知錯誤"}` });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleLinkGoogle = async () => {
        if (!user) return;
        setIsLinking(true);
        try {
            const provider = new GoogleAuthProvider();
            await linkWithPopup(user, provider);
            updateProviderStatus(auth.currentUser!); // Refresh user data
            setMessage({ type: 'success', text: "成功連結 Google 帳號" });
        } catch (error: any) {
            console.error("Link Google Error:", error);
            setMessage({ type: 'error', text: `無法連結 Google 帳號: ${error.message}` });
        } finally {
            setIsLinking(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleUpdateEmail = async () => {
        if (!user || !newEmail) return;
        setIsLinking(true);
        try {
            await updateEmail(user, newEmail);
            // Also update Firestore
            await updateUserProfile({
                uid: user.uid,
                email: newEmail,
                displayName: user.displayName || displayName,
                photoURL: user.photoURL || undefined,
                updatedAt: new Date().toISOString()
            });
            setActivePopover(null);
            setMessage({ type: 'success', text: "Email 更新成功，請檢查收件匣驗證新信箱" });
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                setMessage({ type: 'error', text: "為了安全，請重新登入後再試。" });
            } else {
                setMessage({ type: 'error', text: `更新失敗: ${error.message}` });
            }
        } finally {
            setIsLinking(false);
            setNewEmail("");
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handlePasswordAction = async () => {
        if (!user || !newPassword) return;
        setIsLinking(true);
        try {
            if (authProviders.includes('password')) {
                if (!currentPassword) {
                    setMessage({ type: 'error', text: "請輸入目前密碼以驗證身分" });
                    setIsLinking(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(user.email!, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                setMessage({ type: 'success', text: "密碼已變更" });
            } else {
                const credential = EmailAuthProvider.credential(user.email!, newPassword);
                await linkWithCredential(user, credential);
                setMessage({ type: 'success', text: "密碼已設定，現在可以使用 Email登入" });
            }
            setActivePopover(null);
            setCurrentPassword("");
            setNewPassword("");
            updateProviderStatus(auth.currentUser!);
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                setMessage({ type: 'error', text: "為了安全，請重新登入後再試。" });
            } else if (error.code === 'auth/wrong-password') {
                setMessage({ type: 'error', text: "目前密碼錯誤" });
            } else {
                setMessage({ type: 'error', text: `操作失敗: ${error.message}` });
            }
        } finally {
            setIsLinking(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteScore = async (scoreId: string) => {
        if (!window.confirm("確定要刪除這筆作答紀錄嗎？此動作無法復原。")) return;

        try {
            await deleteUserScore(scoreId);
            const newScores = scores.filter(s => s.id !== scoreId);
            setScores(newScores);
            calculateStats(newScores);
            setMessage({ type: 'success', text: "紀錄已刪除" });
        } catch (error: any) {
            console.error("Delete score error:", error);
            setMessage({ type: 'error', text: "刪除失敗" });
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (!isMounted) return null;

    if (authLoading || (loading && !scores.length)) {
        return (
            <div className="profile-container loading-wrapper" suppressHydrationWarning>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-muted)' }}>載入中...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const hasGoogle = authProviders.includes('google.com');
    const hasPassword = authProviders.includes('password');

    return (
        <div className="profile-container" suppressHydrationWarning>
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
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="premium-card profile-main-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', overflow: 'visible', position: 'relative', zIndex: 20 }} suppressHydrationWarning>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="profile-avatar-large" style={{ width: '70px', height: '70px', minWidth: '70px' }} />
                    ) : (
                        <div className="profile-avatar-large" style={{ width: '70px', height: '70px', minWidth: '70px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Info & Actions */}
                    <div className="profile-info" style={{ gap: '0.25rem', flex: 1, minWidth: '280px' }}>
                        <div className="profile-name-row" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="profile-name-input"
                                        autoFocus
                                        style={{ fontSize: '1.25rem', padding: '0.25rem 0.5rem' }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                                    />
                                    <button onClick={handleSaveProfile} disabled={saving} className="refresh-button" style={{ color: '#10b981' }} title="儲存">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => { setIsEditing(false); fetchUserData(); }} className="refresh-button" style={{ color: '#ef4444' }} title="取消">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h1 className="profile-name-input" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.35rem', margin: 0 }} onClick={() => setIsEditing(true)}>
                                        {displayName}
                                    </h1>
                                    <button onClick={() => setIsEditing(true)} className="refresh-button" title="編輯名稱">
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("確定要登出嗎？")) {
                                                try {
                                                    await auth.signOut();
                                                    router.push("/login");
                                                } catch (error) {
                                                    console.error("Error signing out:", error);
                                                }
                                            }
                                        }}
                                        className="refresh-button"
                                        title="登出"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Separator */}
                            <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }}></div>

                            {/* Action Buttons Row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {/* Google Button */}
                                {hasGoogle ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f0fdf4', borderRadius: '20px', fontSize: '0.75rem', color: '#15803d', border: '1px solid #bbf7d0' }} title="Google 帳號已連結">
                                        <Globe size={12} /> <span style={{ fontWeight: 600 }}>Google 已連結</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLinkGoogle}
                                        disabled={isLinking}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'white', borderRadius: '20px', fontSize: '0.75rem', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <Globe size={12} /> 連結 Google
                                    </button>
                                )}

                                {/* Email Button */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setActivePopover(activePopover === 'email' ? null : 'email')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'white', borderRadius: '20px', fontSize: '0.75rem', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <Mail size={12} /> {activePopover === 'email' ? '取消' : '變更 Email'}
                                    </button>

                                    {activePopover === 'email' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            transform: 'translateY(8px)',
                                            background: 'white',
                                            padding: '1rem',
                                            borderRadius: '0.6rem',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                            border: '1px solid #e2e8f0',
                                            zIndex: 100,
                                            width: '280px'
                                        }}>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>目前: {user.email}</p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="email"
                                                    placeholder="新 Email"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    style={{ flex: 1, padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                />
                                                <button
                                                    onClick={handleUpdateEmail}
                                                    disabled={isLinking || !newEmail}
                                                    style={{ padding: '0.4rem 0.75rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                                >
                                                    更新
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Password Button */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setActivePopover(activePopover === 'password' ? null : 'password')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'white', borderRadius: '20px', fontSize: '0.75rem', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <Key size={12} /> {activePopover === 'password' ? '取消' : (hasPassword ? '變更密碼' : '設定密碼')}
                                    </button>

                                    {activePopover === 'password' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            transform: 'translateY(8px)',
                                            background: 'white',
                                            padding: '1rem',
                                            borderRadius: '0.6rem',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                            border: '1px solid #e2e8f0',
                                            zIndex: 100,
                                            width: '280px'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {hasPassword && (
                                                    <input
                                                        type="password"
                                                        placeholder="目前密碼"
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                    />
                                                )}
                                                <input
                                                    type="password"
                                                    placeholder={hasPassword ? "新密碼" : "設定新密碼"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                />
                                                <button
                                                    onClick={handlePasswordAction}
                                                    disabled={isLinking || !newPassword}
                                                    style={{ padding: '0.4rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                                                >
                                                    {hasPassword ? "確認變更" : "確認設定"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="profile-email" style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="stats-grid" suppressHydrationWarning>
                <div className="premium-card stat-card">
                    <span className="stat-value">{stats.totalAttempts}</span>
                    <span className="stat-label">總作答次數</span>
                </div>
                <div className="premium-card stat-card">
                    <span className="stat-value">{stats.averageScore}%</span>
                    <span className="stat-label">平均正確率</span>
                </div>
                <div className="premium-card stat-card">
                    <span className="stat-value">{stats.bestScore}%</span>
                    <span className="stat-label">最佳成績</span>
                </div>
                <div className="premium-card stat-card">
                    <span className="stat-value">{stats.examsCompleted}</span>
                    <span className="stat-label">已完成試卷</span>
                </div>
            </div>

            <section className="history-section" suppressHydrationWarning>
                <h2 className="history-title">
                    <Clock size={24} color="var(--accent-color)" />
                    試題得分紀錄
                </h2>

                {scores.length > 0 ? (
                    <>
                        <div className="premium-card history-table-container" suppressHydrationWarning>
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>試卷名稱</th>
                                        <th>作答次數</th>
                                        <th>平均正確率</th>
                                        <th>最佳正確率</th>
                                        <th>最後作答</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(scores.reduce((acc, score) => {
                                        if (!acc[score.examId]) {
                                            acc[score.examId] = {
                                                id: score.examId,
                                                title: score.examTitle,
                                                count: 0,
                                                totalScore: 0,
                                                bestScore: 0,
                                                lastDate: score.createdAt,
                                                records: []
                                            };
                                        }
                                        acc[score.examId].count += 1;
                                        acc[score.examId].totalScore += score.score;
                                        acc[score.examId].bestScore = Math.max(acc[score.examId].bestScore, score.score);
                                        // Store individual scores
                                        acc[score.examId].records.push(score);

                                        if (new Date(score.createdAt as string) > new Date(acc[score.examId].lastDate as string)) {
                                            acc[score.examId].lastDate = score.createdAt;
                                        }
                                        return acc;
                                    }, {} as any)).map((group: any) => {
                                        const avgScore = Math.round(group.totalScore / group.count);
                                        const isExpanded = expandedExamId === group.id;

                                        return (
                                            <React.Fragment key={group.id}>
                                                <tr
                                                    onClick={() => setExpandedExamId(isExpanded ? null : group.id)}
                                                    style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : undefined }}
                                                >
                                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{group.title}</td>
                                                    <td style={{ textAlign: 'center' }}>{group.count} 次</td>
                                                    <td>
                                                        <span className={`score-badge ${avgScore >= 80 ? 'score-high' : avgScore >= 60 ? 'score-medium' : 'score-low'}`}>
                                                            {avgScore}%
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{group.bestScore}%</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} suppressHydrationWarning>
                                                        {formatDate(group.lastDate as string)}
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6} style={{ padding: 0 }}>
                                                            <div style={{ background: '#f8fafc', padding: '1rem' }}>
                                                                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                                                    <thead>
                                                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)' }}>作答時間</th>
                                                                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)' }}>得分</th>
                                                                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)' }}>正確題數</th>
                                                                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>操作</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {group.records
                                                                            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                                            .map((record: any) => (
                                                                                <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                                    <td style={{ padding: '0.5rem' }} suppressHydrationWarning>
                                                                                        {formatDateTime(record.createdAt)}
                                                                                    </td>
                                                                                    <td style={{ padding: '0.5rem', fontWeight: 600, color: record.score >= 60 ? '#059669' : '#dc2626' }}>
                                                                                        {record.score}%
                                                                                    </td>
                                                                                    <td style={{ padding: '0.5rem', color: '#64748b' }}>
                                                                                        {record.correctCount} / {record.totalQuestions}
                                                                                    </td>
                                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDeleteScore(record.id);
                                                                                            }}
                                                                                            style={{
                                                                                                background: 'none',
                                                                                                border: 'none',
                                                                                                padding: '0.25rem',
                                                                                                cursor: 'pointer',
                                                                                                color: '#dc2626',
                                                                                                opacity: 0.7,
                                                                                                transition: 'opacity 0.2s'
                                                                                            }}
                                                                                            title="刪除紀錄"
                                                                                        >
                                                                                            <Trash2 size={16} />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="history-mobile-list" suppressHydrationWarning>
                            {Object.values(scores.reduce((acc, score) => {
                                if (!acc[score.examId]) {
                                    acc[score.examId] = {
                                        id: score.examId,
                                        title: score.examTitle,
                                        count: 0,
                                        totalScore: 0,
                                        bestScore: 0,
                                        lastDate: score.createdAt,
                                        records: []
                                    };
                                }
                                acc[score.examId].count += 1;
                                acc[score.examId].totalScore += score.score;
                                acc[score.examId].bestScore = Math.max(acc[score.examId].bestScore, score.score);
                                acc[score.examId].records.push(score);

                                if (new Date(score.createdAt as string) > new Date(acc[score.examId].lastDate as string)) {
                                    acc[score.examId].lastDate = score.createdAt;
                                }
                                return acc;
                            }, {} as any)).map((group: any) => {
                                const avgScore = Math.round(group.totalScore / group.count);
                                const isExpanded = expandedExamId === group.id;

                                return (
                                    <div key={group.id} className="history-card-mobile" onClick={() => setExpandedExamId(isExpanded ? null : group.id)}>
                                        <div className="history-card-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                <div className="history-card-title">{group.title}</div>
                                            </div>
                                            <span className={`score-badge ${avgScore >= 80 ? 'score-high' : avgScore >= 60 ? 'score-medium' : 'score-low'}`}>
                                                {avgScore}%
                                            </span>
                                        </div>
                                        <div className="history-stats-row">
                                            <span className="history-stat-label">作答次數</span>
                                            <span className="history-stat-value">{group.count} 次</span>
                                        </div>
                                        <div className="history-stats-row">
                                            <span className="history-stat-label">最佳正確率</span>
                                            <span className="history-stat-value" style={{ color: 'var(--accent-color)' }}>{group.bestScore}%</span>
                                        </div>
                                        <div className="history-stats-row">
                                            <span className="history-stat-label">最後作答</span>
                                            <span className="history-stat-value" style={{ color: 'var(--text-muted)' }} suppressHydrationWarning>
                                                {formatDate(group.lastDate as string)}
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                                                {group.records
                                                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                    .map((record: any) => (
                                                        <div key={record.id} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '0.75rem 0',
                                                            borderBottom: '1px solid #f1f5f9',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            <div>
                                                                <div style={{ color: record.score >= 60 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                                                                    {record.score}%
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }} suppressHydrationWarning>
                                                                    {formatDateTime(record.createdAt)}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteScore(record.id);
                                                                }}
                                                                style={{
                                                                    background: '#fef2f2',
                                                                    border: 'none',
                                                                    padding: '0.4rem',
                                                                    borderRadius: '0.375rem',
                                                                    color: '#dc2626',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>尚無作答記錄，快去挑戰吧！</p>
                    </div>
                )}
            </section >
        </div >
    );
}
