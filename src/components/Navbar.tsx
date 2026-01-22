"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Microscope, BookOpen, PenTool, Database, LogIn, LogOut, User, RefreshCw, Settings } from "lucide-react";
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
            <nav className="navbar-top">
                {/* Logo & Refresh (Common) */}
                <div className="nav-logo-section">
                    <Microscope size={24} color="var(--accent-color)" />
                    <span className="nav-brand-text">InfTest</span>
                    <button onClick={() => window.location.reload()} className="refresh-button">
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Desktop Links */}
                <div className="nav-links-desktop desktop-only">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Timer Portal Slot */}
                <div id="navbar-timer-slot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}></div>

                {/* User Menu */}
                <div className="nav-user-section">
                    {user ? (
                        <div className="nav-user-info">
                            <span className="nav-user-name desktop-only">
                                {user.displayName || user.email?.split('@')[0]}
                            </span>
                            <div className="nav-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Link href="/profile" className="nav-settings-btn" title="設置">
                                    <Settings size={20} />
                                </Link>
                                {user.photoURL && (
                                    <Link href="/profile">
                                        <img src={user.photoURL} alt="User" className="user-avatar" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="nav-login-btn">
                            <LogIn size={20} />
                            <span>登入</span>
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

            {/* Toggle Button for detail mode on mobile */}
            <div className="mobile-only">
                {isDetailPage && (
                    <button
                        onClick={() => setIsBottomNavVisible(!isBottomNavVisible)}
                        className="mobile-fab"
                        style={{
                            bottom: isBottomNavVisible ? '80px' : '20px'
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
