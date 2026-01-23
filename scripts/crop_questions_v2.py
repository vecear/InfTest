#!/usr/bin/env python3
"""
使用 OCR 辨識題號並裁切試卷題目
Version 2: 使用 EasyOCR 進行更準確的題號辨識
"""

import os
import sys
import re
from pathlib import Path
from PIL import Image
import cv2
import numpy as np

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
SOURCE_DIR = BASE_DIR / "his" / "image"
OUTPUT_DIR = BASE_DIR / "public" / "images" / "exams"


def find_question_numbers_with_ocr(image_path: Path):
    """使用 EasyOCR 找出題號位置"""
    try:
        import easyocr
    except ImportError:
        print("正在安裝 EasyOCR，請稍候...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "easyocr"])
        import easyocr

    # 初始化 OCR reader (第一次會下載模型)
    reader = easyocr.Reader(['ch_tra', 'en'], gpu=False)

    # 讀取圖片
    img = cv2.imread(str(image_path))
    if img is None:
        return []

    # OCR 辨識
    results = reader.readtext(str(image_path))

    # 找出題號
    question_numbers = []

    for (bbox, text, conf) in results:
        # 尋找 "1." "2." 或 "1、" "2、" 等模式
        match = re.match(r'^(\d+)[\.、\.]', text.strip())
        if match and conf > 0.5:
            num = int(match.group(1))
            # 獲取邊界框的 Y 座標（頂部）
            y = int(bbox[0][1])  # 左上角的 Y 座標
            question_numbers.append((num, y, bbox))

    # 按照 Y 座標排序
    question_numbers.sort(key=lambda x: x[1])

    return question_numbers


def crop_by_question_numbers(image_path: Path, year: str) -> List[Path]:
    """根據辨識到的題號裁切圖片"""
    print(f"處理 {image_path.name}...")

    # 建立輸出目錄
    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(parents=True, exist_ok=True)

    # 使用 OCR 找題號
    question_numbers = find_question_numbers_with_ocr(image_path)

    if len(question_numbers) == 0:
        print(f"  警告: 未找到題號，跳過")
        return []

    print(f"  找到 {len(question_numbers)} 個題號: {[q[0] for q in question_numbers]}")

    # 開啟圖片
    img = Image.open(image_path)

    cropped_images = []

    for i, (qnum, y_pos, bbox) in enumerate(question_numbers):
        # 計算裁切區域
        y_start = y_pos - 20  # 稍微往上一點包含題號

        # 下一題的起始位置
        if i < len(question_numbers) - 1:
            y_end = question_numbers[i + 1][1] - 20
        else:
            y_end = img.height

        # 確保邊界合理
        y_start = max(0, y_start)
        y_end = min(img.height, y_end)

        # 裁切
        cropped = img.crop((0, y_start, img.width, y_end))

        # 儲存
        output_path = year_dir / f"q{qnum:03d}.jpg"
        cropped.save(output_path, 'JPEG', quality=95)
        cropped_images.append(output_path)

        print(f"  題目 {qnum}: {y_end - y_start}px 高")

    return cropped_images


def process_year_with_ocr(year: str):
    """處理一個年份的所有頁面"""
    source_year_dir = SOURCE_DIR / year

    if not source_year_dir.exists():
        print(f"錯誤: 找不到目錄 {source_year_dir}")
        return []

    # 讀取所有圖片並排序
    files = sorted(
        [f for f in source_year_dir.iterdir() if f.suffix.lower() in ['.jpg', '.png', '.jpeg']],
        key=lambda x: int(re.search(r'\d+', x.stem).group())
    )

    print(f"\n{'='*60}")
    print(f"處理 {year} 年，共 {len(files)} 頁")
    print('='*60)

    all_cropped = []

    for page_idx, image_path in enumerate(files):
        page_num = page_idx + 1

        # 跳過封面
        if page_num == 1:
            print(f"\n第 {page_num} 頁: 封面，跳過")
            continue

        print(f"\n第 {page_num} 頁:")

        try:
            cropped = crop_by_question_numbers(image_path, year)
            all_cropped.extend(cropped)
        except Exception as e:
            print(f"  錯誤: {e}")
            continue

    print(f"\n{'='*60}")
    print(f"完成！{year} 年共裁切 {len(all_cropped)} 題")
    print('='*60)

    return all_cropped


def main():
    """主程式"""
    # 設定 Windows 控制台編碼
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("試卷題目自動裁切工具 (OCR 版本)")
    print("="*60)

    # 檢查必要套件
    try:
        import cv2
        import easyocr
        print("OK - 所有套件已安裝")
    except ImportError as e:
        print(f"ERROR - 缺少套件: {e}")
        print("正在安裝...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python", "easyocr"])

    years = ['2020']  # 先測試一個年份

    for year in years:
        try:
            process_year_with_ocr(year)
        except Exception as e:
            print(f"\nERROR - 處理 {year} 年時發生錯誤: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*60)
    print("處理完成！")
    print("="*60)


if __name__ == "__main__":
    # 加上 typing import
    from typing import List, Tuple
    main()
