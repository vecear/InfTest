import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import QuestionCard from "./QuestionCard";

interface Option {
    id: string;
    text: string;
    order: number;
}

interface Question {
    id: string;
    content: string;
    imageUrl?: string | null;
    type: string;
    correctAnswer: string | null;
    answerExplanation: string | null;
    options: Option[];
}

interface Exam {
    id: string;
    title: string;
    questions: Question[];
}

interface ExamDetailProps {
    exam: Exam;
    backPath: string;
}

export default function ExamDetail({ exam, backPath }: ExamDetailProps) {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <Link href={backPath} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                }}>
                    <ArrowLeft size={16} /> 返回列表
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{exam.title}</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    共 {exam.questions.length} 題
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {exam.questions.map((q, index) => (
                    <div key={q.id}>
                        <div style={{
                            marginBottom: '1rem',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>第 {index + 1} 題</span>
                        </div>
                        <QuestionCard question={q} />
                    </div>
                ))}
            </div>
        </div>
    );
}
