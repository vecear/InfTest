import { db } from "./firebase-admin";

export interface Exam {
    id: string;
    title: string;
    year: number;
    category: string;
    _count?: { questions: number };
}

export interface Question {
    id: string;
    examId: string;
    content: string;
    imageUrl?: string | null;
    ocrText?: string | null;
    type: string;
    correctAnswer: string | null;
    answerExplanation: string | null;
    order: number;
    options: QuestionOption[];
}

export interface QuestionOption {
    id: string;
    questionId: string;
    text: string;
    order: number;
}

export interface Comment {
    id: string;
    questionId: string;
    content: string;
    author: string;
    createdAt: any;
}

export async function getExams(category?: string) {
    let query: any = db.collection("exams");

    if (category) {
        query = query.where("category", "==", category).orderBy("year", "desc");
    } else {
        query = query.orderBy("year", "desc");
    }

    const snapshot = await query.get();
    const exams = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Exam));

    // Fetch counts for each exam (simple approach for now)
    for (const exam of exams) {
        const qSnapshot = await db.collection("questions").where("examId", "==", exam.id).count().get();
        exam._count = { questions: qSnapshot.data().count };
    }

    return exams;
}

export async function getExamById(id: string) {
    const doc = await db.collection("exams").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Exam;
}

export async function getQuestionsByExamId(examId: string) {
    const snapshot = await db.collection("questions")
        .where("examId", "==", examId)
        .orderBy("order", "asc")
        .get();

    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Question));
}

export async function getQuestionWithExplanation(id: string) {
    const doc = await db.collection("questions").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Question;
}

export async function getComments(questionId: string) {
    const snapshot = await db.collection("comments")
        .where("questionId", "==", questionId)
        .orderBy("createdAt", "asc")
        .get();

    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString()
    } as any));
}

export async function addComment(questionId: string, content: string, author: string = "Guest") {
    const res = await db.collection("comments").add({
        questionId,
        content,
        author,
        createdAt: new Date()
    });
    return { id: res.id };
}

export async function updateQuestionExplanation(id: string, explanation: string) {
    await db.collection("questions").doc(id).update({
        answerExplanation: explanation,
        updatedAt: new Date()
    });
    return { id, answerExplanation: explanation };
}
