# 試卷處理工具

將 PDF 試卷轉換成題庫資料的工具集。

## 方法一：快速手動處理（推薦）

這是最簡單且可靠的方法。

### 步驟 1: 將 PDF 轉換成圖片

使用線上工具或軟體將 PDF 的每一頁轉成圖片：

**線上工具選項：**
- https://www.ilovepdf.com/pdf_to_jpg
- https://smallpdf.com/pdf-to-jpg
- Adobe Acrobat（如果有安裝）

**設定：**
- 格式：PNG 或 JPG
- 解析度：200 DPI 或更高
- 輸出：每頁一個檔案

### 步驟 2: 組織圖片

將轉換好的圖片放到對應的目錄：

```bash
# 建立目錄結構
mkdir -p public/images/exams/2020/questions
mkdir -p public/images/exams/2021/questions
mkdir -p public/images/exams/2022/questions
mkdir -p public/images/exams/2023/questions

# 將圖片命名為 q001.png, q002.png, ... 並放入對應年份的 questions 目錄
```

**圖片命名規則：**
- `q001.png` - 第1題
- `q002.png` - 第2題
- `q003.png` - 第3題
- 依此類推...

### 步驟 3: 生成資料檔案

```bash
# 生成單一年份的資料
node scripts/organize_images.js 2020

# 或一次生成所有年份
node scripts/organize_images.js all
```

這會在 `scripts/output/` 目錄生成 JSON 檔案。

### 步驟 4: 填寫答案

編輯 `scripts/output/exam_2020.json`（或其他年份），填寫：
- `correctAnswer`: 正確答案（例如 "A", "B", "C"）
- `answerExplanation`: 答案解析
- `content`: 題目描述（可選，預設是"第 X 題"）

### 步驟 5: 匯入 Firestore

```bash
# 匯入單一年份
node scripts/import_to_firestore.js 2020

# 匯入所有年份
node scripts/import_to_firestore.js all
```

## 方法二：使用 Python 自動處理

需要安裝額外工具，較為複雜。

### 前置作業

1. 安裝 Python 套件：
```bash
pip install pdf2image Pillow
```

2. 安裝 Poppler（Windows）：
   - 下載：https://github.com/oschwartz10612/poppler-windows/releases/
   - 解壓縮並將 `bin` 目錄加入 PATH

### 執行

```bash
python scripts/process_pdf.py
```

## 資料結構

生成的 JSON 格式：

```json
{
  "title": "2020年感染症專科醫師甄審筆試",
  "year": 2020,
  "category": "WRITTEN",
  "questions": [
    {
      "order": 0,
      "content": "第 1 題",
      "type": "CHOICE",
      "imageUrl": "/images/exams/2020/questions/q001.png",
      "imageUrls": ["/images/exams/2020/questions/q001.png"],
      "options": [
        {"text": "A", "order": 0},
        {"text": "B", "order": 1},
        {"text": "C", "order": 2},
        {"text": "D", "order": 3},
        {"text": "E", "order": 4}
      ],
      "correctAnswer": "C",
      "answerExplanation": "解析內容..."
    }
  ]
}
```

## 目錄結構

```
InfTest/
├── his/pdf/              # 原始 PDF 檔案
│   ├── 2020.pdf
│   ├── 2021.pdf
│   ├── 2022.pdf
│   └── 2023.pdf
├── public/images/exams/  # 處理後的圖片
│   ├── 2020/
│   │   └── questions/
│   │       ├── q001.png
│   │       ├── q002.png
│   │       └── ...
│   ├── 2021/
│   └── ...
└── scripts/
    ├── output/           # 生成的 JSON 檔案
    │   ├── exam_2020.json
    │   ├── exam_2021.json
    │   └── ...
    ├── organize_images.js
    ├── import_to_firestore.js
    └── process_pdf.py
```

## 快速開始範例

假設要處理 2020 年的試卷：

```bash
# 1. 使用線上工具將 his/pdf/2020.pdf 轉成圖片

# 2. 建立目錄
mkdir -p public/images/exams/2020/questions

# 3. 將圖片命名為 q001.png, q002.png, ... 並放入目錄

# 4. 生成資料檔案
node scripts/organize_images.js 2020

# 5. 編輯 scripts/output/exam_2020.json 填寫答案

# 6. 匯入到 Firestore
node scripts/import_to_firestore.js 2020
```

## 注意事項

1. **圖片命名**必須按照順序：q001, q002, q003...
2. 圖片會直接從 `public/` 目錄提供，無需上傳到其他地方
3. 建議先處理一年份確認流程無誤，再批量處理
4. 確保 `serviceAccountKey.json` 存在於專案根目錄

## 疑難排解

### 找不到圖片目錄
確保已建立 `public/images/exams/[year]/questions/` 目錄。

### 匯入 Firestore 失敗
- 確認 `serviceAccountKey.json` 存在且有效
- 檢查網路連線
- 確認 Firestore 規則允許寫入

### 圖片在網站上無法顯示
- 確認圖片在 `public/` 目錄下
- 檢查路徑是否正確（應為 `/images/exams/...`）
- 確認檔案權限
