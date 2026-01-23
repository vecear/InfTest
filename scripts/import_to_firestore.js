/**
 * 將處理好的試卷資料匯入 Firestore
 * 使用方式: node scripts/import_to_firestore.js [year]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 初始化 Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use service account file
    const serviceAccount = require('../service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with service account file');
  } catch (fileError) {
    // Fallback to default credentials (works in Firebase/GCP environments)
    admin.initializeApp({
      projectId: 'inftest-c77b1'
    });
    console.log('Firebase Admin initialized with projectId: inftest-c77b1');
  }
}

const db = admin.firestore();

async function importExam(examData) {
  console.log(`\n匯入試卷: ${examData.title}`);
  console.log(`題數: ${examData.questions.length}`);

  try {
    // 建立試卷
    const examRef = await db.collection('exams').add({
      title: examData.title,
      year: examData.year,
      category: examData.category,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`試卷已建立，ID: ${examRef.id}`);

    // 建立題目
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_LIMIT = 500; // Firestore batch limit

    for (let i = 0; i < examData.questions.length; i++) {
      const question = examData.questions[i];

      const questionRef = db.collection('questions').doc();
      batch.set(questionRef, {
        examId: examRef.id,
        content: question.content,
        type: question.type,
        imageUrl: question.imageUrl || null,
        imageUrls: question.imageUrls || [],
        options: question.options || [],
        correctAnswer: question.correctAnswer || null,
        answerExplanation: question.answerExplanation || null,
        order: question.order || i,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      batchCount++;

      // 執行 batch（每 500 筆或最後一筆）
      if (batchCount === BATCH_LIMIT || i === examData.questions.length - 1) {
        await batch.commit();
        console.log(`已匯入 ${i + 1}/${examData.questions.length} 題`);

        // 重置 batch
        if (i < examData.questions.length - 1) {
          const newBatch = db.batch();
          Object.assign(batch, newBatch);
          batchCount = 0;
        }
      }
    }

    console.log(`✓ ${examData.title} 匯入完成！`);
    return examRef.id;
  } catch (error) {
    console.error(`✗ 匯入失敗:`, error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方式: node import_to_firestore.js [year]');
    console.log('例如: node import_to_firestore.js 2020');
    console.log('或: node import_to_firestore.js all');
    process.exit(1);
  }

  const year = args[0];
  const dataDir = path.join(__dirname, 'output');

  try {
    if (year === 'all') {
      // 匯入所有試卷
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

      console.log(`找到 ${files.length} 個試卷資料檔案`);

      for (const file of files) {
        const filePath = path.join(dataDir, file);
        const examData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await importExam(examData);
      }
    } else {
      // 匯入指定年份
      const filePath = path.join(dataDir, `exam_${year}.json`);

      if (!fs.existsSync(filePath)) {
        console.error(`錯誤: 找不到檔案 ${filePath}`);
        process.exit(1);
      }

      const examData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      await importExam(examData);
    }

    console.log('\n✓ 全部匯入完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 發生錯誤:', error);
    process.exit(1);
  }
}

main();
