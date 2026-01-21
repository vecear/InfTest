"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Microscope, BookOpen, PenTool, Database, LogIn, LogOut, User } from "lucide-react";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Detect if we are on a question detail page
    const isDetailPage = pathname.split('/').filter(Boolean).length >= 2;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Auth listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => {
            window.removeEventListener('resize', checkMobile);
            unsubscribe();
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
            <nav style={{
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)',
                padding: '0.75rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'space-between' : 'flex-start', // Adjusted for mobile to have space-between
                gap: isMobile ? '0' : '3rem',
                boxSizing: 'border-box'
            }} className="navbar-top">
                {/* Logo Area - Centered on Mobile using spacer trick if needed, or just left/center */}
                {/* To center logo on mobile with an item on the right, we need a 3-column grid or flex tweaks. */}
                {/* Simpler: Logo in center, User icon on right absolute? */}

                {isMobile ? (
                    <>
                        <div style={{ width: '24px' }} /> {/* Spacer left */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Microscope size={24} color="var(--accent-color)" />
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                InfTest
                            </span>
                        </div>
                        {/* Mobile User Icon */}
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
                                <Link href="/login">
                                    <LogIn size={20} color="var(--accent-color)" />
                                </Link>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Microscope size={28} color="var(--accent-color)" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                            InfTest
                        </span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flex: 1 }} className="desktop-only">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Icon size={18} />
                                    <span>{link.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop User Menu (Right side) */}
                {!isMobile && (
                    <div className="desktop-only" style={{ marginLeft: 'auto' }}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {user.displayName || user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
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
                            >
                                <LogIn size={16} />
                                登入
                            </Link>
                        )}
                    </div>
                )}
            </nav>

            {/* Bottom Nav for Mobile */}
            {isMobile && (
                <>
                    {/* Toggle Button for detail mode */}
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

                    <div className="bottom-nav" style={{
                        transform: (isDetailPage && !isBottomNavVisible) ? 'translateY(100%)' : 'translateY(0)',
                        opacity: (isDetailPage && !isBottomNavVisible) ? 0 : 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: (isDetailPage && !isBottomNavVisible) ? 'none' : 'auto'
                    }}>
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => isDetailPage && setIsBottomNavVisible(false)}
                                >
                                    <Icon size={22} className="bottom-nav-icon" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
}
