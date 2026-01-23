#!/usr/bin/env python3
"""
自動辨識並裁切試卷中的題目
使用圖像處理技術辨識題目邊界並裁切
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Tuple
from PIL import Image, ImageDraw
import cv2
import numpy as np

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
SOURCE_DIR = BASE_DIR / "his" / "image"
OUTPUT_DIR = BASE_DIR / "public" / "images" / "exams"

def find_question_boundaries(image_path: Path, debug=False) -> List[Tuple[int, int, int, int]]:
    """
    使用圖像處理找出題目的邊界
    返回: [(y_start, y_end, x_start, x_end), ...]
    """
    # 讀取圖片
    img = cv2.imread(str(image_path))
    if img is None:
        print(f"無法讀取圖片: {image_path}")
        return []

    height, width = img.shape[:2]

    # 轉換為灰階
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 使用自適應閾值處理
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    # 計算每一行的黑色像素數量
    row_densities = np.sum(binary, axis=1) / 255

    # 找出文字密集的區域（題目通常有較高的像素密度）
    threshold = np.mean(row_densities) * 0.3

    # 找出題目分隔線（空白區域）
    separators = []
    min_gap = 30  # 最小間隔（像素）
    gap_threshold = threshold * 0.5

    in_gap = False
    gap_start = 0

    for i, density in enumerate(row_densities):
        if density < gap_threshold:
            if not in_gap:
                gap_start = i
                in_gap = True
        else:
            if in_gap and (i - gap_start) > min_gap:
                separators.append((gap_start, i))
            in_gap = False

    # 如果沒有找到分隔線，將整頁當作一個題目
    if len(separators) == 0:
        return [(0, height, 0, width)]

    # 根據分隔線建立題目邊界
    boundaries = []

    # 跳過第一個大空白區域（通常是頁首）
    start_y = 0
    if len(separators) > 0 and separators[0][0] < height * 0.2:
        start_y = separators[0][1]
        separators = separators[1:]

    # 處理每個分隔區域之間的內容
    for i, (gap_start, gap_end) in enumerate(separators):
        if gap_start - start_y > min_gap:  # 確保有足夠的內容
            boundaries.append((start_y, gap_start, 0, width))
        start_y = gap_end

    # 加上最後一個區域
    if height - start_y > min_gap:
        boundaries.append((start_y, height, 0, width))

    if debug:
        print(f"找到 {len(boundaries)} 個題目區域")
        for i, (y1, y2, x1, x2) in enumerate(boundaries):
            print(f"  區域 {i+1}: Y={y1}-{y2}, 高度={y2-y1}")

    return boundaries


def detect_question_number_ocr(image_path: Path) -> List[Tuple[int, int, int, int]]:
    """
    使用 OCR 和模式匹配來偵測題號並裁切
    尋找 "1.", "2.", "3." 等模式來分割題目
    """
    import pytesseract

    # 讀取圖片
    img = Image.open(image_path)
    width, height = img.size

    # 使用 pytesseract 獲取文字位置
    try:
        data = pytesseract.image_to_data(img, lang='chi_tra+eng', output_type=pytesseract.Output.DICT)
    except Exception as e:
        print(f"OCR 失敗: {e}")
        return find_question_boundaries(image_path)

    # 尋找題號 (1., 2., 3., ... 或 1、2、3、...)
    question_positions = []

    for i, text in enumerate(data['text']):
        if text.strip():
            # 匹配題號模式
            if re.match(r'^\d+[\.\、]$', text.strip()) or re.match(r'^\d+$', text.strip()):
                try:
                    num = int(re.sub(r'[\.\、]', '', text.strip()))
                    if 1 <= num <= 100:  # 合理的題號範圍
                        y = data['top'][i]
                        question_positions.append((num, y))
                except:
                    pass

    # 排序並去重
    question_positions = sorted(set(question_positions), key=lambda x: x[1])

    if len(question_positions) == 0:
        # 如果 OCR 沒找到題號，使用基於密度的方法
        return find_question_boundaries(image_path)

    # 根據題號位置建立邊界
    boundaries = []

    for i in range(len(question_positions)):
        y_start = question_positions[i][1] - 10  # 稍微往上一點包含題號

        if i < len(question_positions) - 1:
            y_end = question_positions[i + 1][1] - 10
        else:
            y_end = height

        # 確保邊界合理
        if y_end - y_start > 50:  # 最小高度
            boundaries.append((max(0, y_start), min(height, y_end), 0, width))

    return boundaries


def crop_questions_simple(image_path: Path, year: str, page_num: int) -> List[Path]:
    """
    簡單的裁切方法：基於圖像密度分析
    """
    print(f"處理 {image_path.name}...")

    # 建立輸出目錄
    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(parents=True, exist_ok=True)

    # 獲取題目邊界
    boundaries = find_question_boundaries(image_path, debug=True)

    if len(boundaries) == 0:
        print(f"  警告: 無法在 {image_path.name} 中偵測到題目")
        return []

    # 開啟原始圖片
    img = Image.open(image_path)

    cropped_images = []

    # 計算這是第幾題（需要考慮之前頁面的題目）
    # 假設第一頁是封面，每頁大約 3-4 題
    base_question_num = (page_num - 2) * 3 + 1 if page_num > 1 else 1

    for idx, (y1, y2, x1, x2) in enumerate(boundaries):
        # 加上一些邊距
        margin = 10
        y1 = max(0, y1 - margin)
        y2 = min(img.height, y2 + margin)

        # 裁切圖片
        cropped = img.crop((x1, y1, x2, y2))

        # 儲存裁切後的圖片
        question_num = base_question_num + idx
        output_path = year_dir / f"q{question_num:03d}.jpg"
        cropped.save(output_path, 'JPEG', quality=95)
        cropped_images.append(output_path)

        print(f"  已裁切題目 {question_num}: {y2-y1}px 高")

    return cropped_images


def process_year_manual_split(year: str, questions_per_page: List[int]):
    """
    手動指定每頁的題目數量進行裁切
    questions_per_page: 每頁題目數量的列表，例如 [0, 3, 4, 3, 4, ...]
    """
    source_year_dir = SOURCE_DIR / year

    if not source_year_dir.exists():
        print(f"錯誤: 找不到目錄 {source_year_dir}")
        return

    # 讀取所有圖片檔案並排序
    files = sorted(
        [f for f in source_year_dir.iterdir() if f.suffix.lower() in ['.jpg', '.png', '.jpeg']],
        key=lambda x: int(re.search(r'\d+', x.stem).group())
    )

    print(f"\n處理 {year} 年，共 {len(files)} 頁")

    all_cropped = []
    current_question = 1

    for page_idx, image_path in enumerate(files):
        page_num = page_idx + 1

        # 第一頁通常是封面，跳過
        if page_num == 1:
            print(f"第 {page_num} 頁: 封面，跳過")
            continue

        print(f"\n第 {page_num} 頁:")

        # 獲取這一頁的題目數量
        if page_idx < len(questions_per_page):
            num_questions = questions_per_page[page_idx]
        else:
            num_questions = 3  # 預設值

        if num_questions == 0:
            print(f"  跳過此頁")
            continue

        # 開啟圖片
        img = Image.open(image_path)
        height = img.height

        # 簡單平均分割
        section_height = height // num_questions

        year_dir = OUTPUT_DIR / year / "questions"
        year_dir.mkdir(parents=True, exist_ok=True)

        for i in range(num_questions):
            y1 = i * section_height
            y2 = (i + 1) * section_height if i < num_questions - 1 else height

            # 裁切
            cropped = img.crop((0, y1, img.width, y2))

            # 儲存
            output_path = year_dir / f"q{current_question:03d}.jpg"
            cropped.save(output_path, 'JPEG', quality=95)
            all_cropped.append(output_path)

            print(f"  題目 {current_question}: {y2-y1}px")
            current_question += 1

    print(f"\n完成！共裁切 {len(all_cropped)} 題")
    return all_cropped


def process_year_auto(year: str):
    """
    自動偵測並裁切題目
    """
    source_year_dir = SOURCE_DIR / year

    if not source_year_dir.exists():
        print(f"錯誤: 找不到目錄 {source_year_dir}")
        return []

    # 讀取所有圖片檔案並排序
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

        # 第一頁通常是封面，跳過
        if page_num == 1:
            print(f"\n第 {page_num} 頁: 封面，跳過")
            continue

        print(f"\n第 {page_num} 頁:")
        cropped = crop_questions_simple(image_path, year, page_num)
        all_cropped.extend(cropped)

    print(f"\n{'='*60}")
    print(f"完成！{year} 年共裁切 {len(all_cropped)} 題")
    print('='*60)

    return all_cropped


def main():
    """主程式"""
    # 設定 Windows 控制台編碼
    if sys.platform == 'win32':
        import locale
        sys.stdout.reconfigure(encoding='utf-8')

    print("試卷題目自動裁切工具")
    print("="*60)

    # 檢查 OpenCV 是否可用
    try:
        import cv2
        print("OK - OpenCV 已安裝")
    except ImportError:
        print("ERROR - 請先安裝 OpenCV: pip install opencv-python")
        sys.exit(1)

    years = ['2020', '2021', '2022', '2023']

    for year in years:
        try:
            process_year_auto(year)
        except Exception as e:
            print(f"\nERROR - 處理 {year} 年時發生錯誤: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*60)
    print("所有年份處理完成！")
    print("="*60)
    print("\n下一步:")
    print("1. 檢查 public/images/exams/[year]/questions/ 中的圖片")
    print("2. 執行: node scripts/organize_images.js all")
    print("3. 使用網頁介面匯入試卷")


if __name__ == "__main__":
    main()
