import { BookOpen, PenTool, Database, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-color)' }}>
          感染科互動測驗網
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          提升專業知識，挑戰歷屆考題。即時答題回饋與專業社群討論，幫助您更有效率地學習。
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {categories.map((cat) => (
          <div key={cat.title} className="premium-card" style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            opacity: cat.active ? 1 : 0.7,
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              background: `${cat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <cat.icon size={32} color={cat.color} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{cat.title}</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{cat.description}</p>
            </div>

            <div style={{ marginTop: 'auto' }}>
              {cat.active ? (
                <Link href={cat.href} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: cat.color,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}>
                  立即開始 <ChevronRight size={18} />
                </Link>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                  敬請期待
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div >
  );
}
