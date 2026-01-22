"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Microscope, BookOpen, PenTool, Database, LogIn, LogOut, User, RefreshCw } from "lucide-react";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Detect if we are on a question detail page
    const isDetailPage = pathname.split('/').filter(Boolean).length >= 2;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // On detail pages, hide bottom nav by default
    useEffect(() => {
        if (isDetailPage) {
            setIsBottomNavVisible(false);
        } else {
            setIsBottomNavVisible(true);
        }
    }, [isDetailPage, pathname]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsProfileOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const links = [
        { href: "/", label: "首頁", icon: Microscope },
        { href: "/written", label: "歷屆筆試", icon: BookOpen },
        { href: "/practical", label: "歷屆實務", icon: PenTool },
        { href: "/others", label: "其他題目", icon: Database },
    ];

    return (
        <>
            {/* Top Navbar */}
            <nav className="navbar-top" suppressHydrationWarning>
                {/* Desktop Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-only">
                    <Microscope size={28} color="var(--accent-color)" />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        InfTest
                    </span>
                    <button
                        onClick={() => window.location.reload()}
                        className="refresh-button desktop-only"
                        aria-label="重新整理"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Mobile Logo & Refresh */}
                <div className="mobile-only" style={{ display: 'none', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ width: '24px' }} /> {/* Spacer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Microscope size={24} color="var(--accent-color)" />
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                InfTest
                            </span>
                            <button
                                onClick={() => window.location.reload()}
                                style={{ background: 'none', border: 'none', padding: '4px', color: 'var(--text-muted)' }}
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                        <div style={{ width: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            {user ? (
                                <button onClick={() => handleLogout()} style={{ background: 'none', border: 'none', padding: 0 }}>
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="User" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                    ) : (
                                        <LogOut size={20} color="var(--text-muted)" />
                                    )}
                                </button>
                            ) : (
                                <Link href="/login" suppressHydrationWarning>
                                    <LogIn size={20} color="var(--accent-color)" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Links */}
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }} className="desktop-only">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                                suppressHydrationWarning
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Icon size={18} />
                                    <span>{link.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop User Menu */}
                <div className="desktop-only" style={{ marginLeft: 'auto' }}>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {user.displayName || user.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="logout-btn-desktop"
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <LogOut size={16} />
                                登出
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '0.5rem',
                                background: 'var(--accent-color)',
                                color: 'white',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            suppressHydrationWarning
                        >
                            <LogIn size={16} />
                            登入
                        </Link>
                    )}
                </div>
            </nav>

            {/* Bottom Nav for Mobile */}
            <div className={`bottom-nav mobile-only`} style={{
                transform: (isDetailPage && !isBottomNavVisible) ? 'translateY(100%)' : 'translateY(0)',
                opacity: (isDetailPage && !isBottomNavVisible) ? 0 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: (isDetailPage && !isBottomNavVisible) ? 'none' : 'auto'
            }} suppressHydrationWarning>
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => isDetailPage && setIsBottomNavVisible(false)}
                            suppressHydrationWarning
                        >
                            <Icon size={22} className="bottom-nav-icon" />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Toggle Button for detail mode on mobile */}
            <div className="mobile-only">
                {isDetailPage && (
                    <button
                        onClick={() => setIsBottomNavVisible(!isBottomNavVisible)}
                        style={{
                            position: 'fixed',
                            bottom: isBottomNavVisible ? '80px' : '20px',
                            right: '20px',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'var(--accent-color)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                            zIndex: 1001,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isBottomNavVisible ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                    >
                        <div style={{ transition: 'transform 0.3s ease', transform: isBottomNavVisible ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <Microscope size={20} />
                        </div>
                    </button>
                )}
            </div>
        </>
    );
}
