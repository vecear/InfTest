# InfTest - 感染科互動測驗網

InfTest (Infection Control Test) 是一個專為感染科專科醫師考試準備而設計的互動式測驗平台。本系統收錄了歷屆筆試與實務考題，提供即時答題回饋、詳解以及社群討論功能，協助使用者更有效率地準備考試。

## ✨ 主要功能

- **歷屆試題庫**：
  - **歷屆筆試**：收錄完整的感染科專科醫師筆試選擇題。
  - **歷屆實務**：包含臨床情境題與檢驗判讀等實務操作題型。
  - **其他題目**：持續更新的專題練習與模擬試題。

- **互動式學習體驗**：
  - **即時回饋**：作答後立即顯示正確答案與解析。
  - **OCR 文字辨識**：利用 Tesseract.js 技術，可從題目圖片中提取文字，方便搜尋與閱讀。
  - **討論區**：每道題目皆設有留言板，支援 Rich Text 編輯，供使用者交流討論。

- **現代化使用者介面**：
  - **響應式設計 (RWD)**：針對行動裝置優化，提供手機版專屬的底部導航列。
  - **會員系統**：整合 Firebase Authentication，支援使用者登入與個人化紀錄。

## 🛠️ 技術架構

本專案採用現代化的 Web 技術堆疊構建：

- **核心框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **程式語言**: TypeScript
- **資料庫**: SQLite (透過 [Prisma](https://www.prisma.io/) ORM 管理)
- **身分驗證**: Firebase Authentication
- **樣式設計**: CSS Modules, Lucide React Icons
- **功能套件**:
  - **OCR**: Tesseract.js
  - **Rich Text Editor**: TipTap / React-Quill

## 🚀 快速開始 (Getting Started)

1. **複製專案**

```bash
git clone <repository-url>
cd InfTest
```

2. **安裝依賴套件**

```bash
npm install
# 或
yarn install
```

3. **設定環境變數**

請參考 `.env.example` (若有) 建立 `.env` 檔案，並填入必要的 Prisma 與 Firebase 設定。

4. **資料庫設定**

```bash
npx prisma generate
npx prisma db push
```

5. **啟動開發伺服器**

```bash
npm run dev
```

開啟瀏覽器並訪問 [http://localhost:3000](http://localhost:3000) 即可看到結果。

## 📂 專案結構

- `src/app`: Next.js App Router 頁面路由
  - `written`: 歷屆筆試頁面
  - `practical`: 歷屆實務頁面
  - `others`: 其他題目頁面
  - `login`: 登入頁面
- `src/components`: 共用元件 (Navbar, QuestionCard, ExamList 等)
- `prisma`: 資料庫 Schema 定義
- `public`: 靜態資源

## 🤝 貢獻

歡迎提交 Pull Request 或 Issue 來協助改進本專案！
