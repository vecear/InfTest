import { db } from "@/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    getCountFromServer,
    Timestamp
} from "firebase/firestore";

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
    createdAt: string;
}

export async function getExams(category?: string): Promise<Exam[]> {
    const examsRef = collection(db, "exams");
    let q;

    if (category) {
        q = query(examsRef, where("category", "==", category), orderBy("year", "desc"));
    } else {
        q = query(examsRef, orderBy("year", "desc"));
    }

    console.log(`[getExams] Starting fetch for category: ${category || 'ALL'}`);
    const snapshot = await getDocs(q);
    console.log(`[getExams] Got snapshot, docs count: ${snapshot.size}`);
    const exams: Exam[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    } as Exam));

    // Fetch question counts for each exam in parallel
    await Promise.all(exams.map(async (exam) => {
        try {
            const questionsRef = collection(db, "questions");
            const countQuery = query(questionsRef, where("examId", "==", exam.id));
            const countSnapshot = await getCountFromServer(countQuery);
            exam._count = { questions: countSnapshot.data().count };
        } catch (err) {
            console.warn(`Failed to count questions for exam ${exam.id}:`, err);
            // Default to 0 or keeping undefined if appropriate, preventing the whole page from crashing
            exam._count = { questions: 0 };
        }
    }));

    return exams;
}

export async function getExamById(id: string): Promise<Exam | null> {
    const docRef = doc(db, "exams", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Exam;
}

export async function getQuestionsByExamId(examId: string): Promise<Question[]> {
    const questionsRef = collection(db, "questions");
    const q = query(questionsRef, where("examId", "==", examId), orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    } as Question));
}

export async function getComments(questionId: string): Promise<Comment[]> {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("questionId", "==", questionId), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            questionId: data.questionId,
            content: data.content,
            author: data.author,
            createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
        };
    });
}

export async function addComment(questionId: string, content: string, author: string = "Guest"): Promise<{ id: string }> {
    const commentsRef = collection(db, "comments");
    const docRef = await addDoc(commentsRef, {
        questionId,
        content,
        author,
        createdAt: Timestamp.now()
    });
    return { id: docRef.id };
}

export async function updateQuestionExplanation(id: string, explanation: string): Promise<{ id: string; answerExplanation: string }> {
    const docRef = doc(db, "questions", id);
    await updateDoc(docRef, {
        answerExplanation: explanation,
        updatedAt: Timestamp.now()
    });
    return { id, answerExplanation: explanation };
}
