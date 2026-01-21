import { getExams } from "@/lib/firestore";
import ExamList from "@/components/ExamList";

export default async function PracticalExamsPage() {
    const exams = await getExams("PRACTICAL");

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
