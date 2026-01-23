/**
 * 將 his/image 目錄中的圖片複製並重新命名到 public/images/exams 目錄
 * 並生成對應的 JSON 資料檔案
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const SOURCE_DIR = path.join(BASE_DIR, 'his', 'image');
const PUBLIC_DIR = path.join(BASE_DIR, 'public', 'images', 'exams');
const OUTPUT_DIR = path.join(__dirname, 'output');

// 確保輸出目錄存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function naturalSort(a, b) {
  // 從檔名中提取數字進行排序
  const numA = parseInt(a.match(/\d+/)?.[0] || '0');
  const numB = parseInt(b.match(/\d+/)?.[0] || '0');
  return numA - numB;
}

function processYear(year) {
  const sourceYearDir = path.join(SOURCE_DIR, year);
  const targetYearDir = path.join(PUBLIC_DIR, year, 'questions');

  if (!fs.existsSync(sourceYearDir)) {
    console.error(`錯誤: 找不到目錄 ${sourceYearDir}`);
    return;
  }

  // 建立目標目錄
  if (!fs.existsSync(targetYearDir)) {
    fs.mkdirSync(targetYearDir, { recursive: true });
  }

  // 讀取所有圖片檔案並排序
  const files = fs.readdirSync(sourceYearDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort(naturalSort);

  if (files.length === 0) {
    console.error(`錯誤: ${sourceYearDir} 中沒有圖片檔案`);
    return;
  }

  console.log(`處理 ${year} 年，共 ${files.length} 張圖片`);

  const imageUrls = [];

  // 複製並重新命名檔案
  files.forEach((file, index) => {
    const sourceFile = path.join(sourceYearDir, file);
    const ext = path.extname(file);
    const newFileName = `q${String(index + 1).padStart(3, '0')}${ext}`;
    const targetFile = path.join(targetYearDir, newFileName);

    // 複製檔案
    fs.copyFileSync(sourceFile, targetFile);

    // 記錄 URL
    const imageUrl = `/images/exams/${year}/questions/${newFileName}`;
    imageUrls.push(imageUrl);

    if ((index + 1) % 10 === 0) {
      console.log(`  已處理 ${index + 1}/${files.length} 張圖片`);
    }
  });

  console.log(`✓ 已複製 ${files.length} 張圖片到 ${targetYearDir}`);

  // 生成試卷資料
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

  // 儲存 JSON
  const outputPath = path.join(OUTPUT_DIR, `exam_${year}.json`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(examData, null, 2),
    'utf8'
  );

  console.log(`✓ 已生成資料檔案: ${outputPath}`);
  return examData;
}

function main() {
  const years = ['2020', '2021', '2022', '2023'];

  console.log('開始處理圖片...\n');

  years.forEach(year => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`處理 ${year} 年`);
    console.log('='.repeat(60));

    try {
      processYear(year);
    } catch (error) {
      console.error(`處理 ${year} 年時發生錯誤:`, error.message);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✓ 所有年份處理完成！');
  console.log('='.repeat(60));
  console.log('\n下一步:');
  console.log('1. 檢查 public/images/exams/[year]/questions/ 中的圖片');
  console.log('2. 檢查 scripts/output/ 中生成的 JSON 檔案');
  console.log('3. 編輯 JSON 檔案填寫正確答案和解析');
  console.log('4. 執行: node scripts/import_to_firestore.js all');
}

main();
