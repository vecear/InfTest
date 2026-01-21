import { prisma } from "@/lib/prisma";
import ExamList from "@/components/ExamList";

export default async function OtherExamsPage() {
    const exams = await prisma.exam.findMany({
        where: { category: "OTHER" },
        orderBy: { year: "desc" },
        include: { _count: { select: { questions: true } } },
    });

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
