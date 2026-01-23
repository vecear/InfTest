#!/usr/bin/env python3
"""
PDF 試卷處理腳本
將 PDF 轉換成圖片，並裁切成個別題目
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Tuple
from pdf2image import convert_from_path
from PIL import Image

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "his" / "pdf"
OUTPUT_DIR = BASE_DIR / "public" / "images" / "exams"
DATA_DIR = BASE_DIR / "scripts" / "output"

# 建立輸出目錄
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


def extract_pages_as_images(pdf_path: Path, year: str) -> List[Path]:
    """將 PDF 的每一頁轉換成圖片"""
    print(f"處理 PDF: {pdf_path}")

    year_dir = OUTPUT_DIR / year
    year_dir.mkdir(exist_ok=True)

    # 使用 pdf2image 轉換 PDF
    # 需要安裝 poppler: https://github.com/oschwartz10612/poppler-windows/releases/
    try:
        images = convert_from_path(
            str(pdf_path),
            dpi=200,  # 高解析度
            fmt='png'
        )
    except Exception as e:
        print(f"錯誤: 無法轉換 PDF。請確認已安裝 poppler。")
        print(f"下載位置: https://github.com/oschwartz10612/poppler-windows/releases/")
        raise e

    image_paths = []

    for page_num, image in enumerate(images):
        # 儲存圖片
        img_path = year_dir / f"page_{page_num + 1:03d}.png"
        image.save(str(img_path), 'PNG')
        image_paths.append(img_path)

        print(f"  已轉換第 {page_num + 1}/{len(images)} 頁")

    print(f"完成！共 {len(image_paths)} 頁")
    return image_paths


def detect_question_regions(image_path: Path) -> List[Tuple[int, int, int, int]]:
    """
    檢測圖片中的題目區域
    返回: [(x, y, width, height), ...]

    注意：這是一個簡化版本，實際可能需要更複雜的圖像處理
    這裡假設題目是按照固定格式排列的
    """
    # 這個函數需要根據實際 PDF 格式來實作
    # 暫時返回整頁作為一個題目
    img = Image.open(image_path)
    width, height = img.size
    return [(0, 0, width, height)]


def crop_questions(image_path: Path, year: str, page_num: int) -> List[Path]:
    """裁切圖片中的各個題目"""
    img = Image.open(image_path)
    regions = detect_question_regions(image_path)

    cropped_images = []
    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(exist_ok=True)

    for idx, (x, y, w, h) in enumerate(regions):
        # 裁切題目
        cropped = img.crop((x, y, x + w, y + h))

        # 儲存裁切後的圖片
        question_num = (page_num - 1) * len(regions) + idx + 1
        crop_path = year_dir / f"q{question_num:03d}.png"
        cropped.save(crop_path)
        cropped_images.append(crop_path)

    return cropped_images


def generate_exam_data(year: str, question_images: List[Path]) -> Dict:
    """生成試卷資料結構"""
    # 將絕對路徑轉換成相對於 public/ 的路徑
    relative_images = []
    for img_path in question_images:
        rel_path = img_path.relative_to(BASE_DIR / "public")
        # 轉換成 URL 格式
        url_path = "/" + str(rel_path).replace("\\", "/")
        relative_images.append(url_path)

    exam_data = {
        "title": f"{year}年感染症專科醫師甄審筆試",
        "year": int(year),
        "category": "WRITTEN",
        "questions": []
    }

    for idx, img_url in enumerate(relative_images):
        question = {
            "order": idx,
            "content": f"第 {idx + 1} 題",
            "type": "CHOICE",
            "imageUrl": img_url,
            "options": [
                {"text": "A", "order": 0},
                {"text": "B", "order": 1},
                {"text": "C", "order": 2},
                {"text": "D", "order": 3},
                {"text": "E", "order": 4}
            ],
            "correctAnswer": "",  # 需要手動填寫
            "answerExplanation": ""
        }
        exam_data["questions"].append(question)

    return exam_data


def process_pdf(pdf_path: Path):
    """處理單一 PDF 檔案"""
    # 從檔名取得年份
    year = pdf_path.stem  # 例如 "2020"

    print(f"\n{'='*60}")
    print(f"處理 {year} 年試卷")
    print(f"{'='*60}\n")

    # 步驟 1: 將 PDF 轉換成圖片
    page_images = extract_pages_as_images(pdf_path, year)

    # 步驟 2: 裁切各題目（暫時跳過，使用整頁）
    print(f"\n處理題目...")
    question_images = []

    # 簡化版：每頁當作一題
    for idx, page_img in enumerate(page_images):
        year_dir = OUTPUT_DIR / year / "questions"
        year_dir.mkdir(parents=True, exist_ok=True)

        # 複製圖片到 questions 目錄
        import shutil
        question_path = year_dir / f"q{idx + 1:03d}.png"
        shutil.copy(page_img, question_path)
        question_images.append(question_path)

    print(f"完成！共 {len(question_images)} 題")

    # 步驟 3: 生成資料
    exam_data = generate_exam_data(year, question_images)

    # 儲存 JSON
    json_path = DATA_DIR / f"exam_{year}.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(exam_data, f, ensure_ascii=False, indent=2)

    print(f"\n資料已儲存到: {json_path}")
    print(f"圖片已儲存到: {OUTPUT_DIR / year}")

    return exam_data


def main():
    """主程式"""
    print("PDF 試卷處理工具")
    print("=" * 60)

    # 檢查 PDF 目錄
    if not PDF_DIR.exists():
        print(f"錯誤: 找不到 PDF 目錄: {PDF_DIR}")
        sys.exit(1)

    # 取得所有 PDF 檔案
    pdf_files = sorted(PDF_DIR.glob("*.pdf"))

    if not pdf_files:
        print(f"錯誤: {PDF_DIR} 中沒有 PDF 檔案")
        sys.exit(1)

    print(f"找到 {len(pdf_files)} 個 PDF 檔案:")
    for pdf in pdf_files:
        print(f"  - {pdf.name}")

    # 處理每個 PDF
    all_exams = []
    for pdf_file in pdf_files:
        try:
            exam_data = process_pdf(pdf_file)
            all_exams.append(exam_data)
        except Exception as e:
            print(f"\n錯誤: 處理 {pdf_file.name} 時發生錯誤: {e}")
            import traceback
            traceback.print_exc()

    # 生成匯總報告
    print(f"\n{'='*60}")
    print("處理完成！")
    print(f"{'='*60}")
    print(f"共處理 {len(all_exams)} 份試卷")
    print(f"\n下一步:")
    print("1. 檢查生成的圖片和 JSON 檔案")
    print("2. 在 JSON 中填寫正確答案")
    print("3. 使用匯入腳本將資料匯入 Firestore")


if __name__ == "__main__":
    main()
