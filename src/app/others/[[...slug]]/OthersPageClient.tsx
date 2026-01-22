"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExams, getExamById, getQuestionsByExamId, Exam, Question } from "@/lib/firestore-client";
import ExamList from "@/components/ExamList";
import ExamDetail from "@/components/ExamDetail";

export default function OthersUnifiedPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string[] | undefined;

    const [examId, setExamId] = useState<string | undefined>(undefined);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'others' && pathParts[1]) {
            setExamId(pathParts[1]);
        } else if (slug?.[0]) {
            setExamId(slug[0]);
        }
    }, [slug]);

    const [exams, setExams] = useState<Exam[]>([]);
    const [exam, setExam] = useState<(Exam & { questions: Question[] }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isMounted) return;

        setLoading(true);
        if (!examId) {
            getExams("OTHER").then((data) => {
                setExams(data);
                setExam(null);
                setLoading(false);
            });
        } else {
            Promise.all([
                getExamById(examId),
                getQuestionsByExamId(examId)
            ]).then(([examData, questions]) => {
                if (!examData) {
                    router.replace("/others");
                    return;
                }
                setExam({ ...examData, questions });
                setLoading(false);
            });
        }
    }, [examId, router]);

    if (!isMounted || loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <p>載入中...</p>
            </div>
        );
    }

    if (!examId) {
        return (
            <ExamList
                exams={exams}
                title="其他題目"
                description="各類專題練習與模擬試題，持續更新中。"
                iconColor="#f59e0b"
                categoryPath="/others"
            />
        );
    }

    if (!exam) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <p>資料抓取中...</p>
            </div>
        );
    }

    return (
        <ExamDetail
            exam={exam as any}
            backPath="/others"
        />
    );
}
