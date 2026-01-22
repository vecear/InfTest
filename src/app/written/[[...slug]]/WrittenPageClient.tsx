"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExams, getExamById, getQuestionsByExamId, Exam, Question } from "@/lib/firestore-client";
import ExamList from "@/components/ExamList";
import ExamDetail from "@/components/ExamDetail";

export default function WrittenUnifiedPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string[] | undefined;

    // To prevent hydration mismatch, we start with undefined and set it in useEffect
    const [examId, setExamId] = useState<string | undefined>(undefined);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        // Correctly detect examId from path or params
        if (pathParts[0] === 'written' && pathParts[1]) {
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
            // Load List
            getExams("WRITTEN").then((data) => {
                setExams(data);
                setExam(null); // Clear previous exam
                setLoading(false);
            });
        } else {
            // Load Detail
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

    // If not mounted yet, render list to match server build output
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
