"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExams, getExamById, getQuestionsByExamId, Exam, Question } from "@/lib/firestore-client";
import ExamList from "@/components/ExamList";
import ExamDetail from "@/components/ExamDetail";

export default function WrittenUnifiedPage() {
    const params = useParams();
    const router = useRouter();

    // params.slug is an array for catch-all routes
    const slug = params.slug as string[] | undefined;
    const examId = slug?.[0];

    const [exams, setExams] = useState<Exam[]>([]);
    const [exam, setExam] = useState<(Exam & { questions: Question[] }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!examId) {
            // Load List
            setLoading(true);
            getExams("WRITTEN").then((data) => {
                setExams(data);
                setLoading(false);
            });
        } else {
            // Load Detail
            setLoading(true);
            Promise.all([
                getExamById(examId),
                getQuestionsByExamId(examId)
            ]).then(([examData, questions]) => {
                if (!examData) {
                    router.replace("/written");
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
                title="歷屆筆試考題"
                description="選擇年份開始進行測驗"
                iconColor="#3b82f6"
                categoryPath="/written"
            />
        );
    }

    return (
        <ExamDetail
            exam={exam as any}
            backPath="/written"
        />
    );
}
