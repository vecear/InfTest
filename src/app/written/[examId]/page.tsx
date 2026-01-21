import { getExamById, getQuestionsByExamId } from "@/lib/firestore";
import ExamDetail from "@/components/ExamDetail";
import { notFound } from "next/navigation";

export default async function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
    const { examId } = await params;

    const [exam, questions] = await Promise.all([
        getExamById(examId),
        getQuestionsByExamId(examId)
    ]);

    if (!exam) {
        notFound();
    }

    const examWithQuestions = {
        ...exam,
        questions
    };

    return (
        <ExamDetail
            exam={examWithQuestions as any}
            backPath="/written"
        />
    );
}
