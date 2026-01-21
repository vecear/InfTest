const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();

if (!admin.apps.length) {
    const serviceAccount = require("../service-account.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function migrate() {
    console.log("🚀 Starting migration...");

    // 1. Migrate Exams
    const exams = await prisma.exam.findMany();
    console.log(`Found ${exams.length} exams.`);

    for (const exam of exams) {
        console.log(`Migrating exam: ${exam.title}...`);
        try {
            await db.collection("exams").doc(exam.id).set({
                title: exam.title,
                year: exam.year,
                category: exam.category,
                createdAt: exam.createdAt,
                updatedAt: exam.updatedAt
            });
        } catch (e) {
            console.error(`Failed to migrate exam ${exam.id}:`, e);
            throw e;
        }
    }

    // 2. Migrate Questions and Options
    const questions = await prisma.question.findMany({
        include: { options: true }
    });
    console.log(`Found ${questions.length} questions.`);

    for (const q of questions) {
        console.log(`Migrating question: ${q.id.substring(0, 8)}...`);
        await db.collection("questions").doc(q.id).set({
            examId: q.examId,
            content: q.content,
            imageUrl: q.imageUrl,
            ocrText: q.ocrText,
            type: q.type,
            correctAnswer: q.correctAnswer,
            answerExplanation: q.answerExplanation,
            order: q.order,
            options: q.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                order: opt.order
            })),
            createdAt: q.createdAt,
            updatedAt: q.updatedAt
        });
    }

    // 3. Migrate Comments
    const comments = await prisma.comment.findMany();
    console.log(`Found ${comments.length} comments.`);

    for (const c of comments) {
        await db.collection("comments").doc(c.id).set({
            questionId: c.questionId,
            content: c.content,
            author: c.author,
            createdAt: c.createdAt
        });
    }

    console.log("✅ Migration finished successfully!");
}

migrate()
    .catch(e => {
        console.error("❌ Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
