---
name: import_exam
description: "建立題庫，從 /his/[年份] 資料夾讀取圖片並匯入 Firestore 分類至歷屆筆試"
---

# Import Exam Questions from Images

這個 Skill 用於將 `/his/[year]` 資料夾中的圖片題目匯入至 Firestore。

## Prerequisites
1.  在根目錄的 `his/` 資料夾下建立年份資料夾（例如 `his/2023/`）。
2.  將每題題目截圖存放於該資料夾，命名為 `1.jpg`, `2.jpg` ... 等。
3.  將答案紙截圖存放於該資料夾，命名為 `0.Answer.jpg` 或 `answer.jpg`。
4.  （選用）如果有解析內容，可存放為 `[year].md`。

## Workflow

### 1. 同步圖片到 Public
將 `/his/[year]` 資料夾及其內容複製到 `/public/his/`，以便 Web app 可以透過 Static URL 讀取。
```bash
cp -r his/[year] public/his/
```

### 2. 解析答案與說明
讀取答案圖片與 Markdown 說明檔。
- 使用 `vision` 工具檢視答案圖片並將答案轉換為 JSON 格式。
- 若有 `.md` 檔，執行解析腳本產生 JSON：
  ```bash
  python scripts/parse_explanations.py his/[year]/[year].md
  ```
  這會產生 `[year]-answers.json` 與 `[year]-explanations.json`。

### 3. 執行匯入指令
使用專用的匯入腳本將資料寫入 Firestore。
```bash
npx tsx scripts/import-exam.ts [year] [category] [template]
```

## Example Data Structure
```json
{
  "title": "113年度感染症專科醫師甄審筆試",
  "year": 2024,
  "category": "WRITTEN",
  "template": "WRITTEN_WITH_IMAGES",
  "questions": [
    {
      "order": 1,
      "imageUrl": "/his/2024/1.jpg",
      "correctAnswer": "B",
      "answerExplanation": "...",
      "type": "CHOICE",
      "options": [
        {"text": "A", "order": 1},
        {"text": "B", "order": 2},
        {"text": "C", "order": 3},
        {"text": "D", "order": 4},
        {"text": "E", "order": 5}
      ]
    }
  ]
}
```
