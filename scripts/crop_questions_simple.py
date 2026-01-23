#!/usr/bin/env python3
"""
簡單版本：根據試卷格式直接處理
基於觀察：第1頁是封面，之後每頁約3-4題
"""

import os
import sys
import re
import json
from pathlib import Path
from PIL import Image
import cv2
import numpy as np

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
SOURCE_DIR = BASE_DIR / "his" / "image"
OUTPUT_DIR = BASE_DIR / "public" / "images" / "exams"
DATA_DIR = BASE_DIR / "scripts" / "output"

# 確保輸出目錄存在
DATA_DIR.mkdir(parents=True, exist_ok=True)


def find_horizontal_gaps(image_path: Path, min_gap=40):
    """找出水平空白區域來分割題目"""
    img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return []

    height, width = img.shape

    # 計算每一行的平均亮度（白色=255，黑色=0）
    row_brightness = np.mean(img, axis=1)

    # 找出明顯的空白行（亮度高的區域）
    threshold = 240  # 接近白色
    white_rows = row_brightness > threshold

    # 找出連續的空白區域
    gaps = []
    in_gap = False
    gap_start = 0

    for i, is_white in enumerate(white_rows):
        if is_white:
            if not in_gap:
                gap_start = i
                in_gap = True
        else:
            if in_gap and (i - gap_start) >= min_gap:
                gaps.append((gap_start, i))
            in_gap = False

    return gaps


def crop_page_smart(image_path: Path, expected_questions=3):
    """智能裁切：根據空白區域分割題目"""
    img = Image.open(image_path)
    width, height = img.size

    # 找出空白區域
    gaps = find_horizontal_gaps(image_path)

    if len(gaps) == 0:
        # 沒有明顯空白，平均分割
        section_height = height // expected_questions
        boundaries = [
            (i * section_height, (i+1) * section_height if i < expected_questions-1 else height)
            for i in range(expected_questions)
        ]
    else:
        # 根據空白區域分割
        boundaries = []
        start_y = 0

        # 過濾掉頁首的大空白
        filtered_gaps = [g for g in gaps if g[0] > height * 0.1]

        for gap_start, gap_end in filtered_gaps:
            if gap_start - start_y > 100:  # 確保有足夠內容
                boundaries.append((start_y, gap_start))
            start_y = gap_end

        # 加上最後一段
        if height - start_y > 100:
            boundaries.append((start_y, height))

    return boundaries


def process_year_simple(year: str):
    """簡單處理：基於觀察的頁面結構"""
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

    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(parents=True, exist_ok=True)

    all_cropped = []
    question_num = 1

    for page_idx, image_path in enumerate(files):
        page_num = page_idx + 1

        # 跳過封面
        if page_num == 1:
            print(f"第 {page_num} 頁: 封面，跳過")
            continue

        print(f"\n第 {page_num} 頁:")

        # 智能裁切
        boundaries = crop_page_smart(image_path)

        if not boundaries:
            print("  無法分割，跳過")
            continue

        print(f"  找到 {len(boundaries)} 個題目區域")

        # 開啟並裁切
        img = Image.open(image_path)

        for i, (y_start, y_end) in enumerate(boundaries):
            # 加上邊距
            margin = 10
            y1 = max(0, y_start - margin)
            y2 = min(img.height, y_end + margin)

            # 裁切
            cropped = img.crop((0, y1, img.width, y2))

            # 儲存
            output_path = year_dir / f"q{question_num:03d}.jpg"
            cropped.save(output_path, 'JPEG', quality=95)
            all_cropped.append(output_path)

            print(f"  題目 {question_num}: {y2-y1}px")
            question_num += 1

    print(f"\n完成！共裁切 {len(all_cropped)} 題")

    # 生成 JSON
    generate_exam_json(year, all_cropped)

    return all_cropped


def generate_exam_json(year: str, image_paths):
    """生成試卷 JSON 檔案"""
    exam_data = {
        "title": f"{year}年感染症專科醫師甄審筆試",
        "year": int(year),
        "category": "WRITTEN",
        "questions": []
    }

    for idx, img_path in enumerate(image_paths):
        rel_path = img_path.relative_to(BASE_DIR / "public")
        url_path = "/" + str(rel_path).replace("\\", "/")

        question = {
            "order": idx,
            "content": f"第 {idx + 1} 題",
            "type": "CHOICE",
            "imageUrl": url_path,
            "imageUrls": [url_path],
            "options": [
                {"text": "A", "order": 0},
                {"text": "B", "order": 1},
                {"text": "C", "order": 2},
                {"text": "D", "order": 3},
                {"text": "E", "order": 4}
            ],
            "correctAnswer": "",
            "answerExplanation": ""
        }
        exam_data["questions"].append(question)

    # 儲存 JSON
    output_path = DATA_DIR / f"exam_{year}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(exam_data, f, ensure_ascii=False, indent=2)

    print(f"已生成 JSON: {output_path}")


def main():
    """主程式"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("試卷題目裁切工具 (智能版本)")
    print("="*60)

    try:
        import cv2
        import numpy
        print("OK - 套件已安裝")
    except ImportError:
        print("正在安裝必要套件...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python", "numpy"])
        import cv2
        import numpy

    years = ['2020', '2021', '2022', '2023']

    for year in years:
        try:
            process_year_simple(year)
        except Exception as e:
            print(f"\nERROR - {year}: {e}")
            import traceback
            traceback.print_exc()

    # 複製 JSON 到 public
    print("\n複製 JSON 到 public 目錄...")
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)

    for json_file in DATA_DIR.glob("exam_*.json"):
        shutil.copy(json_file, public_output / json_file.name)
        print(f"  已複製: {json_file.name}")

    print("\n" + "="*60)
    print("處理完成！")
    print("="*60)
    print("\n下一步:")
    print("1. 前往 http://localhost:3000/admin/import")
    print("2. 點擊「開始批量匯入」")
    print("3. 等待匯入完成")


if __name__ == "__main__":
    main()
