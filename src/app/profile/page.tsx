"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    getUserScoreHistory,
    updateUserProfile,
    getUserProfile,
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
    LogOut
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

    // Account Settings State
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLinking, setIsLinking] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPasswordForm, setShowPasswordForm] = useState(false);
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
        if (history.length === 0) return;

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
            setMessage({ type: 'success', text: "Email 已更新" });
            setShowEmailForm(false);
            setNewEmail("");
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                setMessage({ type: 'error', text: "為了安全，請重新登入後再試。" });
            } else {
                setMessage({ type: 'error', text: `更新失敗: ${error.message}` });
            }
        } finally {
            setIsLinking(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handlePasswordAction = async () => {
        if (!user || !newPassword) return;
        setIsLinking(true);
        try {
            if (authProviders.includes('password')) {
                // Change existing password
                // For changing password, re-auth might be needed if session is old,
                // but updatePassword usually works if decent login.
                // Best practice: Ask for current password to re-auth first.
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
                // Set password (for Google users)
                // Need to link with Email/Password credential
                // Note: user.email must rely on the google email for this linking usually
                // Or we treat it as adding a password to the existing provider-less base?
                // Actually, updatePassword works if the user is authenticated, effectively 'adding' password provider behavior often,
                // BUT formally syncing 'password' provider usually requires 'linkWithCredential' if we want to add the provider explicitly.
                // However, updatePassword on a Google-only user often throws if not set up.
                // Correct path: linkWithCredential with EmailAuthProvider.
                const credential = EmailAuthProvider.credential(user.email!, newPassword);
                await linkWithCredential(user, credential);
                setMessage({ type: 'success', text: "密碼已設定，現在可以使用 Email登入" });
            }
            setShowPasswordForm(false);
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

    if (!isMounted) return null;

    if (authLoading || (loading && !scores.length)) {
        return (
            <div className="profile-container loading-wrapper">
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
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <header className="premium-card profile-header">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="profile-avatar-large" />
                ) : (
                    <div className="profile-avatar-large" style={{ background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 800 }}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="profile-info">
                    <div className="profile-name-row">
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="profile-name-input"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                                />
                                <button onClick={handleSaveProfile} disabled={saving} className="refresh-button" style={{ color: '#10b981' }} title="儲存">
                                    <Save size={20} />
                                </button>
                                <button onClick={() => { setIsEditing(false); fetchUserData(); }} className="refresh-button" style={{ color: '#ef4444' }} title="取消">
                                    <X size={20} />
                                </button>
                            </>
                        ) : (
                            <>
                                <h1 className="profile-name-input" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
                                    {displayName}
                                </h1>
                                <button onClick={() => setIsEditing(true)} className="refresh-button" title="編輯名稱">
                                    <Edit3 size={18} />
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
                                    <LogOut size={18} />
                                </button>
                            </>
                        )}
                    </div>
                    <p className="profile-email">{user.email}</p>
                </div>
            </header>

            {/* Account Settings Section */}
            <div className="premium-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={20} /> 帳號設定
                </h2>

                <div style={{ display: 'grid', gap: '1rem' }}>

                    {/* Google Linking */}
                    <div className="settings-row">
                        <div className="settings-info">
                            <div className="settings-icon-circle">
                                <Globe size={20} color={hasGoogle ? '#10b981' : '#64748b'} />
                            </div>
                            <div>
                                <div className="settings-text-primary">Google 連結</div>
                                <div className="settings-text-secondary">
                                    {hasGoogle ? '已連結 Google 帳號' : '連結 Google 帳號以使用快速登入'}
                                </div>
                            </div>
                        </div>
                        {hasGoogle ? (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                                <Check size={16} /> 已連結
                            </span>
                        ) : (
                            <button
                                onClick={handleLinkGoogle}
                                disabled={isLinking}
                                style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                連結帳號
                            </button>
                        )}
                    </div>

                    {/* Email Management */}
                    <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showEmailForm ? '1rem' : 0 }}>
                            <div className="settings-info">
                                <div className="settings-icon-circle">
                                    <Mail size={20} color="#64748b" />
                                </div>
                                <div>
                                    <div className="settings-text-primary">Email 設定</div>
                                    <div className="settings-text-secondary">{user.email}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEmailForm(!showEmailForm)}
                                className="settings-action-btn"
                            >
                                {showEmailForm ? '取消' : '變更'}
                            </button>
                        </div>

                        {showEmailForm && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <input
                                    type="email"
                                    placeholder="輸入新 Email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}
                                />
                                <button
                                    onClick={handleUpdateEmail}
                                    disabled={isLinking || !newEmail}
                                    style={{ padding: '0.5rem 1rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    更新 Email
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Password Management */}
                    <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPasswordForm ? '1rem' : 0 }}>
                            <div className="settings-info">
                                <div className="settings-icon-circle">
                                    <Key size={20} color={hasPassword ? '#10b981' : '#64748b'} />
                                </div>
                                <div>
                                    <div className="settings-text-primary">密碼設定</div>
                                    <div className="settings-text-secondary">
                                        {hasPassword ? '已設定密碼' : '尚未設定密碼 (僅使用 Google 登入)'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="settings-action-btn"
                            >
                                {showPasswordForm ? '取消' : (hasPassword ? '變更密碼' : '設定密碼')}
                            </button>
                        </div>

                        {showPasswordForm && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {hasPassword && (
                                    <input
                                        type="password"
                                        placeholder="目前密碼"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}
                                    />
                                )}
                                <input
                                    type="password"
                                    placeholder={hasPassword ? "新密碼" : "設定新密碼"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ccc' }}
                                />
                                <button
                                    onClick={handlePasswordAction}
                                    disabled={isLinking || !newPassword}
                                    style={{ padding: '0.5rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {hasPassword ? "確認變更" : "確認設定"}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div className="stats-grid">
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

            <section className="history-section">
                <h2 className="history-title">
                    <Clock size={24} color="var(--accent-color)" />
                    試題得分紀錄
                </h2>

                {scores.length > 0 ? (
                    <>
                        <div className="premium-card history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
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
                                                lastDate: score.createdAt
                                            };
                                        }
                                        acc[score.examId].count += 1;
                                        acc[score.examId].totalScore += score.score;
                                        acc[score.examId].bestScore = Math.max(acc[score.examId].bestScore, score.score);
                                        if (new Date(score.createdAt as string) > new Date(acc[score.examId].lastDate as string)) {
                                            acc[score.examId].lastDate = score.createdAt;
                                        }
                                        return acc;
                                    }, {} as any)).map((group: any) => {
                                        const avgScore = Math.round(group.totalScore / group.count);
                                        return (
                                            <tr key={group.id}>
                                                <td style={{ fontWeight: 600 }}>{group.title}</td>
                                                <td style={{ textAlign: 'center' }}>{group.count} 次</td>
                                                <td>
                                                    <span className={`score-badge ${avgScore >= 80 ? 'score-high' : avgScore >= 60 ? 'score-medium' : 'score-low'}`}>
                                                        {avgScore}%
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{group.bestScore}%</td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    {new Date(group.lastDate as string).toLocaleDateString('zh-TW', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="history-mobile-list">
                            {Object.values(scores.reduce((acc, score) => {
                                if (!acc[score.examId]) {
                                    acc[score.examId] = {
                                        id: score.examId,
                                        title: score.examTitle,
                                        count: 0,
                                        totalScore: 0,
                                        bestScore: 0,
                                        lastDate: score.createdAt
                                    };
                                }
                                acc[score.examId].count += 1;
                                acc[score.examId].totalScore += score.score;
                                acc[score.examId].bestScore = Math.max(acc[score.examId].bestScore, score.score);
                                if (new Date(score.createdAt as string) > new Date(acc[score.examId].lastDate as string)) {
                                    acc[score.examId].lastDate = score.createdAt;
                                }
                                return acc;
                            }, {} as any)).map((group: any) => {
                                const avgScore = Math.round(group.totalScore / group.count);
                                return (
                                    <div key={group.id} className="history-card-mobile">
                                        <div className="history-card-header">
                                            <div className="history-card-title">{group.title}</div>
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
                                            <span className="history-stat-value" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(group.lastDate as string).toLocaleDateString('zh-TW', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </span>
                                        </div>
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
