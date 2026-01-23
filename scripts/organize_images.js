/**
 * 組織試卷圖片並生成資料檔案
 *
 * 使用方式：
 * 1. 將 PDF 手動轉成圖片（每題一張）
 * 2. 將圖片放到 public/images/exams/[year]/questions/ 目錄
 * 3. 執行此腳本： node scripts/organize_images.js [year]
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images', 'exams');
const OUTPUT_DIR = path.join(__dirname, 'output');

// 確保輸出目錄存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getQuestionImages(year) {
  const questionsDir = path.join(IMAGES_DIR, year, 'questions');

  if (!fs.existsSync(questionsDir)) {
    console.error(`錯誤: 找不到目錄 ${questionsDir}`);
    console.log('\n請先建立目錄並放入圖片：');
    console.log(`  mkdir -p "${questionsDir}"`);
    console.log(`  # 將圖片放入該目錄，命名為 q001.png, q002.png, ...`);
    process.exit(1);
  }

  // 讀取所有圖片檔案
  const files = fs.readdirSync(questionsDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error(`錯誤: ${questionsDir} 中沒有圖片檔案`);
    process.exit(1);
  }

  return files.map((file, index) => {
    // 轉換成相對於 public/ 的 URL
    return `/images/exams/${year}/questions/${file}`;
  });
}

function generateExamData(year, imageUrls) {
  const examData = {
    title: `${year}年感染症專科醫師甄審筆試`,
    year: parseInt(year),
    category: "WRITTEN",
    questions: []
  };

  imageUrls.forEach((imageUrl, index) => {
    const question = {
      order: index,
      content: `第 ${index + 1} 題`,
      type: "CHOICE",
      imageUrl: imageUrl,
      imageUrls: [imageUrl],
      options: [
        { text: "A", order: 0 },
        { text: "B", order: 1 },
        { text: "C", order: 2 },
        { text: "D", order: 3 },
        { text: "E", order: 4 }
      ],
      correctAnswer: "",  // 需要手動填寫
      answerExplanation: ""
    };
    examData.questions.push(question);
  });

  return examData;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方式: node organize_images.js [year]');
    console.log('例如: node organize_images.js 2020');
    console.log('\n或處理所有年份: node organize_images.js all');
    process.exit(1);
  }

  const yearArg = args[0];

  try {
    if (yearArg === 'all') {
      // 處理所有年份
      if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`錯誤: 找不到圖片目錄 ${IMAGES_DIR}`);
        process.exit(1);
      }

      const years = fs.readdirSync(IMAGES_DIR)
        .filter(f => {
          const fullPath = path.join(IMAGES_DIR, f);
          return fs.statSync(fullPath).isDirectory() && /^\d{4}$/.test(f);
        });

      console.log(`找到 ${years.length} 個年份: ${years.join(', ')}`);

      years.forEach(year => {
        console.log(`\n處理 ${year} 年...`);
        processYear(year);
      });
    } else {
      // 處理單一年份
      processYear(yearArg);
    }

    console.log('\n✓ 完成！');
    console.log('\n下一步:');
    console.log('1. 檢查 scripts/output/ 中生成的 JSON 檔案');
    console.log('2. 填寫正確答案和解析');
    console.log('3. 執行: node scripts/import_to_firestore.js [year]');
  } catch (error) {
    console.error('\n✗ 發生錯誤:', error.message);
    process.exit(1);
  }
}

function processYear(year) {
  // 取得圖片
  const imageUrls = getQuestionImages(year);
  console.log(`找到 ${imageUrls.length} 張圖片`);

  // 生成資料
  const examData = generateExamData(year, imageUrls);

  // 儲存 JSON
  const outputPath = path.join(OUTPUT_DIR, `exam_${year}.json`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(examData, null, 2),
    'utf8'
  );

  console.log(`✓ 已生成: ${outputPath}`);
}

main();
