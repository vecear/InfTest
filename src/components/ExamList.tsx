import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Exam {
    id: string;
    title: string;
    year: number;
    _count?: {
        questions: number;
    };
}

interface ExamListProps {
    exams: Exam[];
    title: string;
    description: string;
    iconColor: string;
    categoryPath: string;
}

export default function ExamList({ exams, title, description, iconColor, categoryPath }: ExamListProps) {
    return (
        <div className="exam-list-container">
            <div className="exam-list-header">
                <div
                    className="exam-list-icon"
                    style={{ background: `${iconColor}15` } as React.CSSProperties}
                >
                    <BookOpen size={24} color={iconColor} />
                </div>
                <div>
                    <h1 className="exam-title">{title}</h1>
                    <p className="exam-count" style={{ marginTop: 0 }}>{description}</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {exams.map((exam) => (
                    <Link
                        key={exam.id}
                        href={`${categoryPath}/${exam.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="premium-card" style={{
                            padding: '1.5rem 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div
                                    className="exam-card-year"
                                    style={{
                                        color: iconColor,
                                        background: `${iconColor}08`
                                    } as React.CSSProperties}
                                >
                                    {exam.year}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {exam.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={14} /> {exam.year} 年度
                                        </span>
                                        <span>共 {exam._count?.questions ?? 0} 題</span>
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={20} color="var(--text-muted)" />
                        </div>
                    </Link>
                ))}

                {exams.length === 0 && (
                    <div className="exam-count" style={{ textAlign: 'center', padding: '4rem' }}>
                        目前尚無考題資料。
                    </div>
                )}
            </div>
        </div>
    );
}
