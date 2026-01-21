import { getExams } from "@/lib/firestore";
import ExamList from "@/components/ExamList";

export default async function WrittenExamsPage() {
    const exams = await getExams("WRITTEN");

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
