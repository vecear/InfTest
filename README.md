# InfTest - 感染科互動測驗平台 🩺

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Storage-FFCA28?logo=firebase)](https://firebase.google.com/)

InfTest (Infection Control Test) 是一個專為感染科專科醫師考試準備而設計的現代化互動式測驗平台。本系統收錄了歷屆筆試與實務考題，提供即時答題回饋、詳解、OCR 文字辨識以及社群討論功能。

---

## ✨ 核心功能 (Core Features)

### 📚 全方位試題庫

- **歷屆筆試**：收錄完整的感染科專科醫師筆試選擇題，模擬真實考試節奏。
- **歷屆實務**：包含臨床情境題、影像診斷與檢驗判讀等實務操作題型。
- **其他題目**：持續更新的專題練習與模擬試題，涵蓋抗生素使用、微生物學等重點。

### 🧠 智慧化學習體驗

- **OCR 文字辨識**：整合 **Tesseract.js** 技術，一鍵從題目圖片中提取文字，解決影像題無法搜尋與筆記的痛點。
- **即時回饋系統**：作答後立即揭曉答案，並提供詳細的臨床實務解析。
- **Rich Text 討論區**：每道題目配備專屬留言板，採用自定義 **Tiptap 編輯器**，支援：
  - 多級標題 (H1, H2, H3)
  - 豐富格式：粗體、斜體、下劃線、文字顏色、背景螢光筆。
  - 雙向溝通：支援清單、引用區塊與表情符號 (Emoji)。

### 📱 極致的使用者介面

- **玻璃擬態設計 (Glassmorphism)**：現代化視覺層次，提供流暢的透明磨砂質感介面。
- **響應式配置 (RWD)**：
  - **行動版**：專屬底部導航列，方便單手操作。
  - **桌面版**：適配寬螢幕顯示，提供更舒適的閱讀與編輯體驗。

---

## 🛠️ 技術架構 (Technical Stack)

| 分類 | 技術 |
| :--- | :--- |
| **前端框架** | Next.js 16 (App Router), React 19 |
| **程式語言** | TypeScript |
| **資料庫** | PostgreSQL / SQLite (由 Prisma 管理) |
| **身分驗證** | Firebase Authentication (支援 Google/Email 登入) |
| **內容儲存** | Firebase Storage |
| **樣式設計** | Vanilla CSS + CSS Modules |
| **文字編輯** | Tiptap Editor (基於 ProseMirror) |
| **文字辨識** | Tesseract.js |

---

## 🚀 快速上手 (Getting Started)

### 1. 複製專案與安裝

```bash
git clone <repository-url>
cd InfTest
npm install
```

### 2. 環境變數設定

建立 `.env` 檔案並填入以下資訊：

```env
# Prisma 資料庫連結
DATABASE_URL="file:./dev.db"

# Firebase 設定 (從 Firebase Console 取得)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
...
```

### 3. 資料庫初始化

```bash
npx prisma db push
npx prisma generate
```

### 4. 啟動開發環境

```bash
npm run dev
```

造訪 [http://localhost:3000](http://localhost:3000) 即可開始使用。

---

## 📂 專案結構 (Directory Structure)

```text
src/
├── app/                  # Next.js App Router 頁面與 API
│   ├── written/          # 歷屆筆試模組
│   ├── practical/        # 歷屆實務模組
│   └── api/              # 後端 API 端點
├── components/           # 重用 UI 元件 (Editor, Navbar, Cards)
├── lib/                  # 第三方服務配置 (Firebase, Prisma)
└── styles/               # 全域樣式與主題設定
```

---

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！如果您有新的題庫資源或功能建議，請：

1. Fork 本專案
2. 建立您的 Feature Branch (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到 Branch (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT 授權。
