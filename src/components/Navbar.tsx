"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Microscope, BookOpen, PenTool, Database } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "首頁", icon: Microscope },
        { href: "/written", label: "歷屆筆試", icon: BookOpen },
        { href: "/practical", label: "歷屆實務", icon: PenTool },
        { href: "/others", label: "其他題目", icon: Database },
    ];

    return (
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
            justifyContent: 'space-between',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Microscope size={28} color="var(--accent-color)" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    InfTest
                </span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
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
        </nav>
    );
}
