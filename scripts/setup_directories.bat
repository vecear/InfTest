@echo off
REM 建立試卷圖片目錄結構

echo 建立目錄結構...

mkdir "public\images\exams\2020\questions" 2>nul
mkdir "public\images\exams\2021\questions" 2>nul
mkdir "public\images\exams\2022\questions" 2>nul
mkdir "public\images\exams\2023\questions" 2>nul
mkdir "scripts\output" 2>nul

echo.
echo 目錄已建立！
echo.
echo 接下來：
echo 1. 將 PDF 轉換成圖片（使用線上工具）
echo 2. 將圖片命名為 q001.png, q002.png, ... 並放入對應年份的 questions 目錄
echo 3. 執行: node scripts/organize_images.js [year]
echo.
pause
