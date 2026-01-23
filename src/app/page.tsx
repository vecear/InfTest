"use client";

import { useState, useEffect } from "react";
import { BookOpen, PenTool, Database, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categories = [
    {
      title: "歷屆筆試",
      description: "包含歷屆感染科專科醫師筆試選擇題，提供即時解答與留言討論。",
      icon: BookOpen,
      href: "/written",
      color: "#3b82f6",
      active: true,
    },
    {
      title: "歷屆實務",
      description: "實務操作與填空題型，模擬實際臨床情境與檢驗判讀。",
      icon: PenTool,
      href: "/practical",
      color: "#10b981",
      active: true,
    },
    {
      title: "其他題目",
      description: "各類專題練習與模擬試題，持續更新中。",
      icon: Database,
      href: "/others",
      color: "#f59e0b",
      active: true,
    },
  ];

  if (!isMounted) {
    return (
      <div className="home-container" suppressHydrationWarning>
        <header className="home-header">
          <h1 className="home-title">歷屆感專題庫</h1>
        </header>
        <div className="home-grid" />
      </div>
    );
  }

  return (
    <div className="home-container" suppressHydrationWarning>
      <header className="home-header">
        <h1 className="home-title">
          歷屆感專題庫
        </h1>
        <p className="home-description">
          考題練習，團結就是力量!
        </p>
      </header>

      <div className="home-grid">
        {categories.map((cat) => (
          <div key={cat.title}>
            {cat.active ? (
              <Link href={cat.href} className="premium-card cat-card" style={{ opacity: cat.active ? 1 : 0.7 }}>
                <div className="cat-card-icon-wrapper" style={{ background: `${cat.color}15` }}>
                  <cat.icon size={32} color={cat.color} />
                </div>

                <div>
                  <h2 className="cat-card-title">{cat.title}</h2>
                  <p className="cat-card-description">{cat.description}</p>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div className="cat-card-link-text" style={{ color: cat.color }}>
                    立即開始 <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="premium-card cat-card" style={{ opacity: 0.7 }}>
                <div className="cat-card-icon-wrapper" style={{ background: `${cat.color}15` }}>
                  <cat.icon size={32} color={cat.color} />
                </div>

                <div>
                  <h2 className="cat-card-title">{cat.title}</h2>
                  <p className="cat-card-description">{cat.description}</p>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                    敬請期待
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div >
  );
}
