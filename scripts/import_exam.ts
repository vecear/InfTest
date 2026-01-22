import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

interface QuestionData {
    order: number;
    imageUrl: string;
    correctAnswer: string;
    answerExplanation?: string;
}

async function importExam() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: npx tsx scripts/import_exam.ts <year> [title] [category] [template]');
        process.exit(1);
    }

    const yearStr = args[0];
    const year = parseInt(yearStr);
    const title = args[1] || `${year}年度感染症專科醫師甄審筆試`;
    const category = args[2] || 'WRITTEN';
    const template = args[3] || 'WRITTEN_WITH_IMAGES';

    console.log(`🚀 Starting import for ${year} - ${title}...`);

    const sourceDir = path.join(process.cwd(), 'his', yearStr);
    const publicDir = path.join(process.cwd(), 'public', 'his', yearStr);

    if (!fs.existsSync(sourceDir)) {
        console.error(`❌ Source directory ${sourceDir} not found.`);
        process.exit(1);
    }

    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // 1. Sync images (shallow copy)
    const files = fs.readdirSync(sourceDir);
    console.log(`📂 Found ${files.length} files in ${sourceDir}`);

    for (const file of files) {
        if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')) {
            fs.copyFileSync(path.join(sourceDir, file), path.join(publicDir, file));
        }
    }
    console.log(`✅ Images synced to public/his/${yearStr}`);

    // 2. Load answers and explanations if present
    const answersPath = path.join(sourceDir, `${yearStr}-answers.json`);
    const explanationsPath = path.join(sourceDir, `${yearStr}-explanations.json`);

    let answers: Record<string, string> = {};
    let explanations: Record<string, string> = {};

    if (fs.existsSync(answersPath)) {
        answers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
        console.log(`✅ Loaded answers from ${answersPath}`);
    } else {
        console.warn(`⚠️ No answers file found at ${answersPath}. You may need to update correct answers later.`);
    }

    if (fs.existsSync(explanationsPath)) {
        explanations = JSON.parse(fs.readFileSync(explanationsPath, 'utf8'));
        console.log(`✅ Loaded explanations from ${explanationsPath}`);
    }

    // 3. Create Exam in Firestore
    const examRef = db.collection('exams').doc();
    const examId = examRef.id;

    await examRef.set({
        title,
        year,
        category,
        template,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Created Exam: ${title} (ID: ${examId})`);

    // 4. Create Questions
    const questionImages = files.filter(f => /^\d+(\-\d+)?\.(jpg|png)$/i.test(f)).sort((a, b) => {
        const aNum = parseInt(a.split('.')[0]);
        const bNum = parseInt(b.split('.')[0]);
        return aNum - bNum;
    });

    console.log(`📝 Importing ${questionImages.length} questions...`);

    const batch = db.batch();
    let count = 0;

    for (const imgName of questionImages) {
        // Skip multi-part images other than -1 if we only want one main entry (or handle multiple images)
        if (imgName.includes('-') && !imgName.includes('-1')) continue;

        const qNum = imgName.split('.')[0].split('-')[0];
        const qRef = db.collection('questions').doc();

        batch.set(qRef, {
            examId,
            content: `第 ${qNum} 題`,
            imageUrl: `/his/${yearStr}/${imgName}`,
            type: 'CHOICE',
            correctAnswer: answers[qNum] || null,
            answerExplanation: explanations[qNum] || null,
            order: parseInt(qNum),
            options: [
                { id: 'A', text: 'A', order: 0 },
                { id: 'B', text: 'B', order: 1 },
                { id: 'C', text: 'C', order: 2 },
                { id: 'D', text: 'D', order: 3 },
                { id: 'E', text: 'E', order: 4 }
            ],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        count++;
        if (count % 50 === 0) {
            await batch.commit();
            console.log(`...committed ${count} questions`);
        }
    }

    if (count % 50 !== 0) {
        await batch.commit();
    }

    console.log(`🎉 Successfully imported ${count} questions!`);
    console.log(`🔗 Edit at: http://localhost:3000/admin/exam/${examId}`);
}

importExam().catch(err => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
