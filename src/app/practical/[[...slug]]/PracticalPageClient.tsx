"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExams, getExamById, getQuestionsByExamId, Exam, Question } from "@/lib/firestore-client";
import ExamList from "@/components/ExamList";
import ExamDetail from "@/components/ExamDetail";

export default function PracticalUnifiedPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string[] | undefined;

    const [examId, setExamId] = useState<string | undefined>(slug?.[0]);

    useEffect(() => {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'practical' && pathParts[1]) {
            setExamId(pathParts[1]);
        } else {
            setExamId(slug?.[0]);
        }
    }, [slug]);

    const [exams, setExams] = useState<Exam[]>([]);
    const [exam, setExam] = useState<(Exam & { questions: Question[] }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        if (!examId) {
            getExams("PRACTICAL").then((data) => {
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
                    router.replace("/practical");
                    return;
                }
                setExam({ ...examData, questions });
                setLoading(false);
            });
        }
    }, [examId, router]);

    if (loading) {
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
                title="歷屆實務考題"
                description="實務操作與填空題型，模擬實際臨床情境與檢驗判讀。"
                iconColor="#10b981"
                categoryPath="/practical"
            />
        );
    }

    return (
        <ExamDetail
            exam={exam as any}
            backPath="/practical"
        />
    );
}
