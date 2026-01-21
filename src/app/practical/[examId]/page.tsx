import { prisma } from "@/lib/prisma";
import ExamDetail from "@/components/ExamDetail";
import { notFound } from "next/navigation";

export default async function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
    const { examId } = await params;

    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            questions: {
                orderBy: { order: "asc" },
                include: {
                    options: {
                        orderBy: { order: "asc" }
                    }
                }
            }
        }
    });

    if (!exam) {
        notFound();
    }

    return (
        <ExamDetail
            exam={exam}
            backPath="/practical"
        />
    );
}
