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
    template?: string;
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
    id?: string;
    questionId?: string;
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

export interface UserScore {
    id?: string;
    userId: string;
    examId: string;
    examTitle: string;
    category: string;
    score: number;
    totalQuestions: number;
    correctCount: number;
    createdAt: string | Timestamp;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role?: 'admin' | 'user';
    updatedAt: string | Timestamp;
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

export async function saveUserScore(scoreData: Omit<UserScore, "id" | "createdAt">): Promise<void> {
    const scoresRef = collection(db, "userScores");
    await addDoc(scoresRef, {
        ...scoreData,
        createdAt: Timestamp.now()
    });
}

export async function updateUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, "users", profile.uid);
    const { setDoc } = await import("firebase/firestore");
    await setDoc(docRef, {
        ...profile,
        updatedAt: Timestamp.now()
    }, { merge: true });
}

export async function getUserScoreHistory(userId: string): Promise<UserScore[]> {
    const scoresRef = collection(db, "userScores");
    // Sort in memory instead of Firestore to avoid composite index requirement
    const q = query(scoresRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const scores = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
        } as UserScore;
    });

    // Sort descending by date
    return scores.sort((a, b) => {
        const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
        const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        ...data,
        updatedAt: data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt
    } as UserProfile;
}

// ==================== Admin Functions ====================

export async function createExam(examData: Omit<Exam, 'id' | '_count'>): Promise<string> {
    const examsRef = collection(db, "exams");
    const docRef = await addDoc(examsRef, {
        ...examData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function updateExam(id: string, data: Partial<Omit<Exam, 'id' | '_count'>>): Promise<void> {
    const docRef = doc(db, "exams", id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
    });
}

export async function deleteExam(id: string): Promise<void> {
    const { deleteDoc } = await import("firebase/firestore");

    // First delete all questions belonging to this exam
    const questionsRef = collection(db, "questions");
    const q = query(questionsRef, where("examId", "==", id));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(docSnap =>
        deleteDoc(doc(db, "questions", docSnap.id))
    );
    await Promise.all(deletePromises);

    // Then delete the exam
    await deleteDoc(doc(db, "exams", id));
}

export async function createQuestion(questionData: Omit<Question, 'id'>): Promise<string> {
    const questionsRef = collection(db, "questions");
    const docRef = await addDoc(questionsRef, {
        ...questionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function updateQuestion(id: string, data: Partial<Omit<Question, 'id'>>): Promise<void> {
    const docRef = doc(db, "questions", id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
    });
}

export async function deleteQuestion(id: string): Promise<void> {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "questions", id));
}

export async function getQuestionById(id: string): Promise<Question | null> {
    const docRef = doc(db, "questions", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Question;
}
