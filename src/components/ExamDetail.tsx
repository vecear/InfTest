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
    ocrText?: string | null;
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
                <Link href={backPath} className="back-link">
                    <ArrowLeft size={16} /> 返回列表
                </Link>
                <div className="exam-header">
                    <h1 className="exam-title">{exam.title}</h1>
                </div>
                <p className="exam-count">
                    共 {exam.questions.length} 題 <span style={{ fontSize: '0.875rem', color: 'var(--accent-color)', marginLeft: '1rem', fontWeight: 500 }}>（需先查看解答才可參與討論）</span>
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
